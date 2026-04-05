package com.notion.backend.controllers;

import com.notion.backend.dtos.ApiResponse;
import com.notion.backend.dtos.request.BatchUpdateElementsRequest;
import com.notion.backend.dtos.request.CreateElementsRequest;
import com.notion.backend.dtos.request.DeleteElementsRequest;
import com.notion.backend.dtos.request.UpdateElementRequest;
import com.notion.backend.dtos.request.UpdateElementsRequest;
import com.notion.backend.dtos.response.BatchUpdateElementsResponse;
import com.notion.backend.dtos.response.DeleteElementsResponse;
import com.notion.backend.dtos.response.ElementResponse;
import com.notion.backend.services.ElementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/elements")
@RequiredArgsConstructor
public class ElementController {
    private final ElementService elementService;

    @PostMapping
    public ResponseEntity<ApiResponse<List<ElementResponse>>> createElements(
            @Valid @RequestBody CreateElementsRequest request
    ) {
        List<ElementResponse> response = elementService.createElements(request.getElements());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<List<ElementResponse>>builder()
                        .success(true)
                        .message("Elements created")
                        .data(response)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ElementResponse>> updateElement(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateElementRequest request
    ) {
        ElementResponse response = elementService.updateElement(id, request);
        return ResponseEntity.ok(ApiResponse.<ElementResponse>builder()
                .success(true)
                .message("Element updated")
                .data(response)
                .build());
    }

    @PutMapping
    public ResponseEntity<ApiResponse<List<ElementResponse>>> updateElements(
            @Valid @RequestBody UpdateElementsRequest request
    ) {
        List<ElementResponse> response = elementService.updateElements(request.getElements());
        return ResponseEntity.ok(ApiResponse.<List<ElementResponse>>builder()
                .success(true)
                .message("Elements updated")
                .data(response)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<DeleteElementsResponse>> deleteElement(@PathVariable UUID id) {
        DeleteElementsResponse response = elementService.deleteElement(id);
        return ResponseEntity.ok(ApiResponse.<DeleteElementsResponse>builder()
                .success(true)
                .message("Element deleted")
                .data(response)
                .build());
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<DeleteElementsResponse>> deleteElements(
            @Valid @RequestBody DeleteElementsRequest request
    ) {
        DeleteElementsResponse response = elementService.deleteElements(request.getIds());
        return ResponseEntity.ok(ApiResponse.<DeleteElementsResponse>builder()
                .success(true)
                .message("Elements deleted")
                .data(response)
                .build());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<ElementResponse>>> getElementsByProject(@PathVariable UUID projectId) {
        List<ElementResponse> response = elementService.getElementsByProject(projectId);
        return ResponseEntity.ok(ApiResponse.<List<ElementResponse>>builder()
                .success(true)
                .message("Elements retrieved")
                .data(response)
                .build());
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<BatchUpdateElementsResponse>> batchUpdateElements(
            @Valid @RequestBody BatchUpdateElementsRequest request
    ) {
        BatchUpdateElementsResponse response = elementService.batchUpdateElements(request);
        return ResponseEntity.ok(ApiResponse.<BatchUpdateElementsResponse>builder()
                .success(true)
                .message("Elements batch updated")
                .data(response)
                .build());
    }
}
