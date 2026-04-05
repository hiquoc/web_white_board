import api from '../api'

/**
 * Batch Element API service for managing whiteboard elements
 * Provides a unified API for creating, updating, and deleting elements in a single request
 */

/**
 * @typedef {'create' | 'update' | 'delete'} UpdateType
 */

/**
 * @typedef {Object} ElementOperation
 * @property {string} id - Element ID (UUID format)
 * @property {string} userId - User ID (UUID format)
 * @property {string} projectId - Project ID this element belongs to (UUID format)
 * @property {string} type - Element type (e.g., 'STROKE', 'TEXT', 'RECTANGLE', 'CIRCLE', 'ARROW', 'DIAMOND')
 * @property {Object} data - Element data (shape-specific data)
 * @property {Object} style - Element style properties
 * @property {Object} transform - Element transform properties (position, scale, rotation)
 * @property {number} version - Element version for optimistic locking
 * @property {UpdateType} updateType - Operation type: 'create', 'update', or 'delete'
 */

/**
 * @typedef {Object} BatchUpdateRequest
 * @property {string} projectId - Project ID to update
 * @property {ElementOperation[]} elements - Array of element operations
 */

/**
 * @typedef {Object} BatchUpdateResponse
 * @property {boolean} success - Whether the operation was successful
 * @property {string} message - Response message
 * @property {Object[]} data - Array of updated element responses
 */

/**
 * Perform a batch update of elements in a single request
 * This API consolidates create, update, and delete operations into one call
 * 
 * @param {string} projectId - Project ID to update
 * @param {ElementOperation[]} elements - Array of element operations
 * @returns {Promise<BatchUpdateResponse>} Batch update response
 * 
 * @example
 * // Create, update, and delete elements in one request
 * const response = await batchUpdateElements(projectId, [
 *   {
 *     id: crypto.randomUUID(),
 *     userId: 'user-uuid',
 *     projectId: 'project-uuid',
 *     type: 'STROKE',
 *     data: { points: [{x: 0, y: 0}, {x: 10, y: 10}] },
 *     style: { color: '#000', width: 2 },
 *     transform: { x: 0, y: 0, rotation: 0 },
 *     version: 0,
 *     updateType: 'create'
 *   },
 *   {
 *     id: 'existing-element-uuid',
 *     userId: 'user-uuid',
 *     projectId: 'project-uuid',
 *     type: 'TEXT',
 *     data: { text: 'Updated text' },
 *     style: { color: '#000', fontSize: 16 },
 *     transform: { x: 100, y: 100, rotation: 0 },
 *     version: 1,
 *     updateType: 'update'
 *   },
 *   {
 *     id: 'element-to-delete-uuid',
 *     userId: 'user-uuid',
 *     projectId: 'project-uuid',
 *     type: 'RECTANGLE',
 *     data: {},
 *     style: {},
 *     transform: {},
 *     version: 1,
 *     updateType: 'delete'
 *   }
 * ])
 */
export const batchUpdateElements = async (projectId, elements) => {
    const response = await api.post(`/elements/batch`, {
        projectId,
        elements
    })
    return response.data
}

/**
 * Helper function to create a create operation for an element
 * 
 * @param {Object} params - Element parameters
 * @param {string} params.userId - User ID
 * @param {string} params.projectId - Project ID
 * @param {string} params.type - Element type
 * @param {Object} params.data - Element data
 * @param {Object} params.style - Element style
 * @param {Object} params.transform - Element transform
 * @returns {ElementOperation} Create operation
 */
export const createCreateOperation = ({ userId, projectId, type, data, style, transform }) => ({
    id: crypto.randomUUID(),
    userId,
    projectId,
    type,
    data,
    style,
    transform,
    version: 0,
    updateType: 'create'
})

/**
 * Helper function to create an update operation for an element
 * 
 * @param {Object} params - Element parameters
 * @param {string} params.id - Element ID
 * @param {string} params.userId - User ID
 * @param {string} params.projectId - Project ID
 * @param {string} params.type - Element type
 * @param {Object} params.data - Element data
 * @param {Object} params.style - Element style
 * @param {Object} params.transform - Element transform
 * @param {number} params.version - Current version (will be incremented)
 * @returns {ElementOperation} Update operation
 */
export const createUpdateOperation = ({ id, userId, projectId, type, data, style, transform, version }) => ({
    id,
    userId,
    projectId,
    type,
    data,
    style,
    transform,
    version: version + 1,
    updateType: 'update'
})

/**
 * Helper function to create a delete operation for an element
 * 
 * @param {Object} params - Element parameters
 * @param {string} params.id - Element ID
 * @param {string} params.userId - User ID
 * @param {string} params.projectId - Project ID
 * @param {string} params.type - Element type
 * @param {number} params.version - Current version
 * @returns {ElementOperation} Delete operation
 */
export const createDeleteOperation = ({ id, userId, projectId, type, version }) => ({
    id,
    userId,
    projectId,
    type,
    data: {},
    style: {},
    transform: {},
    version,
    updateType: 'delete'
})