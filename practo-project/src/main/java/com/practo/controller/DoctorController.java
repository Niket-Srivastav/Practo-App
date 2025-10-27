package com.practo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.practo.dto.*;
import com.practo.service.DoctorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public ResponseEntity<ApiPayload<DoctorSearchResponse>> searchDoctors(
            @RequestParam(required = false) String speciality,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String sort
    ) {
        DoctorSearchResponse resp = doctorService.searchDoctors(speciality, location, page, limit, sort);
        return ResponseEntity.ok(new ApiPayload<>(
                true,
                "Doctors fetched successfully",
                resp
        ));
    }
}