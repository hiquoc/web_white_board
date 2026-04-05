package com.notion.backend.throwables;

public class NotFoundException extends AppException {
    public NotFoundException(String message) {
        super(message,"NOT_FOUND");
    }
}
