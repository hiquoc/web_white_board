import { createProject, getProject } from './projectService'
import { batchUpdateElements, createCreateOperation, createUpdateOperation, createDeleteOperation } from './batchElementService'

/**
 * DEV-ONLY self-test for backend API integration
 * This test runs once on app startup in development mode to verify
 * that project and element APIs are working correctly.
 */

const TEST_PROJECT_ID = crypto.randomUUID()
const TEST_USER_ID = crypto.randomUUID()

/**
 * Run the complete self-test suite
 */
export const runDevSelfTest = async () => {
    console.group('🧪 DEV SELF-TEST: Backend Integration')
    console.log('Starting backend integration self-test...')
    
    let allPassed = true
    
    try {
        // Step 1: Create test project
        console.log('\n--- Step 1: Creating test project ---')
        const projectResult = await testProjectCreation()
        if (!projectResult) {
            allPassed = false
            console.error('❌ PROJECT TEST FAILED: Could not create project')
        } else {
            console.log('✅ PROJECT TEST PASSED')
        }
        
        // Step 2: Test element batch operations
        console.log('\n--- Step 2: Testing element batch operations ---')
        const elementResult = await testElementBatch()
        if (!elementResult) {
            allPassed = false
            console.error('❌ ELEMENT BATCH TEST FAILED')
        } else {
            console.log('✅ ELEMENT BATCH TEST PASSED')
        }
        
        // Summary
        console.log('\n' + '='.repeat(50))
        if (allPassed) {
            console.log('🎉 ALL TESTS PASSED - Backend integration working!')
        } else {
            console.warn('⚠️ SOME TESTS FAILED - Check console for details')
        }
        console.log('='.repeat(50))
        
    } catch (error) {
        allPassed = false
        console.error('❌ SELF-TEST ERROR:', error.message)
    }
    
    console.groupEnd()
    return allPassed
}

/**
 * Test project creation and retrieval
 */
const testProjectCreation = async () => {
    try {
        // Create project
        const createResponse = await createProject({
            projectId: TEST_PROJECT_ID,
            title: 'Dev Self-Test Project'
        })
        
        if (!createResponse || !createResponse.success) {
            console.error('  Create project failed:', createResponse)
            return false
        }
        
        console.log('  ✓ Project created:', createResponse.data?.projectId || TEST_PROJECT_ID)
        
        // Get project
        const getResponse = await getProject(TEST_PROJECT_ID)
        
        if (!getResponse || !getResponse.success) {
            console.error('  Get project failed:', getResponse)
            return false
        }
        
        console.log('  ✓ Project retrieved:', getResponse.data?.id || TEST_PROJECT_ID)
        console.log('  ✓ Project title:', getResponse.data?.title)
        
        return true
    } catch (error) {
        console.error('  Project test error:', error.message)
        return false
    }
}

/**
 * Test element batch create, update, and delete
 */
const testElementBatch = async () => {
    try {
        const testElementId1 = 'test-element-1'
        const testElementId2 = 'test-element-2'
        
        // Step 1: Create test elements
        console.log('  Creating test elements...')
        const createElements = [
            createCreateOperation({
                id: testElementId1,
                userId: TEST_USER_ID,
                projectId: TEST_PROJECT_ID,
                type: 'STROKE',
                data: { points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
                style: { color: '#000', width: 2 },
                transform: {}
            }),
            createCreateOperation({
                id: testElementId2,
                userId: TEST_USER_ID,
                projectId: TEST_PROJECT_ID,
                type: 'RECTANGLE',
                data: {},
                style: { color: '#FF0000', strokeWidth: 1 },
                transform: { x: 100, y: 100, width: 50, height: 50 }
            })
        ]
        
        const createResponse = await batchUpdateElements(TEST_PROJECT_ID, createElements)
        
        if (!createResponse || !createResponse.success) {
            console.error('  Batch create failed:', createResponse)
            return false
        }
        
        console.log('  ✓ Created elements:', createResponse.data?.createdIds?.length || 2)
        
        // Step 2: Update one element and delete another
        console.log('  Updating and deleting elements...')
        const mixedElements = [
            createUpdateOperation({
                id: testElementId1,
                userId: TEST_USER_ID,
                projectId: TEST_PROJECT_ID,
                type: 'STROKE',
                data: { points: [{ x: 0, y: 0 }, { x: 20, y: 20 }] },
                style: { color: '#00FF00', width: 3 },
                transform: {},
                version: 1
            }),
            createDeleteOperation({
                id: testElementId2,
                userId: TEST_USER_ID,
                projectId: TEST_PROJECT_ID,
                type: 'RECTANGLE',
                version: 1
            })
        ]
        
        const mixedResponse = await batchUpdateElements(TEST_PROJECT_ID, mixedElements)
        
        if (!mixedResponse || !mixedResponse.success) {
            console.error('  Batch update/delete failed:', mixedResponse)
            return false
        }
        
        console.log('  ✓ Updated elements:', mixedResponse.data?.updatedIds?.length || 1)
        console.log('  ✓ Deleted elements:', mixedResponse.data?.deletedIds?.length || 1)
        
        return true
    } catch (error) {
        console.error('  Element batch test error:', error.message)
        return false
    }
}