package com.practo.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor; // JpaSpecificationExecutor provides `findAll(Specification, Pageable)`

import com.practo.entity.Doctor;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Integer>, JpaSpecificationExecutor<Doctor> {
    Doctor findByUserId(Integer userId);
}
