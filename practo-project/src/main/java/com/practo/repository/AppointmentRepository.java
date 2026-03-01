package com.practo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.practo.entity.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    List<Appointment> findByPatientId(Integer patientId);
}
