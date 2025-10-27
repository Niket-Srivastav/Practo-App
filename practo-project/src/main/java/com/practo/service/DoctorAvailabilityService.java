package com.practo.service;

import java.time.LocalDate;
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

    @CacheEvict(value = "doctorAvailability", allEntries = true)
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

}
