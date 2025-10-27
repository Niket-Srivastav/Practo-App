package com.practo.service;

import java.sql.Timestamp;
import java.util.Optional;

import org.json.JSONObject;
import org.springframework.stereotype.Service;

import com.practo.dto.AppointmentDetails;
import com.practo.dto.BookingResponse;
import com.practo.dto.PaymentCallbackRequest;
import com.practo.entity.Appointment;
import com.practo.entity.DoctorAvailability;
import com.practo.entity.Payment;
import com.practo.entity.Person;
import com.practo.repository.AppointmentRepository;
import com.practo.repository.DoctorAvailabilityRepository;
import com.practo.repository.PaymentRepository;
import com.practo.repository.PersonRepository;
import com.razorpay.RazorpayException;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;

    private final DoctorAvailabilityRepository doctorAvailabilityRepository;

    private final PaymentRepository paymentRepository;

    private final PersonRepository personRepository;

    private final PaymentService paymentService;

    private final NotificationProducerService notificationProducerService;

    @Transactional
    public BookingResponse initiateBooking(Integer patientId, Integer availibilityId) throws RazorpayException{

        DoctorAvailability availability = doctorAvailabilityRepository.findByIdForUpdate(availibilityId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        
        if(availability.getIsBooked()) {
            throw new IllegalStateException("Slot already booked");
        }

        Person patient = personRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        
        Double consultationFee = availability.getDoctor().getConsultationFee();

        Appointment appointment = Appointment.builder()
                .patientId(patientId)
                .availabilityId(availibilityId)
                .status(Appointment.Status.WAITING)
                .bookedOn(new Timestamp(System.currentTimeMillis()))
                .build();
        appointment = appointmentRepository.save(appointment);

        availability.setIsBooked(true);
        doctorAvailabilityRepository.save(availability);

        String razorpayOrderId = paymentService.createRazorpayOrder(consultationFee);

        Payment payment = Payment.builder()
            .appointment(appointment)
            .amount(consultationFee)
            .status(Payment.PaymentStatus.PENDING)
            .gatewayOrderId(razorpayOrderId)
            .build();
        
        paymentRepository.save(payment);

        JSONObject checkoutOptions = paymentService.getCheckoutOptions(
            razorpayOrderId,
            consultationFee,
            patient.getEmail()
        );

        return BookingResponse.builder()
            .appointmentId(appointment.getAppointmentId())
            .gatewayOrderId(razorpayOrderId)
            .amount(consultationFee)
            .checkoutOptions(checkoutOptions.toString())
            .currency("INR")
            .build();

    }

    @Transactional
    public void handlePaymentCallback(PaymentCallbackRequest request){

        boolean isValid = paymentService.verifyPaymentSignatureUsingSDK(
            request.getOrderId(),
            request.getPaymentId(),
            request.getSignature()
        );

        if(!isValid) {
            throw new SecurityException("Invalid payment signature - possible tampering detected");
        }

        Payment payment = paymentRepository.findByGatewayOrderId(request.getOrderId())
            .orElseThrow(() -> new IllegalArgumentException("Payment record not found for order id: " + request.getOrderId()));

        Appointment appointment = appointmentRepository.findById(payment.getAppointment().getAppointmentId())
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found for id: " + payment.getAppointment().getAppointmentId()));

        
        if("captured".equals(request.getStatus()) || 
            "SUCCESS".equals(request.getStatus()) ){
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
            payment.setGatewayPaymentId(request.getPaymentId());
            payment.setPaidOn(new Timestamp(System.currentTimeMillis()));
            appointment.setStatus(Appointment.Status.CONFIRMED);
            
            var availability = appointment.getAvailability();

            Person doctor = availability.getDoctor().getPerson();

            Person patient = personRepository.findById(appointment.getPatientId())
                .orElseThrow(null);
            
            if(doctor != null && patient != null){
                // Send notification to doctor
                // Using NotificationProducerService
                notificationProducerService.sendAppointmentConfirmation(
                    doctor.getEmail(),
                    doctor.getUsername(),
                    patient.getUsername(),
                    availability.getStartTime(),
                    availability.getAvailableDate(),
                    payment.getAmount(),
                    appointment.getAppointmentId().toString()
                );

            }

        }else{
            payment.setStatus(Payment.PaymentStatus.FAILED);
            appointment.setStatus(Appointment.Status.FAILED);
            
            DoctorAvailability availability = doctorAvailabilityRepository.findByIdForUpdate(appointment.getAvailabilityId())
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
            availability.setIsBooked(false);
            doctorAvailabilityRepository.save(availability);
        }
        paymentRepository.save(payment);
        appointmentRepository.save(appointment);

    }

   public AppointmentDetails getAppointmentDetails(Integer appointmentId) {
        
        // Fetch appointment with related entities
        Appointment appointment = appointmentRepository.findById(appointmentId).orElseThrow(() -> 
            new IllegalArgumentException("Appointment not found for id: " + appointmentId));
        // Fetch associated payment
        Payment payment = paymentRepository
            .findByAppointment(appointment)
            .orElse(null);
        
        DoctorAvailability availability = appointment.getAvailability();
        
        return AppointmentDetails.builder()
            .appointmentId(appointment.getAppointmentId())
            .status(appointment.getStatus().toString())
            .paymentStatus(payment != null ? payment.getStatus().toString() : "PENDING")
            .amount(Optional.ofNullable(payment)
                    .map(Payment::getAmount)
                    .orElse(0.0))
            .doctorName(availability.getDoctor().getPerson().getUsername())
            .appointmentDate(availability.getAvailableDate().toString())
            .appointmentTime(availability.getStartTime().toString())
            .build();
    }

    @Transactional
    public void cancelAppointment(Integer appointmentId,Integer userId) throws RazorpayException {
          Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found for id: " + appointmentId));
        
        if(!appointment.getPatientId().equals(userId)) {
            throw new SecurityException("User not authorized to cancel this appointment");
        }

        if(appointment.getStatus() != Appointment.Status.CONFIRMED) {
            throw new IllegalStateException("Only confirmed appointments can be cancelled");
        }

        Payment payment = paymentRepository.findByAppointment(appointment)
            .orElseThrow(() -> new IllegalArgumentException("Payment record not found for appointment id: " + appointmentId));

        paymentService.initiateRefund(
                        payment.getGatewayPaymentId(),
                         payment.getAmount());

        appointment.setStatus(Appointment.Status.CANCELLED);
        appointmentRepository.save(appointment);

        payment.setStatus(Payment.PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

        DoctorAvailability availability = doctorAvailabilityRepository.findByIdForUpdate(appointment.getAvailabilityId())
            .orElseThrow(() -> new IllegalArgumentException("Slot not found"));

        availability.setIsBooked(false);
        doctorAvailabilityRepository.save(availability);
    }


}