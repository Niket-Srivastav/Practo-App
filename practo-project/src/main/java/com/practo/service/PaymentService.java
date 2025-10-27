package com.practo.service;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;
    
    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    private RazorpayClient razorpayClient;

    public String createRazorpayOrder(Double consultationFee) throws RazorpayException {
        if(razorpayClient == null) {
            razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        }

        int amountInPaise = (int)(consultationFee * 100);
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);  
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "receipt_" + System.currentTimeMillis());

        Order order = razorpayClient.orders.create(orderRequest);
        return order.get("id");
    }

    public JSONObject getCheckoutOptions(String razorpayOrderId, Double consultationFee, String email) {
        int amountInPaise = (int)(consultationFee * 100);
        JSONObject options = new JSONObject();
        options.put("key", razorpayKeyId);
        options.put("amount", amountInPaise); 
        options.put("currency", "INR");
        options.put("order_id", razorpayOrderId);
        options.put("prefill", new JSONObject().put("email", email));
        options.put("callback_url", "http://localhost:8080/api/appointments/payment-callback");
        return options;
    }

    public boolean verifyPaymentSignatureUsingSDK(String orderId, String paymentId, String signature) {
       try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);
            Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
            return true;
        } catch (RazorpayException e) {
            return false;
        }
    }

    public String initiateRefund(String gatewayPaymentId, Double amount) throws RazorpayException {
        if(razorpayClient == null) {
            razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        }

        int amountInPaise = (int)(amount * 100);

        JSONObject refundRequest = new JSONObject();
        refundRequest.put("amount", amountInPaise);
        try {
            com.razorpay.Refund refund = razorpayClient.payments.refund(gatewayPaymentId, refundRequest);
            return refund.get("id");
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to initiate refund: " + e.getMessage());
        }
        
    }

    public JSONObject getPaymentDetails(String paymentId) throws RazorpayException {
        if (razorpayClient == null) {
            razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        }
        com.razorpay.Payment payment = razorpayClient.payments.fetch(paymentId);
        
        JSONObject details = new JSONObject();
        details.put("id", String.valueOf(payment.get("id")));
        details.put("order_id", String.valueOf(payment.get("order_id")));
        details.put("amount", String.valueOf(payment.get("amount")));
        details.put("status", String.valueOf(payment.get("status"))); // captured, failed, etc.
        details.put("method", String.valueOf(payment.get("method"))); // card, upi, netbanking
        details.put("email", String.valueOf(payment.get("email")));
        details.put("contact", String.valueOf(payment.get("contact")));
        return details;
    }
    
    /**
     * Verify webhook signature from Razorpay
     * - Prevents fake webhook calls
     * - Razorpay sends X-Razorpay-Signature header
     * - We calculate HMAC-SHA256(payload, webhook_secret)
     * - Compare with received signature
     */
    public boolean verifyWebhookSignature(String payload, String receivedSignature) {
        try {
            boolean isValid = Utils.verifyWebhookSignature(payload, receivedSignature, webhookSecret);
            return isValid;
        } catch (Exception e) {
            System.err.println("Webhook signature verification failed: " + e.getMessage());
            return false;
        }
    }

}
