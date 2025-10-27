package com.practo.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.practo.dto.NotificationDto;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationProducerService {
    
    private final KafkaTemplate<String, Object> kafkaTemplate;


    public void sendAppointmentConfirmation(
        String doctorEmail,
        String doctorName,
        String patientName,
        LocalTime appointmentTime,
        LocalDate appointmentDate,
        Double consultationFee,
        String appointmentId){
            Map<String, Object> templateData = Map.of(
                "appointmentTime", appointmentTime,
                "appointmentDate", appointmentDate,
                "consultationFee", String.format("₹%.2f", consultationFee)
            );

            NotificationDto notification = NotificationDto.builder()
                .eventId(UUID.randomUUID().toString())
                .recipientEmail(doctorEmail)
                .doctorName(doctorName)
                .patientName(patientName)
                .appointmentTime(appointmentTime)
                .appointmentDate(appointmentDate)
                .consultationFee(consultationFee)
                .appointmentId(appointmentId)
                .createdAt(LocalDateTime.now())
                .templateData(templateData)
                .build();

            try{
                kafkaTemplate.send("appointment_notifications",appointmentId ,notification);
                log.info("Sent appointment confirmation notification: {}", notification);
            } catch (Exception e) {
                log.error("Failed to send appointment confirmation notification: {}", notification, e);
            }
        }
    }
