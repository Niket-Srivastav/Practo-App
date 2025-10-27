package com.practo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DoctorDto {
    private Integer doctorId;
    private String doctorName;
    private String speciality;
    private Integer experienceYears;
    private Double consultationFee;
    private String location;
}
