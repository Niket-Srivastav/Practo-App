package com.practo.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalTimeSerializer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponse {
    private Integer availabilityId;
    
    @JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = LocalDateSerializer.class)
    private LocalDate availableDate;

    @JsonFormat(pattern = "HH:mm:ss", shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = LocalTimeSerializer.class)
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm:ss", shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = LocalTimeSerializer.class)
    private LocalTime endTime;
    
    private Boolean isBooked;
}
