package com.homekitchen.backend.dto;

public class ApiResponse {
    private String message;

    public ApiResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
