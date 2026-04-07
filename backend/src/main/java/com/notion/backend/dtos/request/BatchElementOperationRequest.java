package com.notion.backend.dtos.request;

import com.fasterxml.jackson.databind.JsonNode;
import com.notion.backend.enums.ElementType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

/**
 * Request DTO for a single element operation within a batch update
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchElementOperationRequest {
    
    @NotNull
    private UUID id;
    
    @NotNull
    private UUID userId;
    
    @NotNull
    private UUID projectId;
    
    @NotNull
    private ElementType type;

    @NotNull
    private Map<String, Object> data;

    @NotNull
    private Map<String, Object> style;

    private Map<String, Object> transform;
    
    private Long version;
    
    @NotNull
    private UpdateType updateType;
    
    /**
     * Enum representing the type of operation to perform on an element
     */
    public enum UpdateType {
        CREATE,
        UPDATE,
        DELETE
    }
}