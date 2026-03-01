package com.practo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.practo.dto.AvailabilityRequest;
import com.practo.dto.AvailabilityResponse;
import com.practo.dto.AvailabilitySearchDto;
import com.practo.dto.DoctorSlotInfo;
import com.practo.dto.DoctorSlots;
import com.practo.entity.Doctor;
import com.practo.entity.DoctorAvailability;
import com.practo.entity.Person;
import com.practo.repository.DoctorAvailabilityRepository;
import com.practo.repository.DoctorRepository;
import com.practo.repository.PersonRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorAvailabilityService {
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final DoctorRepository doctorRepository;
    private final PersonRepository personRepository;

    @CacheEvict(value = {"doctorAvailability", "doctorSlotInfo"}, allEntries = true)
    public DoctorAvailability addAvailability(Integer userId, AvailabilityRequest availability) {
        Person person = personRepository.findById(userId).orElseThrow(() -> new RuntimeException("Person not found"));
        if(!person.getRole().name().equals("DOCTOR")) {
            throw new IllegalArgumentException("Person is not a doctor");
        }
        Doctor doctor = doctorRepository.findByUserId(userId);
        if (doctor == null) {
            throw new RuntimeException("Doctor record not found for userId: " + userId);
        }

        DoctorAvailability slot = new DoctorAvailability();
        slot.setDoctor(doctor);
        slot.setAvailableDate(availability.getAvailableDate());
        slot.setStartTime(availability.getStartTime());
        slot.setEndTime(availability.getEndTime());
        slot.setIsBooked(false);

        return doctorAvailabilityRepository.save(slot);
    }

    @Cacheable(value = "doctorAvailability", key = "#doctorId + '_' + #date")
    public AvailabilitySearchDto getDoctorAvailability(Integer doctorId, LocalDate date, int page, int limit) {

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("startTime").ascending());

        Page<DoctorAvailability> availabilityPage = doctorAvailabilityRepository.findByDoctor_DoctorIdAndAvailableDate(doctorId, date, pageable);

        List<AvailabilityResponse> availabilityResponses = availabilityPage.getContent().stream()
            .map(slot -> AvailabilityResponse.builder()
                .availabilityId(slot.getAvailabilityId())
                .availableDate(slot.getAvailableDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .isBooked(slot.getIsBooked())
                .build())
            .toList();
        return AvailabilitySearchDto.builder()
                .availabilityResponse(availabilityResponses)
                .totalCount(availabilityPage.getTotalElements())
                .build();
    }

    @Cacheable(value = "doctorSlotInfo", key = "#userId + '_' + #date + '_' + #page + '_' + #limit")
    public DoctorSlots getDoctorSlotInfo(Integer userId, LocalDate date, int page, int limit) {
        Person person = personRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        if (!person.getRole().name().equals("DOCTOR")) {
            throw new IllegalArgumentException("Only doctors can access slot info");
        }
        Doctor doctor = doctorRepository.findByUserId(userId);
        if (doctor == null) {
            throw new RuntimeException("Doctor record not found for userId: " + userId);
        }
        int offset = (page - 1) * limit;
        List<Object[]> rows = doctorAvailabilityRepository
                .findSlotInfoByDoctorIdAndDate(doctor.getDoctorId(), date, limit, offset);

        // Column order matches the SELECT in the native query:
        // 0 availabilityId, 1 availableDate, 2 startTime, 3 endTime,
        // 4 isBooked, 5 patientId, 6 bookedOn, 7 appointmentStatus,
        // 8 patientUsername, 9 patientEmail
        List<DoctorSlotInfo> slotInfoList = rows.stream()
                .map(row -> DoctorSlotInfo.builder()
                        .availabilityId(row[0] != null ? ((Number) row[0]).intValue() : null)
                        .availableDate(row[1] != null ? ((java.sql.Date) row[1]).toLocalDate() : null)
                        .startTime(row[2] != null ? ((java.sql.Time) row[2]).toLocalTime() : null)
                        .endTime(row[3] != null ? ((java.sql.Time) row[3]).toLocalTime() : null)
                        .isBooked(row[4] != null ? (row[4] instanceof Boolean b ? b : ((Number) row[4]).intValue() == 1) : null)
                        .patientId(row[5] != null ? ((Number) row[5]).intValue() : null)
                        .bookedOn(row[6] != null ? ((java.sql.Timestamp) row[6]).toLocalDateTime() : null)
                        .appointmentStatus(row[7] != null ? row[7].toString() : null)
                        .patientUsername(row[8] != null ? row[8].toString() : null)
                        .patientEmail(row[9] != null ? row[9].toString() : null)
                        .build())
                .toList();
        long totalCount = doctorAvailabilityRepository
                .countSlotsByDoctorIdAndDate(doctor.getDoctorId(), date);

        return DoctorSlots.builder()
                .slots(slotInfoList)
                .totalcount(totalCount)
                .build();
    }

}
