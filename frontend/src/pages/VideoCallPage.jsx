import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from '../contexts/AuthContext'
import { videoCallAPI } from '../api/client'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader, AlertCircle } from 'lucide-react'

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export default function VideoCallPage() {
  const { appointmentId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // ── DOM refs ──────────────────────────────────────────────────────────
  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)

  // ── Mutable refs (don't trigger re-renders) ───────────────────────────
  const pcRef               = useRef(null)   // RTCPeerConnection
  const stompRef            = useRef(null)   // STOMP client
  const localStreamRef      = useRef(null)   // Local MediaStream
  const roomIdRef           = useRef(null)   // Signaling room ID
  const pendingCandidatesRef = useRef([])    // ICE candidates queued before setRemoteDescription
  const makingOfferRef      = useRef(false)  // True while onnegotiationneeded is running
  const ignoreOfferRef      = useRef(false)  // Polite-peer: impolite ignores colliding offers

  // ── UI state ──────────────────────────────────────────────────────────
  const [isMuted,        setIsMuted]        = useState(false)
  const [isVideoOff,     setIsVideoOff]     = useState(false)
  const [status,         setStatus]         = useState('Initializing...')
  const [hasRemoteStream, setHasRemoteStream] = useState(false)
  const [error,          setError]          = useState(null)

  // Patient is the polite peer: backs off during offer collisions.
  // Doctor is the impolite peer: keeps their own offer.
  const isPolite = user?.role === 'PATIENT'

  // ── Main init effect ──────────────────────────────────────────────────
  useEffect(() => {
    let active = true

    async function init() {
      try {
        // 1. Fetch room token — validates appointment & authorization
        setStatus('Verifying appointment...')
        const res = await videoCallAPI.getToken(appointmentId)
        const { roomId } = res.data.data
        if (!active) return
        roomIdRef.current = roomId

        // 2. Capture local camera and microphone
        setStatus('Starting camera...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }

        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        // 3. Build the RTCPeerConnection and hook up events
        buildPeerConnection(stream)

        // 4. Open the WebSocket signaling channel
        connectSignaling(roomId)

      } catch (err) {
        if (!active) return
        if (err.name === 'NotAllowedError') {
          setError('Camera or microphone permission denied. Please allow access and try again.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found on this device.')
        } else {
          setError(err.response?.data?.message || 'Failed to start call. Please try again.')
        }
      }
    }

    init()

    return () => {
      active = false
      cleanup()
    }
  }, [appointmentId])

  // ── Cleanup on tab/window close ───────────────────────────────────────
  useEffect(() => {
    const handleExit = () => {
      if (roomIdRef.current) sendSignal(roomIdRef.current, { type: 'hangup' })
      cleanup()
    }
    window.addEventListener('beforeunload', handleExit)
    return () => window.removeEventListener('beforeunload', handleExit)
  }, [])

  // ── RTCPeerConnection setup ───────────────────────────────────────────
  function buildPeerConnection(localStream) {
    const pc = new RTCPeerConnection(ICE_CONFIG)
    pcRef.current = pc

    // Add our local tracks so the other peer receives our camera + mic
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

    // Remote tracks arriving → show them in the remote video element
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
        setHasRemoteStream(true)
      }
    }

    // Browser discovered a new network path → forward it to the other peer
    pc.onicecandidate = (event) => {
      if (event.candidate && roomIdRef.current) {
        sendSignal(roomIdRef.current, { type: 'ice-candidate', data: event.candidate })
      }
    }

    // ICE completely failed → attempt a restart (handles mid-call network changes)
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') pc.restartIce()
    }

    // Overall connection state → update the status banner
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState
      if (s === 'connected')    setStatus('In Call')
      if (s === 'connecting')   setStatus('Connecting...')
      if (s === 'disconnected') setStatus('Connection lost — reconnecting...')
      if (s === 'failed')       setStatus('Connection failed')
    }

    // Negotiation needed fires after addTrack; we create + send the offer here.
    // This is the "perfect negotiation" pattern — the browser tells us WHEN to offer.
    // Guard: only send an offer if the STOMP connection is up (otherwise the message is lost).
    pc.onnegotiationneeded = async () => {
      try {
        if (!stompRef.current?.connected) return // signaling not ready yet
        makingOfferRef.current = true
        await pc.setLocalDescription()
        sendSignal(roomIdRef.current, { type: 'offer', data: pc.localDescription })
      } catch (err) {
        console.error('Negotiation error:', err)
      } finally {
        makingOfferRef.current = false
      }
    }
  }

  // ── WebSocket / STOMP signaling ───────────────────────────────────────
  function connectSignaling(roomId) {
    setStatus('Waiting for other participant...')

    const client = new Client({
      // SockJS provides fallback from WebSocket → HTTP long-polling
      webSocketFactory: () => new SockJS('/ws/video-call'),
      // JWT sent in the STOMP CONNECT frame (validated by WebSocketAuthInterceptor)
      connectHeaders: { Authorization: `Bearer ${user.token}` },

      onConnect: () => {
        // Subscribe to this room's broadcast topic
        client.subscribe(`/topic/room/${roomId}`, async (message) => {
          const signal = JSON.parse(message.body)
          // The server broadcasts to everyone, including the sender.
          // Discard messages we sent ourselves to avoid self-signaling loops.
          if (String(signal.senderId) === String(user.userId)) return
          await handleSignal(signal)
        })

        // Announce presence so the other peer (if already waiting) can start negotiation.
        // This solves the race where the first peer's offer is lost before the second subscribes.
        sendSignal(roomId, { type: 'ready' })
      },

      onStompError: () => {
        setError('Signaling connection failed. Please refresh and try again.')
      },
    })

    client.activate()
    stompRef.current = client
  }

  // ── Perfect Negotiation signal handler ───────────────────────────────
  async function handleSignal(signal) {
    const pc = pcRef.current
    if (!pc) return

    try {
      switch (signal.type) {

        case 'offer': {
          // A collision: we're in the middle of making our own offer
          const collision = makingOfferRef.current || pc.signalingState !== 'stable'
          ignoreOfferRef.current = !isPolite && collision
          if (ignoreOfferRef.current) return // impolite peer discards the colliding offer

          // Polite peer (or no collision): accept the offer
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data))

          // Now that remoteDescription is set, flush any queued ICE candidates
          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c))
          }
          pendingCandidatesRef.current = []

          await pc.setLocalDescription()   // auto-creates the answer
          sendSignal(roomIdRef.current, { type: 'answer', data: pc.localDescription })
          setStatus('Connecting...')
          break
        }

        case 'answer': {
          // Only accept an answer when we have a pending offer
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.data))

            // Flush queued ICE candidates
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c))
            }
            pendingCandidatesRef.current = []
            setStatus('Connecting...')
          }
          break
        }

        case 'ice-candidate': {
          if (pc.remoteDescription) {
            // Remote description is ready → apply the candidate immediately
            await pc.addIceCandidate(new RTCIceCandidate(signal.data))
          } else {
            // Remote description not set yet → queue it to apply later
            pendingCandidatesRef.current.push(signal.data)
          }
          break
        }

        case 'ready': {
          // The other peer just joined. If we're the impolite peer (DOCTOR),
          // create a fresh offer so the newly-subscribed peer receives it.
          if (!isPolite) {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            sendSignal(roomIdRef.current, { type: 'offer', data: pc.localDescription })
          }
          break
        }

        case 'hangup': {
          setStatus('Other participant ended the call')
          setTimeout(() => navigate('/appointments'), 3000)
          break
        }

        default:
          break
      }
    } catch (err) {
      console.error('Signal handling error:', err)
    }
  }

  // ── Send a signaling message via STOMP ────────────────────────────────
  function sendSignal(roomId, signal) {
    const client = stompRef.current
    if (client?.connected && roomId) {
      client.publish({
        destination: `/app/signal/${roomId}`,
        body: JSON.stringify({ ...signal, senderId: String(user.userId) }),
      })
    }
  }

  // ── Controls ──────────────────────────────────────────────────────────
  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled) }
  }

  function toggleVideo() {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setIsVideoOff(!track.enabled) }
  }

  function hangUp() {
    if (roomIdRef.current) sendSignal(roomIdRef.current, { type: 'hangup' })
    cleanup()
    navigate('/appointments')
  }

  function cleanup() {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    stompRef.current?.deactivate()
    localStreamRef.current = null
    pcRef.current = null
  }

  // ── Error screen ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-[#060b18] flex items-center justify-center p-4">
        <div className="glass rounded-2xl border border-red-500/20 p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Cannot Start Call</h2>
            <p className="text-slate-400 text-sm mt-1">{error}</p>
          </div>
          <button onClick={() => navigate('/appointments')} className="btn-secondary w-full justify-center">
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  // ── Call screen ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">

      {/* Status bar — overlaid on top of the remote video */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            status === 'In Call'
              ? 'bg-emerald-400 animate-pulse'
              : status.includes('failed') || status.includes('ended')
                ? 'bg-red-400'
                : 'bg-amber-400 animate-pulse'
          }`} />
          <span className="text-white/80 text-sm font-medium">{status}</span>
        </div>
        <span className="text-white/40 text-xs">Appointment #{appointmentId}</span>
      </div>

      {/* Remote video — full screen */}
      <div className="flex-1 relative bg-slate-900">
        {/* Waiting placeholder shown until the remote stream arrives */}
        {!hasRemoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader size={32} className="animate-spin text-cyan-500/50" />
            <p className="text-sm">{status}</p>
          </div>
        )}

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local video — Picture-in-Picture overlay */}
        <div className="absolute bottom-24 right-4 w-36 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted   /* MUST be muted: prevents hearing your own mic through speakers */
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <VideoOff size={20} className="text-slate-500" />
            </div>
          )}
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-black/90 backdrop-blur border-t border-white/8 py-4 px-6 flex items-center justify-center gap-5">

        {/* Mute / Unmute */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
              : 'bg-white/8 border border-white/15 text-white hover:bg-white/15'
          }`}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Camera on / off */}
        <button
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isVideoOff
              ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
              : 'bg-white/8 border border-white/15 text-white hover:bg-white/15'
          }`}
        >
          {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
        </button>

        {/* End call */}
        <button
          onClick={hangUp}
          title="End call"
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
        >
          <PhoneOff size={20} />
        </button>

      </div>
    </div>
  )
}
