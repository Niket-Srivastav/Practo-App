package com.practo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AppointmentDetails {
    private Integer appointmentId;
    private String status;
    private String paymentStatus;
    private Double amount;
    private String doctorName;
    private String appointmentDate;
    private String appointmentTime;
}