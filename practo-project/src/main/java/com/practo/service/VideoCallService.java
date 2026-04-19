package com.practo.service;

import com.practo.entity.Appointment;
import com.practo.repository.AppointmentRepository;
import com.practo.dto.VideoCallTokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VideoCallService {

    private final AppointmentRepository appointmentRepository;

    public VideoCallTokenResponse generateCallToken(Integer appointmentId, Integer userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getStatus() != Appointment.Status.CONFIRMED) {
            throw new RuntimeException("Appointment is not in a callable state");
        }

        Integer doctorUserId = appointment.getAvailability().getDoctor().getUserId();
        Integer patientId = appointment.getPatientId();
        
        if (!userId.equals(doctorUserId) && !userId.equals(patientId)) {
            throw new RuntimeException("You are not authorized for this call");
        }

        String roomId = appointment.getRoomId();
        if (roomId == null) {
            roomId = "apt-" + appointmentId + "-" + UUID.randomUUID().toString().substring(0, 8);
            appointment.setRoomId(roomId);
            appointmentRepository.save(appointment);
        }

        // 5. Return the room ID
        return new VideoCallTokenResponse(roomId, appointmentId);
    }
}