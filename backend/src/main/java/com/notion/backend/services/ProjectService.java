package com.notion.backend.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.notion.backend.dtos.request.CreateProjectRequest;
import com.notion.backend.dtos.response.CreateProjectResponse;
import com.notion.backend.dtos.response.ElementResponse;
import com.notion.backend.dtos.response.ProjectListResponse;
import com.notion.backend.dtos.response.ProjectResponse;
import com.notion.backend.models.Element;
import com.notion.backend.models.Project;
import com.notion.backend.repositories.ElementRepository;
import com.notion.backend.repositories.ProjectRepository;
import com.notion.backend.throwables.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private static final String DEFAULT_TITLE = "Untitled Whiteboard";

    private final ProjectRepository projectRepository;
    private final ElementRepository elementRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public CreateProjectResponse createProject(CreateProjectRequest request) {
        Project project = Project.builder()
                .id(request.getProjectId() != null ? request.getProjectId() : UUID.randomUUID())
                .title(resolveTitle(request.getTitle()))
                .build();

        Project savedProject = projectRepository.save(project);
        return CreateProjectResponse.builder()
                .projectId(savedProject.getId())
                .build();
    }

    @Transactional
    public ProjectResponse getProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseGet(() -> {
                    // Auto-create project if it doesn't exist
                    Project newProject = Project.builder()
                            .id(id)
                            .title(DEFAULT_TITLE)
                            .build();
                    return projectRepository.save(newProject);
                });
        
        // Fetch all elements for this project in a single query (avoids N+1)
        List<Element> elements = elementRepository.findByProjectIdAndDeletedAtIsNullOrderByCreatedAtAsc(id);
        
        // Map elements to ElementResponse
        List<ElementResponse> elementResponses = elements.stream()
                .map(this::toElementResponse)
                .toList();
//        System.out.println(elementResponses.getFirst().getData());
        // Build response with elements
        return toResponse(project, elementResponses);
    }

    @Transactional(readOnly = true)
    public ProjectListResponse getProjects(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Project> projectPage = projectRepository.findAllByOrderByCreatedAtDesc(pageable);

        return ProjectListResponse.builder()
                .projects(projectPage.getContent().stream().map(this::toResponse).toList())
                .page(projectPage.getNumber())
                .size(projectPage.getSize())
                .totalElements(projectPage.getTotalElements())
                .totalPages(projectPage.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public Project getProjectEntity(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project not found: " + id));
    }

    private String resolveTitle(String title) {
        if (title == null || title.isBlank()) {
            return DEFAULT_TITLE;
        }
        return title.trim();
    }

    private ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .elements(List.of())
                .build();
    }

    private ProjectResponse toResponse(Project project, List<ElementResponse> elementResponses) {
        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .elements(elementResponses)
                .build();
    }

    private ElementResponse toElementResponse(Element element) {
        return ElementResponse.builder()
                .id(element.getId())
                .projectId(element.getProject().getId())
                .userId(element.getUserId())
                .type(element.getType())
                .data(element.getData())
                .style(element.getStyle())
                .transform(element.getTransform() == null ? "{}" : element.getTransform())
                .version(element.getVersion())
                .createdAt(element.getCreatedAt())
                .updatedAt(element.getUpdatedAt())
                .build();
    }

    /**
     * Parse JSON String to JsonNode for response serialization.
     * Returns empty ObjectNode for null or invalid JSON.
     */
    private JsonNode parseJson(String json) {
        try {
            return (json == null || json.isBlank())
                    ? objectMapper.createObjectNode()
                    : objectMapper.readTree(json);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }
}
