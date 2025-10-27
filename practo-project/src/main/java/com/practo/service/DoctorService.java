package com.practo.service;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.practo.dto.DoctorDto;
import com.practo.dto.DoctorSearchResponse;
import com.practo.entity.Doctor;
import com.practo.entity.Person;
import com.practo.repository.DoctorRepository;
import com.practo.specification.DoctorSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;

    @Cacheable(value = "doctorSearch", key = "#speciality + '-' + #location + '-' + #page + '-' + #limit + '-' + #sort")
    public DoctorSearchResponse searchDoctors(String speciality, String location, int page, int limit, String sort) {
        
        Pageable pageable = PageRequest.of(page - 1, limit, getSortOrder(sort));
        
        // Build specification for both doctor and person filters
        Specification<Doctor> spec = buildSearchSpecification(speciality, location);

        Page<Doctor> doctorsPage = doctorRepository.findAll(spec, pageable);

        List<DoctorDto> doctorDtos = doctorsPage.getContent().stream()
            .map(this::mapToDoctorDto)
            .toList();

        return DoctorSearchResponse.builder()
                .totalCount(doctorsPage.getTotalElements())  
                .doctors(doctorDtos)
                .build();
    }

    private Specification<Doctor> buildSearchSpecification(String speciality, String location) {
        Specification<Doctor> spec = DoctorSpecification.hasSpeciality(speciality);
        
        if (location != null && !location.isEmpty()) {
            spec = spec.and(DoctorSpecification.hasLocation(location));
        }
        
        return spec;
    }

    private DoctorDto mapToDoctorDto(Doctor doc) {
        Person person = doc.getPerson();
        return DoctorDto.builder()
                .doctorId(doc.getDoctorId())
                .doctorName(person.getUsername())
                .speciality(doc.getSpeciality())
                .experienceYears(doc.getExperienceYears())
                .consultationFee(doc.getConsultationFee())
                .location(person.getLocation())
                .build();
    }

    private Sort getSortOrder(String sort) {
        if (sort == null) return Sort.unsorted();
        
        return switch (sort) {
            case "fee" -> Sort.by("consultationFee").ascending();       
            case "experience" -> Sort.by("experienceYears").descending(); 
            case "name" -> Sort.by("person.username").ascending(); 
            default -> Sort.unsorted();
        };
    }
}
