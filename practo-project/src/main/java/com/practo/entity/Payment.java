package com.practo.entity;

import java.sql.Timestamp;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer paymentId;
    
    @ManyToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;
    
    @Column(nullable = false)
    private Double amount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;
    
    @Column(name = "paid_on")
    private Timestamp paidOn;
    
    @Column(name = "gateway_order_id")
    private String gatewayOrderId;

    @Column(name = "gateway_payment_id")
    private String gatewayPaymentId;

    public enum PaymentStatus {
        PENDING, SUCCESS, FAILED, REFUNDED
    }
}