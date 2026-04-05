package com.notion.backend.services;

import com.notion.backend.dtos.request.CreateProjectRequest;
import com.notion.backend.dtos.response.CreateProjectResponse;
import com.notion.backend.dtos.response.ProjectListResponse;
import com.notion.backend.dtos.response.ProjectResponse;
import com.notion.backend.models.Project;
import com.notion.backend.repositories.ProjectRepository;
import com.notion.backend.throwables.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private static final String DEFAULT_TITLE = "Untitled Whiteboard";

    private final ProjectRepository projectRepository;

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
        return toResponse(project);
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
                .build();
    }
}
