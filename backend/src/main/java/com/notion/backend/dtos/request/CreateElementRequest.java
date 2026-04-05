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
public class CreateElementRequest {
    private UUID id;

    @NotNull
    private UUID projectId;

    private UUID userId;

    @NotNull
    private ElementType type;

    @NotNull
    private JsonNode data;

    @NotNull
    private JsonNode style;

    @NotNull
    private JsonNode transform;
}
