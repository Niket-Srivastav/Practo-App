package com.practo.NotificationService.DTO;

import java.time.LocalTime;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data; 
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationEvent {
    private String eventId;
    private String recipientEmail;
    private String doctorName;
    private String patientName;
    private LocalTime appointmentTime;
    private LocalDate appointmentDate;
    private Double consultationFee;
    private String appointmentId;
    private LocalDateTime createdAt;
    private Map<String, Object> templateData;
}

