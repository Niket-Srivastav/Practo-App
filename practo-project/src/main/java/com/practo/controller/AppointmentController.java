package com.practo.controller;


import org.springframework.http.ResponseEntity;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.practo.dto.ApiPayload;
import com.practo.dto.AppointmentDetails;
import com.practo.dto.BookingRequest;
import com.practo.dto.BookingResponse;
import com.practo.dto.PaymentCallbackRequest;
import com.practo.service.AppointmentService;
import com.practo.service.PaymentService;
import com.razorpay.RazorpayException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final PaymentService paymentService;

    @PostMapping("/book")
    public ResponseEntity<ApiPayload<BookingResponse>> bookAppointment(@RequestAttribute("userId") Integer userId, 
                                                                        @Valid @RequestBody BookingRequest request) {
        try{
            BookingResponse response = appointmentService.initiateBooking(userId, request.getAvailabilityId());
            return ResponseEntity.ok(ApiPayload.<BookingResponse>builder()
                    .success(true)
                    .message("Appointment booked successfully")
                    .data(response)
                    .build());
        } catch (RazorpayException e) {
            return ResponseEntity.status(500).body(ApiPayload.<BookingResponse>builder()
                .success(false)
                .message("Payment gateway error. Please try again.")
                .build());
        }
    }

    @PostMapping("/razorpay-webhook")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String razorpaySignature) {
        
        try {
            // First verify webhook signature for security
            // This is CRITICAL - without this anyone can send fake webhooks
            if (!paymentService.verifyWebhookSignature(payload, razorpaySignature)) {
                System.err.println("Invalid webhook signature received");
                return ResponseEntity.ok("Invalid signature"); // Always return 200 for webhooks
            }

            JSONObject jsonPayload = new JSONObject(payload);
            String event = jsonPayload.getString("event");
            
            System.out.println("Received webhook event: " + event);

            // Process different webhook events
            if("payment.captured".equals(event)) {
                JSONObject paymentEntity = jsonPayload.getJSONObject("payload")
                    .getJSONObject("payment").getJSONObject("entity");

                String paymentId = paymentEntity.getString("id");
                String orderId = paymentEntity.getString("order_id");

                // Create callback request for our existing handler
                PaymentCallbackRequest callbackRequest = new PaymentCallbackRequest();
                callbackRequest.setRazorpay_order_id(orderId);
                callbackRequest.setRazorpay_payment_id(paymentId);
                callbackRequest.setRazorpay_signature(razorpaySignature);

                appointmentService.handlePaymentCallback(callbackRequest);
                System.out.println("Payment captured processed for order: " + orderId);
                return ResponseEntity.ok("Payment captured processed");
                
            } else if ("payment.failed".equals(event)) {
                JSONObject paymentEntity = jsonPayload.getJSONObject("payload")
                    .getJSONObject("payment").getJSONObject("entity");

                String orderId = paymentEntity.getString("order_id");
                System.out.println("Payment failed for order: " + orderId);
                
                // Handle payment failure
                PaymentCallbackRequest callbackRequest = new PaymentCallbackRequest();
                callbackRequest.setRazorpay_order_id(orderId);
                callbackRequest.setRazorpay_payment_id("");
                callbackRequest.setRazorpay_signature(razorpaySignature);

                appointmentService.handlePaymentCallback(callbackRequest);
                return ResponseEntity.ok("Payment failed processed");
            }

            return ResponseEntity.ok("Event acknowledged");

        } catch (Exception e) {
            System.err.println("Webhook processing error: " + e.getMessage());
            // Always return 200 for webhooks to prevent Razorpay retries
            return ResponseEntity.ok("Error logged: " + e.getMessage());
        }
    }

    @PostMapping("/payment-callback")
    public ResponseEntity<ApiPayload<String>> handlePaymentCallback(
        @RequestBody PaymentCallbackRequest request
    ) {
        System.out.println("Received payment callback for order: " + request.getRazorpay_order_id());
        try {
            appointmentService.handlePaymentCallback(request);
            
            return ResponseEntity.ok(ApiPayload.<String>builder()
                .success(true)
                .message("Payment processed successfully")
                .data("Booking confirmed")
                .build());
                
        } catch (SecurityException e) {
            // Invalid signature - possible fraud
            return ResponseEntity.status(403).body(ApiPayload.<String>builder()
                .success(false)
                .message("Invalid payment signature")
                .build());
                
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiPayload.<String>builder()
                .success(false)
                .message("Error processing payment")
                .build());
        }
    }

    @GetMapping("/{appointmentId}/status")
    public ResponseEntity<ApiPayload<AppointmentDetails>> getStatus(
        @PathVariable Integer appointmentId,
        @RequestAttribute("userId") Integer userId
    ) {
        try {
            AppointmentDetails details = appointmentService.getAppointmentDetails(appointmentId);         
            return ResponseEntity.ok(ApiPayload.<AppointmentDetails>builder()
                .success(true)
                .data(details)
                .build());
                
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiPayload.<AppointmentDetails>builder()
                .success(false)
                .message("Appointment not found")
                .build());
        }
    }

    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<ApiPayload<String>> cancelAppointment(
        @PathVariable Integer appointmentId,
        @RequestAttribute("userId") Integer userId
    ) {
        try {
            appointmentService.cancelAppointment(appointmentId,userId);         
            return ResponseEntity.ok(ApiPayload.<String>builder()
                .success(true)
                .message("Appointment cancelled successfully")
                .build());
                
        } catch (RazorpayException e) {
            return ResponseEntity.status(400).body(ApiPayload.<String>builder()
                .success(false)
                .message("Error cancelling appointment: " + e.getMessage())
                .build());
        }
    }

}
