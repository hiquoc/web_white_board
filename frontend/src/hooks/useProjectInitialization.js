import { useState, useEffect, useCallback } from 'react'
import { createProject, getProject } from '../apis/services/projectService'

const PROJECT_ID_STORAGE_KEY = 'whiteboard_projectId'

/**
 * Custom hook for project initialization with backend API integration
 * Handles project creation, retrieval, and persistence logic
 * 
 * @returns {Object} Project initialization state and helpers
 * @property {string|null} projectId - Current project ID
 * @property {Object|null} projectData - Project data from backend
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message if any
 * @property {Function} initializeProject - Function to initialize project
 */
export const useProjectInitialization = () => {
    const [projectId, setProjectId] = useState(null)
    const [projectData, setProjectData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    /**
     * Fetch project data from backend
     * @param {string} id - Project ID to fetch
     */
    const fetchProject = useCallback(async (id) => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await getProject(id)
            if (response.success && response.data) {
                setProjectData(response.data)
                setProjectId(id)
            }
        } catch (err) {
            console.error('Failed to fetch project:', err)
            setError(err.message || 'Failed to load project')
            setProjectId(id)
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * Create a new project via API
     * @param {Object} options - Creation options
     * @param {string} [options.projectId] - Optional project ID
     * @param {string} [options.title] - Optional project title
     * @returns {Promise<string>} Created project ID
     */
    const createNewProject = useCallback(async (options = {}) => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await createProject(options)
            if (response.success && response.data) {
                const newId = response.data.projectId
                setProjectId(newId)
                localStorage.setItem(PROJECT_ID_STORAGE_KEY, newId)
                return newId
            }
        } catch (err) {
            console.error('Failed to create project:', err)
            setError(err.message || 'Failed to create project')
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * Initialize project based on URL params and localStorage
     * Follows this priority:
     * 1. URL projectId → Fetch from backend
     * 2. localStorage projectId → Update URL, fetch from backend
     * 3. Neither → Generate new ID, create project via API
     */
    const initializeProject = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Check URL for projectId
            const urlParams = new URLSearchParams(window.location.search)
            const urlProjectId = urlParams.get('projectId')

            if (urlProjectId) {
                // Case 1: URL has projectId - fetch from backend
                await fetchProject(urlProjectId)
                return urlProjectId
            }

            // Check localStorage for projectId
            const storedProjectId = localStorage.getItem(PROJECT_ID_STORAGE_KEY)

            if (storedProjectId) {
                // Case 2: localStorage has projectId - update URL and fetch
                window.history.replaceState(null, '', `?projectId=${storedProjectId}`)
                await fetchProject(storedProjectId)
                return storedProjectId
            }

            // Case 3: No projectId anywhere - create new project
            const newProjectId = crypto.randomUUID()
            const createdProjectId = await createNewProject({
                projectId: newProjectId,
                title: 'Untitled Whiteboard'
            })

            // Update URL with new project ID
            window.history.replaceState(null, '', `?projectId=${createdProjectId}`)

            return createdProjectId
        } catch (err) {
            console.error('Project initialization failed:', err)
            setError(err.message || 'Failed to initialize project')
            
            // Fallback: generate local-only project ID
            const fallbackId = crypto.randomUUID()
            setProjectId(fallbackId)
            setIsLoading(false)
            return fallbackId
        }
    }, [fetchProject, createNewProject])

    // Auto-initialize on mount
    useEffect(() => {
        initializeProject()
    }, [initializeProject])

    return {
        projectId,
        projectData,
        isLoading,
        error,
        initializeProject,
        fetchProject,
        createNewProject
    }
}