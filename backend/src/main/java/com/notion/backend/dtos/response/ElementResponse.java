package com.notion.backend.dtos.response;

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
    private String data;
    private String style;
    private String transform;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
