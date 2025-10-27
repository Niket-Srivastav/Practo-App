package com.practo.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class ApiPayload<T> {

    private boolean success;
    private String message;
    private T data;

}