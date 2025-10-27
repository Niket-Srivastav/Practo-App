package com.practo.dto;
import jakarta.validation.constraints.*;

import lombok.*;
@Getter
@Setter

public class LoginRequest {
    @NotBlank private String username;
    @NotBlank @Email private String email;
    @NotBlank private String password;
}