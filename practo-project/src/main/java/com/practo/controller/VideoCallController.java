package com.practo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.practo.dto.ApiPayload;
import com.practo.dto.VideoCallTokenResponse;
import com.practo.service.VideoCallService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/video-call")
@RequiredArgsConstructor
public class VideoCallController {
    private final VideoCallService videoCallService;

    @GetMapping("/token/{appointmentId}")
    public ResponseEntity<ApiPayload<VideoCallTokenResponse>> getCallToken(
            @PathVariable Integer appointmentId,
            @RequestAttribute("userId") Integer userId
    ) {
        VideoCallTokenResponse response = videoCallService.generateCallToken(appointmentId, userId);
        return ResponseEntity.ok(ApiPayload.<VideoCallTokenResponse>builder()
                .success(true)
                .message("Call token generated")
                .data(response)
                .build());
    }
}
