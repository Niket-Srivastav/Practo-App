package com.practo.service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import com.practo.entity.Person;
import com.practo.entity.Doctor;
import com.practo.repository.PersonRepository;
import com.practo.repository.DoctorRepository;
import com.practo.security.JwtUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.practo.dto.AuthResponse;
import com.practo.dto.LoginRequest;
import com.practo.dto.RegisterDoctorRequest;
import com.practo.dto.RegisterUserRequest;



@Service
@RequiredArgsConstructor
public class AuthService{

    private final  PersonRepository personRepository;
    private final DoctorRepository doctorRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoderService;


    public Person registerUser(RegisterUserRequest request){
        if(personRepository.existsByEmail(request.getEmail())){
            throw new IllegalArgumentException("Email already exists");
        }
        
        Person p = Person.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoderService.encode(request.getPassword()))
            .role(Person.Role.PATIENT)
            .location(request.getLocation())
            .build();

        return personRepository.save(p);
    }

    @CacheEvict(value = "doctorSearch", allEntries = true)
    public Doctor registerDoctor(RegisterDoctorRequest request){
        if(personRepository.existsByEmail(request.getEmail())){
            throw new IllegalArgumentException("Email already exists");
        }
        
        Person p = Person.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoderService.encode(request.getPassword()))
            .role(Person.Role.DOCTOR)
            .location(request.getLocation())
            .build();
        p = personRepository.save(p);
        Doctor d = Doctor.builder()
            .userId(p.getUserId())
            .speciality(request.getSpeciality())
            .experienceYears(request.getExperienceYears())
            .consultationFee(request.getConsultationFee())
            .build();

        return doctorRepository.save(d);
    }

    public AuthResponse login(LoginRequest request){
        Person person = personRepository.findByEmail(request.getEmail())
            .orElseThrow(()->new IllegalArgumentException("Invalid email or password"));

        if(!passwordEncoderService.matches(request.getPassword(), person.getPasswordHash())){
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(person);
        return new AuthResponse(token, person.getUserId(), person.getRole().name(), jwtUtil.getExpirationTimeInSeconds());
    }

}