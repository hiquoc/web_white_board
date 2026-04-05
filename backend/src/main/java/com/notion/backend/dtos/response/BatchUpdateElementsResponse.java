package com.notion.backend.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

/**
 * Response DTO for batch element update operations
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateElementsResponse {
    
    /**
     * IDs of elements that were created
     */
    private List<UUID> createdIds;
    
    /**
     * IDs of elements that were updated
     */
    private List<UUID> updatedIds;
    
    /**
     * IDs of elements that were deleted
     */
    private List<UUID> deletedIds;
    
    /**
     * Full responses for all affected elements (for creates and updates)
     */
    private List<ElementResponse> elements;
}