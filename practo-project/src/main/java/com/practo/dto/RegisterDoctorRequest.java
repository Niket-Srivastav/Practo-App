package com.practo.dto;

import lombok.*;
import jakarta.validation.constraints.*;

@Data
public class RegisterDoctorRequest {
    @NotBlank private String username;
    @NotBlank private String password;
    @NotBlank @Email private String email;
    @NotBlank private String speciality;
    @Min(0) private Integer experienceYears;
    @Min(0) private Double consultationFee;
    private String location;
}
