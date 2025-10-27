package com.practo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.practo.dto.ApiPayload;
import com.practo.dto.AuthResponse;
import com.practo.dto.LoginRequest;
import com.practo.dto.RegisterDoctorRequest;
import com.practo.dto.RegisterUserRequest;
import com.practo.entity.Doctor;
import com.practo.entity.Person;
import com.practo.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    @Autowired
    private AuthService authService;

    @PostMapping("/register/user")
    public ResponseEntity<ApiPayload<String>> registerUser(@Valid @RequestBody RegisterUserRequest req) {
        Person saved = authService.registerUser(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiPayload.<String>builder()
                        .success(true)
                        .message("User registered successfully")
                        .data("User ID: " + saved.getUserId())
                        .build());  
    }

    @PostMapping("/register/doctor")
    public ResponseEntity<ApiPayload<String>> registerDoctor(@Valid @RequestBody RegisterDoctorRequest req) {
        Doctor saved = authService.registerDoctor(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiPayload.<String>builder()
                        .success(true)
                        .message("Doctor registered successfully")
                        .data("Doctor ID: " + saved.getDoctorId())
                        .build());  
    }

    @PostMapping("/login")
    public ResponseEntity<ApiPayload<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(ApiPayload.<AuthResponse>builder()
                .success(true)
                .message("Login successful")
                .data(response)
                .build());
    }
}

