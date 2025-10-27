package com.practo.specification;

import org.springframework.data.jpa.domain.Specification;

import com.practo.entity.Doctor;
import com.practo.entity.Person;

import jakarta.persistence.criteria.Join;

public class DoctorSpecification {

    public static Specification<Doctor> hasSpeciality(String speciality) {
        return (root, query, criteriaBuilder) -> {
            if (speciality == null || speciality.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("speciality"), speciality);
        };
    }

    public static Specification<Doctor> hasLocation(String location) {
        return (root, query, criteriaBuilder) -> {
            if (location == null || location.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            Join<Doctor, Person> personJoin = root.join("person");
            return criteriaBuilder.like(
                criteriaBuilder.lower(personJoin.get("location")), 
                "%" + location.toLowerCase() + "%"
            );
        };
    }
}
