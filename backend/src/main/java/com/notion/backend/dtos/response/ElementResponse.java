package com.notion.backend.dtos.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.notion.backend.enums.ElementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElementResponse {
    private UUID id;
    private UUID projectId;
    private UUID userId;
    private ElementType type;
    private JsonNode data;
    private JsonNode style;
    private JsonNode transform;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
