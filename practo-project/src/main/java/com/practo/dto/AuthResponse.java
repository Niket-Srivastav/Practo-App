package com.practo.dto;
import lombok.*;

@Data @AllArgsConstructor 
public class AuthResponse {
    private String token;
    private Integer userId;
    private String role;
    private long expiresIn;
}
