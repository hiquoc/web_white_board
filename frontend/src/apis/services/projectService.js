import api from '../api'

/**
 * Project API service for managing whiteboard projects
 * All operations communicate with the backend /api/projects endpoints
 */

/**
 * Create a new project
 * @param {Object} projectData - Project creation data
 * @param {string} [projectData.projectId] - Optional project ID (UUID format)
 * @param {string} [projectData.title] - Optional project title
 * @returns {Promise<Object>} Created project response with projectId
 */
export const createProject = async (projectData = {}) => {
    const response = await api.post('/projects', projectData)
    return response.data
}

/**
 * Get a project by ID
 * @param {string} projectId - Project ID (UUID format)
 * @returns {Promise<Object>} Project details including id, title, createdAt, updatedAt
 */
export const getProject = async (projectId) => {
    const response = await api.get(`/projects/${projectId}`)
    return response.data
}

/**
 * Get all projects with pagination
 * @param {Object} [params] - Pagination parameters
 * @param {number} [params.page=0] - Page number (0-indexed)
 * @param {number} [params.size=20] - Number of items per page
 * @returns {Promise<Object>} List of projects with pagination info
 */
export const getProjects = async (params = {}) => {
    const { page = 0, size = 20 } = params
    const response = await api.get('/projects', { params: { page, size } })
    return response.data
}