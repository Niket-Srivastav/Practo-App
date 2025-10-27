package com.practo.entity;
import java.sql.Timestamp;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "appointment")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer appointmentId;

    @Column(name = "patient_id", nullable = false)
    private Integer patientId;

    @Column(name = "availability_id", nullable = false)
    private Integer availabilityId;

    @Column(name = "booked_on", nullable = false)
    private Timestamp bookedOn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "availability_id", referencedColumnName = "availabilityId", insertable = false, updatable = false)
    private DoctorAvailability availability;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", referencedColumnName = "userId", insertable = false, updatable = false)
    private Person patient;

    public enum Status { WAITING, CONFIRMED, CANCELLED, FAILED }
}
