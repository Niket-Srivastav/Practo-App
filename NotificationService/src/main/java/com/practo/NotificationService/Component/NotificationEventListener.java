package com.practo.NotificationService.Component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;

import com.practo.NotificationService.DTO.NotificationEvent;
import com.practo.NotificationService.Service.NotificationService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Component
public class NotificationEventListener {
    
    private static final Logger logger  = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;

    @KafkaListener(topics = "appointment_notifications", groupId = "notification-service")
    @Retryable(value = {Exception.class}, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void handleNotificationEvent(
        @Payload NotificationEvent notificationEvent,
        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.OFFSET) long offset,
        @Header(value = KafkaHeaders.RECEIVED_TIMESTAMP, required = false) Long timestamp,
        Acknowledgment acknowledgment
        ){
            long startTime = System.currentTimeMillis();
            
            try {
                logger.info("Received NotificationEvent: {} from topic: {}, partition: {}, offset: {}, timestamp: {}",
                    notificationEvent, topic, partition, offset, timestamp);

                if(notificationEvent.getRecipientEmail() == null){
                    throw new IllegalArgumentException("Recipient email is null in NotificationEvent: " + notificationEvent);
                }
                // Process the notification event
                notificationService.processNotificationEvent(notificationEvent);

                // Manually acknowledge the message after successful processing
                acknowledgment.acknowledge();

                long endTime = System.currentTimeMillis();
                logger.info("Processed NotificationEvent: {} in {} ms", notificationEvent, (endTime - startTime));
            } catch (IllegalArgumentException e) {
                logger.error("Error processing NotificationEvent: {} from topic: {}, partition: {}, offset: {}. Error: {}",
                    notificationEvent, topic, partition, offset, e.getMessage());
                throw e;
            }
        }

    @KafkaListener(topics = "appointment_notifications.DLT", groupId = "notification-service-dlq")
    public void handleDeadLetterEvent(
        @Payload NotificationEvent notificationEvent,
        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
        Acknowledgment acknowledgment
    ) {
        try{
        logger.info("Received Dead Letter NotificationEvent: {} from topic: {}", notificationEvent, topic);
        // Process the dead letter event
        acknowledgment.acknowledge();
        } catch (Exception e) {
            logger.error("Error processing Dead Letter NotificationEvent: {} from topic: {}. Error: {}",
                notificationEvent, topic, e.getMessage());
            acknowledgment.acknowledge(); // Acknowledge to avoid reprocessing
        }
    }
}