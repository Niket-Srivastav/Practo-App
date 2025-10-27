package com.practo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.practo.entity.Appointment;
import com.practo.entity.Payment;
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByAppointment(Appointment appointment);
    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);
    Optional<Payment> findByGatewayPaymentId(String gatewayPaymentId);
}
