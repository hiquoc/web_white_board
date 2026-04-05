package com.notion.backend.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.notion.backend.dtos.request.BatchElementOperationRequest;
import com.notion.backend.dtos.request.BatchUpdateElementsRequest;
import com.notion.backend.dtos.request.CreateElementRequest;
import com.notion.backend.dtos.request.UpdateElementBatchItemRequest;
import com.notion.backend.dtos.request.UpdateElementRequest;
import com.notion.backend.dtos.response.BatchUpdateElementsResponse;
import com.notion.backend.dtos.response.DeleteElementsResponse;
import com.notion.backend.dtos.response.ElementResponse;
import com.notion.backend.enums.ElementType;
import com.notion.backend.models.Element;
import com.notion.backend.models.Project;
import com.notion.backend.repositories.ElementRepository;
import com.notion.backend.throwables.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ElementService {
    private final ElementRepository elementRepository;
    private final ProjectService projectService;

    @Transactional
    public List<ElementResponse> createElements(List<CreateElementRequest> requests) {
        List<Element> elements = requests.stream()
                .map(this::toEntity)
                .toList();

        return elementRepository.saveAll(elements).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ElementResponse updateElement(UUID id, UpdateElementRequest request) {
        Element element = getActiveElement(id);
        applyUpdate(element, request.getProjectId(), request.getUserId(), request.getType(),
                request.getData(), request.getStyle(), request.getTransform());
        return toResponse(elementRepository.save(element));
    }

    @Transactional
    public List<ElementResponse> updateElements(List<UpdateElementBatchItemRequest> requests) {
        List<Element> elements = requests.stream()
                .map(request -> {
                    Element element = getActiveElement(request.getId());
                    applyUpdate(element, request.getProjectId(), request.getUserId(), request.getType(),
                            request.getData(), request.getStyle(), request.getTransform());
                    return element;
                })
                .toList();

        return elementRepository.saveAll(elements).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DeleteElementsResponse deleteElement(UUID id) {
        Element element = getActiveElement(id);
        element.setDeletedAt(Instant.now());
        elementRepository.save(element);
        return DeleteElementsResponse.builder()
                .deletedIds(List.of(id))
                .build();
    }

    @Transactional
    public DeleteElementsResponse deleteElements(List<UUID> ids) {
        Instant deletedAt = Instant.now();
        List<Element> elements = ids.stream()
                .map(this::getActiveElement)
                .peek(element -> element.setDeletedAt(deletedAt))
                .toList();

        elementRepository.saveAll(elements);
        return DeleteElementsResponse.builder()
                .deletedIds(ids)
                .build();
    }

    @Transactional
    public BatchUpdateElementsResponse batchUpdateElements(BatchUpdateElementsRequest request) {
        List<UUID> createdIds = new java.util.ArrayList<>();
        List<UUID> updatedIds = new java.util.ArrayList<>();
        List<UUID> deletedIds = new java.util.ArrayList<>();
        List<ElementResponse> elementResponses = new java.util.ArrayList<>();
        
        // Verify project exists
        projectService.getProjectEntity(request.getProjectId());
        
        // Process each operation
        for (BatchElementOperationRequest operation : request.getElements()) {
            switch (operation.getUpdateType()) {
                case CREATE -> {
                    Element element = toEntityFromBatchOperation(operation);
                    Element savedElement = elementRepository.save(element);
                    createdIds.add(savedElement.getId());
                    elementResponses.add(toResponse(savedElement));
                }
                case UPDATE -> {
                    Element element = getActiveElement(operation.getId());
                    applyUpdate(element, operation.getProjectId(), operation.getUserId(), 
                            operation.getType(), operation.getData(), operation.getStyle(), 
                            operation.getTransform());
                    Element savedElement = elementRepository.save(element);
                    updatedIds.add(savedElement.getId());
                    elementResponses.add(toResponse(savedElement));
                }
                case DELETE -> {
                    Element element = getActiveElement(operation.getId());
                    element.setDeletedAt(Instant.now());
                    elementRepository.save(element);
                    deletedIds.add(element.getId());
                }
            }
        }
        
        return BatchUpdateElementsResponse.builder()
                .createdIds(createdIds)
                .updatedIds(updatedIds)
                .deletedIds(deletedIds)
                .elements(elementResponses)
                .build();
    }
    
    private Element toEntityFromBatchOperation(BatchElementOperationRequest request) {
        Project project = projectService.getProjectEntity(request.getProjectId());
        
        return Element.builder()
                .id(request.getId() != null ? request.getId() : UUID.randomUUID())
                .project(project)
                .userId(request.getUserId() != null ? request.getUserId() : UUID.randomUUID())
                .type(request.getType())
                .data(request.getData())
                .style(request.getStyle())
                .transform(request.getTransform())
                .build();
    }

    @Transactional(readOnly = true)
    public List<ElementResponse> getElementsByProject(UUID projectId) {
        projectService.getProjectEntity(projectId);
        return elementRepository.findByProjectIdAndDeletedAtIsNullOrderByCreatedAtAsc(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    private Element toEntity(CreateElementRequest request) {
        Project project = projectService.getProjectEntity(request.getProjectId());

        return Element.builder()
                .id(request.getId() != null ? request.getId() : UUID.randomUUID())
                .project(project)
                .userId(request.getUserId() != null ? request.getUserId() : UUID.randomUUID())
                .type(request.getType())
                .data(request.getData())
                .style(request.getStyle())
                .transform(request.getTransform())
                .build();
    }

    private Element getActiveElement(UUID id) {
        return elementRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new NotFoundException("Element not found: " + id));
    }

    private void applyUpdate(
            Element element,
            UUID projectId,
            UUID userId,
            ElementType type,
            JsonNode data,
            JsonNode style,
            JsonNode transform
    ) {
        if (projectId != null) {
            element.setProject(projectService.getProjectEntity(projectId));
        }
        if (userId != null) {
            element.setUserId(userId);
        }
        if (type != null) {
            element.setType(type);
        }
        if (data != null) {
            element.setData(data);
        }
        if (style != null) {
            element.setStyle(style);
        }
        if (transform != null) {
            element.setTransform(transform);
        }
    }

    private ElementResponse toResponse(Element element) {
        return ElementResponse.builder()
                .id(element.getId())
                .projectId(element.getProject().getId())
                .userId(element.getUserId())
                .type(element.getType())
                .data(element.getData())
                .style(element.getStyle())
                .transform(element.getTransform())
                .version(element.getVersion())
                .createdAt(element.getCreatedAt())
                .updatedAt(element.getUpdatedAt())
                .build();
    }
}
