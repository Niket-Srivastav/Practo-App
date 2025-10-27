package com.practo.dto;

import lombok.Data;

@Data
public class PaymentCallbackRequest {
    private String razorpay_order_id;
    private String razorpay_payment_id;
    private String razorpay_signature;

    public String getOrderId() {
        return razorpay_order_id;
    }
    public String getPaymentId() {
        return razorpay_payment_id;
    }
    public String getSignature() {
        return razorpay_signature;
    }

    public String getStatus() {
        // This will be set after fetching payment details from Razorpay
        // Or can be passed as additional field in webhook
        return "SUCCESS"; // Default assumption if signature is valid
    }
}
