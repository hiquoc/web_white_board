package com.notion.backend.throwables;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
    private final String errorCode;
    public AppException(String message,String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
