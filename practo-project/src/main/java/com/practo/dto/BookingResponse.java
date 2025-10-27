package com.practo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookingResponse {
    private Integer appointmentId;
    private String gatewayOrderId;
    private Double amount;
    private String currency;
    private String checkoutOptions;
}
