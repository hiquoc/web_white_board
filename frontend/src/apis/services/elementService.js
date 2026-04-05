import api from '..'

/**
 * Element API service for managing whiteboard elements
 * All operations communicate with the backend /elements endpoints
 * Elements represent all drawable objects (strokes, shapes, text, etc.)
 */

/**
 * Create multiple elements within a project
 * @param {Array<Object>} elements - Array of element data objects
 * @param {string} [elements[].id] - Optional element ID (UUID format)
 * @param {string} elements[].projectId - Project ID this element belongs to (UUID format)
 * @param {string} [elements[].userId] - Optional user ID (UUID format)
 * @param {string} elements[].type - Element type (e.g., 'STROKE', 'TEXT', 'RECTANGLE', 'CIRCLE', 'ARROW', 'DIAMOND')
 * @param {Object} elements[].data - Element data (shape-specific data)
 * @param {Object} elements[].style - Element style properties
 * @param {Object} elements[].transform - Element transform properties (position, scale, rotation)
 * @returns {Promise<Array<Object>>} Array of created element responses
 */
export const createElements = async (elements) => {
    const response = await api.post('/elements', { elements })
    return response.data
}

/**
 * Get all elements for a specific project
 * @param {string} projectId - Project ID (UUID format)
 * @returns {Promise<Array<Object>>} Array of element responses
 */
export const getElementsByProject = async (projectId) => {
    const response = await api.get(`/elements/project/${projectId}`)
    return response.data
}

/**
 * Update a single element
 * @param {string} elementId - Element ID to update (UUID format)
 * @param {Object} updateData - Element update data
 * @param {string} [updateData.projectId] - Project ID (UUID format)
 * @param {string} [updateData.userId] - User ID (UUID format)
 * @param {string} [updateData.type] - Element type
 * @param {Object} [updateData.data] - Element data
 * @param {Object} [updateData.style] - Element style properties
 * @param {Object} [updateData.transform] - Element transform properties
 * @returns {Promise<Object>} Updated element response
 */
export const updateElement = async (elementId, updateData) => {
    const response = await api.put(`/elements/${elementId}`, updateData)
    return response.data
}

/**
 * Update multiple elements in batch
 * @param {Array<Object>} elements - Array of element update objects
 * @param {string} elements[].id - Element ID to update (UUID format)
 * @param {string} [elements[].projectId] - Project ID (UUID format)
 * @param {string} [elements[].userId] - User ID (UUID format)
 * @param {string} [elements[].type] - Element type
 * @param {Object} [elements[].data] - Element data
 * @param {Object} [elements[].style] - Element style properties
 * @param {Object} [elements[].transform] - Element transform properties
 * @returns {Promise<Array<Object>>} Array of updated element responses
 */
export const updateElements = async (elements) => {
    const response = await api.put('/elements', { elements })
    return response.data
}

/**
 * Delete a single element
 * @param {string} elementId - Element ID to delete (UUID format)
 * @returns {Promise<Object>} Deletion response
 */
export const deleteElement = async (elementId) => {
    const response = await api.delete(`/elements/${elementId}`)
    return response.data
}

/**
 * Delete multiple elements in batch
 * @param {Array<string>} elementIds - Array of element IDs to delete (UUID format)
 * @returns {Promise<Object>} Deletion response
 */
export const deleteElements = async (elementIds) => {
    const response = await api.delete('/elements', { data: { ids: elementIds } })
    return response.data
}