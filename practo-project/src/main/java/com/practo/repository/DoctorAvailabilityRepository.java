package com.practo.repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.practo.dto.DoctorSlots;
import com.practo.entity.DoctorAvailability;

import jakarta.persistence.LockModeType;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Integer> {
    Page<DoctorAvailability> findByDoctor_DoctorIdAndAvailableDate(Integer doctorId, LocalDate date, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT da FROM DoctorAvailability da WHERE da.availabilityId = :availabilityId")
    Optional<DoctorAvailability> findByIdForUpdate(Integer availabilityId);

    /**
     * Returns all slots for a doctor on a given date, left-joining appointment and
     * patient data so the doctor can see which slots are booked and by whom.
     */
    @Query(value = """
            SELECT da.availability_id   AS availabilityId,
                   da.available_date    AS availableDate,
                   da.start_time       AS startTime,
                   da.end_time         AS endTime,
                   da.is_booked        AS isBooked,
                   a.patient_id        AS patientId,
                   a.booked_on         AS bookedOn,
                   a.status            AS appointmentStatus,
                   p.username          AS patientUsername,
                   p.email             AS patientEmail,
                   a.appointment_id    AS appointmentId
            FROM doctor_availability da
            LEFT JOIN appointment a  ON da.availability_id = a.availability_id
            LEFT JOIN person p       ON a.patient_id       = p.user_id
            WHERE da.doctor_id = :doctorId
              AND da.available_date = :date
            ORDER BY da.start_time ASC
            LIMIT :limit
            OFFSET :offset
            """, nativeQuery = true)
    List<Object[]> findSlotInfoByDoctorIdAndDate(
            @Param("doctorId") Integer doctorId,
            @Param("date") LocalDate date,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = """
            SELECT COUNT(*)
            FROM doctor_availability da
            WHERE da.doctor_id = :doctorId
              AND da.available_date = :date
            """, nativeQuery = true)
    long countSlotsByDoctorIdAndDate(
            @Param("doctorId") Integer doctorId,
            @Param("date") LocalDate date);
}

