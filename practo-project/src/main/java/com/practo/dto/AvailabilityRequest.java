package com.practo.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AvailabilityRequest {
    private LocalDate availableDate;
    private LocalTime startTime;
    private LocalTime endTime;
}