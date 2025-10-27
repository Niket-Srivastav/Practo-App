package com.practo.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Doctor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer doctorId;

    @Column(nullable = false, unique = true)
    private Integer userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", referencedColumnName = "userId", insertable = false, updatable = false)
    private Person person;

    private String speciality;
    private Integer experienceYears;
    private Double consultationFee;
}
