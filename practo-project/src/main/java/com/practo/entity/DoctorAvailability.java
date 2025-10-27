package com.practo.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "Doctor_Availability")
public class DoctorAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer availabilityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    private LocalDate availableDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private Boolean isBooked = false;
}