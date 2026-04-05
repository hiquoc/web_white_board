package com.notion.backend.repositories;

import com.notion.backend.models.Element;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ElementRepository extends JpaRepository<Element, UUID> {
    List<Element> findByProjectIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID projectId);

    Optional<Element> findByIdAndDeletedAtIsNull(UUID id);

    List<Element> findAllByIdInAndDeletedAtIsNull(List<UUID> ids);
}
