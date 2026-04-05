package com.notion.backend.dtos.request;

import com.fasterxml.jackson.databind.JsonNode;
import com.notion.backend.enums.ElementType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateElementBatchItemRequest {
    @NotNull
    private UUID id;

    private UUID projectId;
    private UUID userId;
    private ElementType type;
    private JsonNode data;
    private JsonNode style;
    private JsonNode transform;
}
