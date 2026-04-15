package com.practo.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class VideoCallSignalingController {
    
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/signal/{roomId}")
    public void relaySignal(
            @DestinationVariable String roomId,
            @Payload String message,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        log.info("Relaying signal in room: {}", roomId);

        if (message != null) {
            messagingTemplate.convertAndSend(
                "/topic/room/" + roomId,
                message
            );
        }
    }
}
