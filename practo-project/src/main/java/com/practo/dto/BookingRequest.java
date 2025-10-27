package com.practo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequest {
    @NotNull(message= "Availability ID is required")
    private Integer availabilityId;
}
