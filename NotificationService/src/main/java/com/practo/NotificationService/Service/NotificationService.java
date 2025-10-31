package com.practo.NotificationService.Service;

import org.springframework.stereotype.Service;

import com.practo.NotificationService.DTO.NotificationEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;

    public void processNotificationEvent(NotificationEvent notificationEvent) {
        try {
            if(notificationEvent.getRecipientEmail() != null){
                emailService.SendAppointConfirmationEmail(notificationEvent);
            }
        } catch (Exception e) {
            log.error("Error processing notification event: {}", e.getMessage());
            throw e;
        }
    }
    
}
