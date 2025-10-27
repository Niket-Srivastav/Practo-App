package com.practo.repository;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.practo.entity.DoctorAvailability;

import jakarta.persistence.LockModeType;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Integer> {
    Page<DoctorAvailability> findByDoctor_DoctorIdAndAvailableDate(Integer doctorId, LocalDate date, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT da FROM DoctorAvailability da WHERE da.availabilityId = :availabilityId")
    Optional<DoctorAvailability> findByIdForUpdate(Integer availabilityId);
}

