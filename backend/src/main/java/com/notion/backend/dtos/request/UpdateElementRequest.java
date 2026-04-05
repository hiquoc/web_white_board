package com.notion.backend.dtos.request;

import com.fasterxml.jackson.databind.JsonNode;
import com.notion.backend.enums.ElementType;
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
public class UpdateElementRequest {
    private UUID projectId;
    private UUID userId;
    private ElementType type;
    private JsonNode data;
    private JsonNode style;
    private JsonNode transform;
}
