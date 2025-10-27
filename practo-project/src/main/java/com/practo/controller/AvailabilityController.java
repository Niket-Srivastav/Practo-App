package com.practo.controller;

import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.practo.dto.ApiPayload;
import com.practo.dto.AvailabilityRequest;
import com.practo.dto.AvailabilityResponse;
import com.practo.dto.AvailabilitySearchDto;
import com.practo.entity.DoctorAvailability;
import com.practo.service.DoctorAvailabilityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {
    private final DoctorAvailabilityService availabilityService;
    
    @PostMapping("/add")
    public ResponseEntity<ApiPayload<String>> addAvailability(@RequestAttribute("userId") Integer userId,
                                  @Valid @RequestBody AvailabilityRequest request) {
                                    
        DoctorAvailability availability = availabilityService.addAvailability(userId, request);
        return ResponseEntity.ok(new ApiPayload<>(
            true, 
            "Availability slot created with ID: " + availability.getAvailabilityId(), 
            null));
    }

    @GetMapping("/{doctorId}")
    public ResponseEntity<ApiPayload<AvailabilitySearchDto>> getDoctorAvailability(
        @PathVariable Integer doctorId,
        @RequestParam LocalDate date,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(new ApiPayload<>(
            true,
            "Doctor availability fetched successfully",
            availabilityService.getDoctorAvailability(doctorId, date, page, limit)
        ));
    }
}