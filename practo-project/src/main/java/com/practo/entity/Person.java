package com.practo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Person", uniqueConstraints={@UniqueConstraint(columnNames = {"email"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Person {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String location;

    public enum Role { PATIENT, DOCTOR, ADMIN }
}


