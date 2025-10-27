package com.practo.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
public class RegisterUserRequest {
    @NotBlank private String username;
    @NotBlank private String password;
    @NotBlank @Email private String email;
    private String location;
}