package com.practo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.practo.entity.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    
}
