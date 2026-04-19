package com.practo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VideoCallTokenResponse {
    private String roomId;
    private Integer appointmentId;
}