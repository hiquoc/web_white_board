package com.notion.backend.controllers;

import com.notion.backend.dtos.ApiResponse;
import com.notion.backend.dtos.request.CreateProjectRequest;
import com.notion.backend.dtos.response.CreateProjectResponse;
import com.notion.backend.dtos.response.ProjectListResponse;
import com.notion.backend.dtos.response.ProjectResponse;
import com.notion.backend.services.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<CreateProjectResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request
    ) {
        CreateProjectResponse response = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<CreateProjectResponse>builder()
                        .success(true)
                        .message("Project created")
                        .data(response)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable UUID id) {
        ProjectResponse response = projectService.getProject(id);
        return ResponseEntity.ok(ApiResponse.<ProjectResponse>builder()
                .success(true)
                .message("Project retrieved")
                .data(response)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ProjectListResponse>> getProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        ProjectListResponse response = projectService.getProjects(page, size);
        return ResponseEntity.ok(ApiResponse.<ProjectListResponse>builder()
                .success(true)
                .message("Projects retrieved")
                .data(response)
                .build());
    }
}
