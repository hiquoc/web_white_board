# Project Overview

## What This Project Is

This repository contains a collaborative whiteboard application composed of:

- A `frontend` built with React and Vite
- A `backend` built with Spring Boot

The frontend already provides a fully functional local whiteboard experience.  
The backend provides a persistent API layer for managing projects and elements.

---

## Repository Structure

### Frontend

**Path:** `frontend/`

#### Main Technologies

- React 19
- Vite 7
- Tailwind CSS 4
- Lucide React

#### Key Files

- `src/App.jsx`  
  Main whiteboard UI and interaction logic

- `src/components/`  
  Toolbar and canvas-related UI components

- `src/lib/whiteboard/`  
  Whiteboard constants and cursor helpers

- `src/apis/`  
  API client layer for backend communication

#### Current Capabilities

- Brush drawing
- Full-stroke eraser
- Point eraser
- Text boxes (create, edit, move, resize)
- Undo / redo history
- Export canvas as PNG
- Movable camera (infinite canvas feel)
- Per-board `projectId` via URL query string
- Basic shapes:
  - Arrow
  - Rectangle
  - Circle
  - Diamond

---

### Backend

**Path:** `backend/`

#### Main Technologies

- Spring Boot 4
- Spring MVC
- Spring Security
- Spring Data JPA
- PostgreSQL
- WebSocket (planned)

#### Key Files

- `controllers/` → REST API endpoints
- `services/` → business logic
- `models/` → JPA entities
- `application.yaml` → configuration

---

## Backend Capabilities

The backend provides a complete CRUD API layer for whiteboard data.

### Project Management

- Create project
- Get project by ID
- Update project
- Delete project

### Element Management

- Create elements within a project
- Retrieve elements by project
- Update element data
- Delete elements

> Elements represent all drawable objects (strokes, shapes, text, etc.)

### Data Persistence

- Uses PostgreSQL with JPA/Hibernate
- All project and element data is stored persistently

### API Design

- RESTful endpoints using Spring MVC
- Clear separation of concerns:
  - Controller → request handling
  - Service → business logic
  - Model → database entities

---

## Current Integration Status

- Project and Element APIs are implemented
- Frontend is integrating with backend APIs

### Current Work

- Automatically send API requests on whiteboard changes
- Persist element updates to backend
- Keep frontend state in sync with backend

---

## Important Concepts for Agents

- Each whiteboard = 1 Project
- Each drawable item = 1 Element
- All operations must be scoped by `projectId`
- Frontend manages real-time interaction state
- Backend is the source of truth for persistence