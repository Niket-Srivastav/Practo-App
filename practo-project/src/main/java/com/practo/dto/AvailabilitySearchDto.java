package com.practo.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AvailabilitySearchDto {
    private List<AvailabilityResponse> availabilityResponse;
    private Long totalCount; 
}