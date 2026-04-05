package com.notion.backend.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for batch updating elements
 * Contains a list of element operations (create, update, delete) for a specific project
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateElementsRequest {
    
    @NotNull
    private UUID projectId;
    
    @Valid
    @NotEmpty
    private List<BatchElementOperationRequest> elements;
}