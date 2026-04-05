import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import CanvasActionButtons from './components/CanvasActionButtons'
import CursorOverlay from './components/CursorOverlay'
import FloatingToolbar from './components/FloatingToolbar'
import WhiteboardCanvas from './components/WhiteboardCanvas'
import { useCamera } from './hooks/useCamera'
import { useDrawingState } from './hooks/useDrawingState'
import { useMouseCanvas } from './hooks/useMouseCanvas'
import { createProject, getProject } from './apis/services/projectService'
import { batchUpdateElements, createCreateOperation, createUpdateOperation, createDeleteOperation } from './apis/services/batchElementService'
import { runDevSelfTest } from './apis/services/devSelfTest'
import {
    DEFAULT_TEXT_FONT_SIZE,
    TEXT_LINE_HEIGHT_RATIO,
    POINT_ERASER_SIZE_RATIO,
    SHAPE_MIN_SIZE,
    SHAPE_TOOL_IDS,
    SHAPE_TOOLS,
    TEXT_PADDING,
    TOOLS
} from './lib/whiteboard/constants'
import {
    createShapeDraft,
    createTextDraft,
    ensureShapeMinimumSize,
    getArrowGeometry,
    getResizeHandleBounds as getTextResizeHandleBounds,
    getShapeBounds,
    getShapeResizeHandleBounds,
    getShapeResizeHitBounds,
    getShapeVertices,
    getTextBounds as measureTextBounds,
    getTextLayout as measureTextLayout,
    isPointInShape
} from './utils/whiteboardLayout'
import { appendPoint, interpolatePoint, invertRanges, isPointInRect, mergeRanges } from './utils/whiteboardMath'

const WORLD_WIDTH = 8000
const WORLD_HEIGHT = 8000
const WORLD_GRID_SIZE = 32
const WORLD_MAJOR_GRID_SIZE = WORLD_GRID_SIZE * 4
const SHAPE_DRAG_THRESHOLD = 4
const MIN_POINT_ERASER_SIZE = 4
function App() {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const ctxRef = useRef(null)
    const textInputRef = useRef(null)
    const textInspectorRef = useRef(null)
    const sizePopoverRef = useRef(null)
    const textInspectorInteractingRef = useRef(false)
    const suppressTextClickRef = useRef(false)
    const historyRef = useRef([])
    const historyIndexRef = useRef(-1)
    const canvasRectRef = useRef(null)
    const panStateRef = useRef(null)
    const {
        currentStrokeRef,
        currentShapeRef,
        isHoldingMouseDown,
        dragStateRef,
        pointEraseDirtyRef,
        eraseQueueRef
    } = useDrawingState()
    const {
        camera,
        cameraRef,
        devicePixelRatioRef,
        hasInitializedCameraRef,
        applyViewportTransform,
        updateCamera,
        screenToWorld,
        worldToScreen,
        setZoomAtScreenPoint
    } = useCamera({
        canvasRef,
        worldWidth: WORLD_WIDTH,
        worldHeight: WORLD_HEIGHT
    })

    const [projectId, setProjectId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [zoomInput, setZoomInput] = useState('100')

    const [boardName, setBoardName] = useState('Sprint Planning Whiteboard')
    const [strokes, setStrokes] = useState([])
    const strokesRef = useRef([])
    const [shapes, setShapes] = useState([])
    const shapesRef = useRef([])
    const [layerOrder, setLayerOrder] = useState([])
    const layerOrderRef = useRef([])

    const [currentStrokeColor, setCurrentStrokeColor] = useState('#111827')
    const [currentTextColor, setCurrentTextColor] = useState('#111827')
    const [currentShapeColor, setCurrentShapeColor] = useState('#111827')
    const [brushSize, setBrushSize] = useState(3)
    const [currentTool, setCurrentTool] = useState('brush')
    const [defaultTextFontSize, setDefaultTextFontSize] = useState(DEFAULT_TEXT_FONT_SIZE)
    const [activeToolbarPanel, setActiveToolbarPanel] = useState(null)

    const [texts, setTexts] = useState([])
    const textsRef = useRef([])
    const [selectedTextId, setSelectedTextId] = useState(null)
    const [selectedShapeId, setSelectedShapeId] = useState(null)
    const [editingText, setEditingText] = useState(null)

    const [historyIndex, setHistoryIndex] = useState(-1)

    const currentToolRef = useRef('brush')

    const selectedText = useMemo(
        () => texts.find(textItem => textItem.id === selectedTextId) ?? null,
        [texts, selectedTextId]
    )
    const selectedShape = useMemo(
        () => shapes.find(shapeItem => shapeItem.id === selectedShapeId) ?? null,
        [shapes, selectedShapeId]
    )
    const isShapeTool = SHAPE_TOOL_IDS.includes(currentTool)
    const activeShapeTool = SHAPE_TOOLS.find(tool => tool.id === currentTool) ?? SHAPE_TOOLS[0]
    const activeTextInspectorTarget = editingText ?? selectedText
    const pointEraserSize = Math.max(MIN_POINT_ERASER_SIZE, brushSize * POINT_ERASER_SIZE_RATIO)
    const toolbarColor = currentTool === 'text'
        ? activeTextInspectorTarget?.color ?? currentTextColor
        : isShapeTool
            ? selectedShape?.color ?? currentShapeColor
            : currentStrokeColor
    const toolbarSize = currentTool === 'text'
        ? activeTextInspectorTarget?.fontSize ?? defaultTextFontSize
        : isShapeTool
            ? selectedShape?.strokeWidth ?? brushSize
            : brushSize
    const toolbarSizeLabel = currentTool === 'text'
        ? 'Text size'
        : currentTool === 'point-eraser'
            ? 'Eraser size'
            : isShapeTool
                ? 'Border size'
                : 'Stroke size'
    const toolbarSizeValue = currentTool === 'point-eraser' ? pointEraserSize : toolbarSize
    const shouldUseFollowCursor = currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'text' || currentTool === 'point-eraser' || isShapeTool
    const canvasCursor = shouldUseFollowCursor ? 'none' : 'crosshair'
    const {
        cursorOverlayRef,
        updateCanvasRect,
        getScreenPoint,
        positionToolCursor,
        hideToolCursor
    } = useMouseCanvas({
        canvasRef,
        shouldUseFollowCursor
    })

    // Refs for tracking element changes for auto-sync
    const pendingElementChangesRef = useRef(new Map())
    const autoSyncTimeoutRef = useRef(null)
    const syncedElementsRef = useRef(new Map())
    const isInitializedRef = useRef(false)

    // DEV-ONLY: Run self-test on startup to verify backend integration
    // useEffect(() => {
    //     if (import.meta.env.DEV) {
    //         runDevSelfTest()
    //     }
    // }, [])

    const hasInit = useRef(false);
    useEffect(() => {
        if (hasInit.current) return;
        hasInit.current = true;
        const urlProjectId = new URLSearchParams(window.location.search).get('projectId')

        // UUID validation regex (matches standard UUID format)
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const isValidUuid = (id) => UUID_REGEX.test(id);

        const initProject = async () => {
            let finalProjectId = urlProjectId;

            if (!finalProjectId || !isValidUuid(finalProjectId)) {
                // Generate new UUID if missing or invalid
                finalProjectId = crypto.randomUUID();
                localStorage.setItem('projectId', finalProjectId);
                window.history.replaceState(null, '', `?projectId=${finalProjectId}`);
            }

            setProjectId(finalProjectId);

            try {
                let response = await getProject(finalProjectId);

                if (response.success && response.data) {
                    setBoardName(response.data.title || boardName);
                } else {
                    await createProject({
                        projectId: finalProjectId,
                        title: boardName
                    });
                }
            } catch (err) {
                console.error('Init project failed:', err);
            }

            isInitializedRef.current = true;
        };

        const token = localStorage.getItem('token');
        if (!token) {
            setUserId(crypto.randomUUID());
        } else {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserId(payload.userId);
        }

        initProject();
    }, []);

    useEffect(() => {
        currentToolRef.current = currentTool
        if (currentTool !== 'text') {
            setSelectedTextId(null)
            setEditingText(null)
        }
        if (!SHAPE_TOOL_IDS.includes(currentTool)) {
            setSelectedShapeId(null)
        }
        setActiveToolbarPanel(null)
    }, [currentTool])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctxRef.current = ctx

        const initialSnapshot = createSnapshot([], [], [])
        historyRef.current = [initialSnapshot]
        historyIndexRef.current = 0
        setHistoryIndex(0)

        resizeCanvas()
    }, [])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver(() => {
            resizeCanvas()
        })

        observer.observe(container)
        window.addEventListener('resize', resizeCanvas)

        return () => {
            observer.disconnect()
            window.removeEventListener('resize', resizeCanvas)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const handleNativeWheel = (event) => {
            handleWheel(event)
        }

        canvas.addEventListener('wheel', handleNativeWheel, { passive: false })

        return () => {
            canvas.removeEventListener('wheel', handleNativeWheel)
        }
    }, [])

    useEffect(() => {
        function handlePointerDown(event) {
            if (activeToolbarPanel !== 'size') return

            const target = event.target
            if (!(target instanceof Node)) return

            if (textInspectorRef.current?.contains(target)) return
            if (sizePopoverRef.current?.contains(target)) return

            setActiveToolbarPanel(null)
        }

        window.addEventListener('pointerdown', handlePointerDown)
        return () => window.removeEventListener('pointerdown', handlePointerDown)
    }, [activeToolbarPanel])

    useEffect(() => {
        function handleKeyDown(e) {
            const isMeta = e.ctrlKey || e.metaKey

            if (isMeta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault()
                undo()
                return
            }

            if (isMeta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                e.preventDefault()
                redo()
                return
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (editingText) return

                if (selectedTextId) {
                    e.preventDefault()
                    deleteSelectedText()
                    return
                }

                if (selectedShapeId) {
                    e.preventDefault()
                    deleteSelectedShape()
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editingText, selectedShapeId, selectedTextId])

    useEffect(() => {
        strokesRef.current = strokes
        redraw(strokes, shapesRef.current, textsRef.current)
    }, [strokes])

    useEffect(() => {
        shapesRef.current = shapes
        redraw(strokesRef.current, shapes, textsRef.current)
    }, [shapes, selectedShapeId])

    useEffect(() => {
        textsRef.current = texts
        redraw(strokesRef.current, shapesRef.current, texts)
    }, [texts, selectedTextId])

    useEffect(() => {
        redraw(strokesRef.current, shapesRef.current, textsRef.current)
    }, [editingText])

    useEffect(() => {
        redraw(strokesRef.current, shapesRef.current, textsRef.current)
    }, [camera])

    useEffect(() => {
        layerOrderRef.current = layerOrder
        redraw(strokesRef.current, shapesRef.current, textsRef.current)
    }, [layerOrder])

    useEffect(() => {
        setZoomInput(`${Math.round(camera.zoom * 100)}`)
    }, [camera.zoom])

    useEffect(() => {
        if (!editingText || !textInputRef.current) return

        textInputRef.current.focus()
        textInputRef.current.setSelectionRange(
            editingText.text.length,
            editingText.text.length
        )
    }, [editingText])

    useEffect(() => {
        if (selectedShapeId && !shapes.some(shapeItem => shapeItem.id === selectedShapeId)) {
            setSelectedShapeId(null)
        }
    }, [selectedShapeId, shapes])

    useEffect(() => {
        let running = true

        function loop() {
            if (!running) return
            processEraseQueue()
            requestAnimationFrame(loop)
        }

        requestAnimationFrame(loop)

        return () => { running = false }
    }, [brushSize])

    useEffect(() => {
        if (shouldUseFollowCursor) return
        hideToolCursor()
    }, [shouldUseFollowCursor])

    // Element auto-sync: Send changes to backend after user stops interacting (debounced)
    useEffect(() => {
        if (!projectId || !userId || !isInitializedRef.current) return

        // Clear existing timeout
        if (autoSyncTimeoutRef.current) {
            clearTimeout(autoSyncTimeoutRef.current)
        }

        // Debounce for 2.5 seconds after last change
        autoSyncTimeoutRef.current = setTimeout(async () => {
            try {
                const currentStrokes = strokesRef.current
                const currentShapes = shapesRef.current
                const currentTexts = textsRef.current

                // Build element operations based on changes
                const operations = []
                const currentElementIds = new Set()

                // Process strokes
                currentStrokes.forEach(stroke => {
                    const id = stroke.id
                    currentElementIds.add(id)
                    const syncedVersion = syncedElementsRef.current.get(id)

                    if (!syncedVersion) {
                        // New element - create
                        operations.push(createCreateOperation({
                            userId,
                            projectId,
                            type: 'STROKE',
                            data: { points: stroke.points || [] },
                            style: { color: stroke.color, width: stroke.width, opacity: stroke.opacity || 1 },
                            transform: {}
                        }))
                        // Override the generated id with the actual stroke id
                        operations[operations.length - 1].id = id
                    } else {
                        // Existing element - check if changed
                        operations.push(createUpdateOperation({
                            id,
                            userId,
                            projectId,
                            type: 'STROKE',
                            data: { points: stroke.points || [] },
                            style: { color: stroke.color, width: stroke.width, opacity: stroke.opacity || 1 },
                            transform: {},
                            version: syncedVersion
                        }))
                    }
                })

                // Process shapes
                currentShapes.forEach(shapeItem => {
                    const id = shapeItem.id
                    currentElementIds.add(id)
                    const syncedVersion = syncedElementsRef.current.get(id)

                    if (!syncedVersion) {
                        // New element - create
                        operations.push(createCreateOperation({
                            userId,
                            projectId,
                            type: shapeItem.type?.toUpperCase() || 'RECTANGLE',
                            data: {},
                            style: { color: shapeItem.color, strokeWidth: shapeItem.strokeWidth },
                            transform: { x: shapeItem.x, y: shapeItem.y, width: shapeItem.width, height: shapeItem.height }
                        }))
                        operations[operations.length - 1].id = id
                    } else {
                        // Existing element - update
                        operations.push(createUpdateOperation({
                            id,
                            userId,
                            projectId,
                            type: shapeItem.type?.toUpperCase() || 'RECTANGLE',
                            data: {},
                            style: { color: shapeItem.color, strokeWidth: shapeItem.strokeWidth },
                            transform: { x: shapeItem.x, y: shapeItem.y, width: shapeItem.width, height: shapeItem.height },
                            version: syncedVersion
                        }))
                    }
                })

                // Process texts
                currentTexts.forEach(textItem => {
                    const id = textItem.id
                    currentElementIds.add(id)
                    const syncedVersion = syncedElementsRef.current.get(id)

                    if (!syncedVersion) {
                        // New element - create
                        operations.push(createCreateOperation({
                            userId,
                            projectId,
                            type: 'TEXT',
                            data: { text: textItem.text || '' },
                            style: { color: textItem.color, fontSize: textItem.fontSize },
                            transform: { x: textItem.x, y: textItem.y, width: textItem.width, height: textItem.height }
                        }))
                        operations[operations.length - 1].id = id
                    } else {
                        // Existing element - update
                        operations.push(createUpdateOperation({
                            id,
                            userId,
                            projectId,
                            type: 'TEXT',
                            data: { text: textItem.text || '' },
                            style: { color: textItem.color, fontSize: textItem.fontSize },
                            transform: { x: textItem.x, y: textItem.y, width: textItem.width, height: textItem.height },
                            version: syncedVersion
                        }))
                    }
                })

                // Check for deleted elements
                syncedElementsRef.current.forEach((version, id) => {
                    if (!currentElementIds.has(id)) {
                        // Element was deleted
                        operations.push(createDeleteOperation({
                            id,
                            userId,
                            projectId,
                            type: 'UNKNOWN',
                            version: version
                        }))
                        syncedElementsRef.current.delete(id)
                    }
                })

                if (operations.length === 0) return

                const response = await batchUpdateElements(projectId, operations)

                if (response.success && response.data) {
                    // Update synced versions for created/updated elements
                    if (response.data.elements) {
                        response.data.elements.forEach(element => {
                            syncedElementsRef.current.set(element.id, element.version)
                        })
                    }
                }
            } catch (err) {
                console.error('Failed to sync elements:', err)
            }
        }, 2500)

        return () => {
            if (autoSyncTimeoutRef.current) {
                clearTimeout(autoSyncTimeoutRef.current)
            }
        }
    }, [strokes, shapes, texts, projectId, userId])

    function normalizeLayerOrder(nextStrokes, nextShapes, nextTexts, nextLayerOrder = layerOrderRef.current) {
        const strokeIds = new Set(nextStrokes.map(stroke => stroke.id))
        const shapeIds = new Set(nextShapes.map(shapeItem => shapeItem.id))
        const textIds = new Set(nextTexts.map(textItem => textItem.id))
        const normalized = []

        nextLayerOrder.forEach(entry => {
            if (entry.type === 'stroke' && strokeIds.has(entry.id)) {
                normalized.push(entry)
            } else if (entry.type === 'shape' && shapeIds.has(entry.id)) {
                normalized.push(entry)
            } else if (entry.type === 'text' && textIds.has(entry.id)) {
                normalized.push(entry)
            }
        })

        nextStrokes.forEach(stroke => {
            if (!normalized.some(entry => entry.type === 'stroke' && entry.id === stroke.id)) {
                normalized.push({ type: 'stroke', id: stroke.id })
            }
        })

        nextShapes.forEach(shapeItem => {
            if (!normalized.some(entry => entry.type === 'shape' && entry.id === shapeItem.id)) {
                normalized.push({ type: 'shape', id: shapeItem.id })
            }
        })

        nextTexts.forEach(textItem => {
            if (!normalized.some(entry => entry.type === 'text' && entry.id === textItem.id)) {
                normalized.push({ type: 'text', id: textItem.id })
            }
        })

        return normalized
    }

    function createSnapshot(nextStrokes, nextShapes, nextTexts, nextLayerOrder = layerOrderRef.current) {
        return {
            strokes: structuredClone(nextStrokes),
            shapes: structuredClone(nextShapes),
            texts: structuredClone(nextTexts),
            layerOrder: structuredClone(normalizeLayerOrder(nextStrokes, nextShapes, nextTexts, nextLayerOrder))
        }
    }

    function commitHistory(nextStrokes, nextShapes, nextTexts, nextLayerOrder = layerOrderRef.current) {
        const snapshot = createSnapshot(nextStrokes, nextShapes, nextTexts, nextLayerOrder)
        const trimmedHistory = historyRef.current
            .slice(Math.max(0, historyIndexRef.current - 20), historyIndexRef.current + 1)
        trimmedHistory.push(snapshot)

        historyRef.current = trimmedHistory
        historyIndexRef.current = trimmedHistory.length - 1
        setHistoryIndex(trimmedHistory.length - 1)
    }

    function applyBoardState(nextStrokes, nextShapes, nextTexts, options = {}) {
        const nextLayerOrder = normalizeLayerOrder(
            nextStrokes,
            nextShapes,
            nextTexts,
            options.layerOrder ?? layerOrderRef.current
        )

        strokesRef.current = nextStrokes
        shapesRef.current = nextShapes
        textsRef.current = nextTexts
        layerOrderRef.current = nextLayerOrder
        setStrokes(nextStrokes)
        setShapes(nextShapes)
        setTexts(nextTexts)
        setLayerOrder(nextLayerOrder)

        if (options.commitHistory) {
            commitHistory(nextStrokes, nextShapes, nextTexts, nextLayerOrder)
        }
    }

    function undo() {
        if (historyIndexRef.current <= 0) return

        const nextIndex = historyIndexRef.current - 1
        const snapshot = historyRef.current[nextIndex]

        historyIndexRef.current = nextIndex
        setHistoryIndex(nextIndex)

        strokesRef.current = structuredClone(snapshot.strokes)
        shapesRef.current = structuredClone(snapshot.shapes ?? [])
        textsRef.current = structuredClone(snapshot.texts)
        layerOrderRef.current = structuredClone(
            snapshot.layerOrder ?? normalizeLayerOrder(snapshot.strokes, snapshot.shapes ?? [], snapshot.texts, [])
        )
        setStrokes(strokesRef.current)
        setShapes(shapesRef.current)
        setTexts(textsRef.current)
        setLayerOrder(layerOrderRef.current)
        setEditingText(null)
        setSelectedTextId(null)
        setSelectedShapeId(null)
    }

    function redo() {
        if (historyIndexRef.current >= historyRef.current.length - 1) return

        const nextIndex = historyIndexRef.current + 1
        const snapshot = historyRef.current[nextIndex]

        historyIndexRef.current = nextIndex
        setHistoryIndex(nextIndex)

        strokesRef.current = structuredClone(snapshot.strokes)
        shapesRef.current = structuredClone(snapshot.shapes ?? [])
        textsRef.current = structuredClone(snapshot.texts)
        layerOrderRef.current = structuredClone(
            snapshot.layerOrder ?? normalizeLayerOrder(snapshot.strokes, snapshot.shapes ?? [], snapshot.texts, [])
        )
        setStrokes(strokesRef.current)
        setShapes(shapesRef.current)
        setTexts(textsRef.current)
        setLayerOrder(layerOrderRef.current)
        setEditingText(null)
        setSelectedTextId(null)
        setSelectedShapeId(null)
    }

    function resizeCanvas() {
        const canvas = canvasRef.current
        const container = containerRef.current
        const ctx = ctxRef.current
        if (!canvas || !container || !ctx) return

        const rect = container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const dpr = window.devicePixelRatio || 1

        devicePixelRatioRef.current = dpr
        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        canvasRectRef.current = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        }

        if (!hasInitializedCameraRef.current) {
            hasInitializedCameraRef.current = true
            updateCamera({
                x: (rect.width / 2) - (WORLD_WIDTH / 2),
                y: (rect.height / 2) - (WORLD_HEIGHT / 2),
                zoom: 1
            })
        } else {
            updateCamera(cameraRef.current)
        }

        applyViewportTransform(ctx)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        redraw(strokesRef.current, shapesRef.current, textsRef.current)
    }

    function getMousePos(e) {
        return screenToWorld(getScreenPoint(e))
    }

    function createNextTextDraft(pos, baseText = {}) {
        return createTextDraft(pos, baseText, {
            currentTextColor,
            defaultTextFontSize
        })
    }

    function createNextShapeDraft(type, start, end, overrides = {}) {
        return createShapeDraft(type, start, end, overrides, {
            currentShapeColor,
            brushSize
        })
    }

    function prepareCanvasForRedraw(ctx) {
        const canvas = canvasRef.current
        if (!canvas) return

        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        applyViewportTransform(ctx)
    }

    function getTextBounds(textItem) {
        return measureTextBounds(ctxRef.current, textItem)
    }

    function getResizeHandleBounds(textItem) {
        return getTextResizeHandleBounds(ctxRef.current, textItem)
    }

    function getTextLayout(ctx, textItem) {
        return measureTextLayout(ctx, textItem)
    }

    function getTopLayerHit(point) {
        for (let i = layerOrderRef.current.length - 1; i >= 0; i--) {
            const entry = layerOrderRef.current[i]

            if (entry.type === 'text') {
                const textItem = textsRef.current.find(item => item.id === entry.id)
                if (textItem && isPointInRect(point, getTextBounds(textItem))) {
                    return { type: 'text', item: textItem }
                }
            }

            if (entry.type === 'shape') {
                const shapeItem = shapesRef.current.find(item => item.id === entry.id)
                if (shapeItem && isPointInShape(point, shapeItem)) {
                    return { type: 'shape', item: shapeItem }
                }
            }
        }

        return null
    }

    function getTextAtPoint(point) {
        const hit = getTopLayerHit(point)
        return hit?.type === 'text' ? hit.item : null
    }

    function getShapeAtPoint(point) {
        const hit = getTopLayerHit(point)
        return hit?.type === 'shape' ? hit.item : null
    }

    function handleMouseDown(e) {
        updateCanvasRect()
        positionToolCursor(getScreenPoint(e))

        if (e.button === 1) {
            e.preventDefault()
            isHoldingMouseDown.current = false
            dragStateRef.current = null
            currentStrokeRef.current = null
            currentShapeRef.current = null
            eraseQueueRef.current = []

            panStateRef.current = {
                startClientX: e.clientX,
                startClientY: e.clientY,
                startCameraX: cameraRef.current.x,
                startCameraY: cameraRef.current.y
            }
            return
        }

        if (e.button !== 0) return

        isHoldingMouseDown.current = true
        const pos = getMousePos(e)

        if (currentTool === 'text') {
            const textItem = getTextAtPoint(pos)

            if (!textItem) {
                dragStateRef.current = null
                isHoldingMouseDown.current = false
                return
            }

            setSelectedTextId(textItem.id)
            setSelectedShapeId(null)

            if (isPointInRect(pos, getResizeHandleBounds(textItem))) {
                dragStateRef.current = {
                    kind: 'text',
                    mode: 'resize',
                    textId: textItem.id,
                    startPointer: pos,
                    startWidth: textItem.width,
                    startHeight: textItem.height,
                    changed: false
                }
            } else {
                dragStateRef.current = {
                    kind: 'text',
                    mode: 'move',
                    textId: textItem.id,
                    offsetX: pos.x - textItem.x,
                    offsetY: pos.y - textItem.y,
                    changed: false
                }
            }

            return
        }

        if (currentTool === 'eraser' || currentTool === 'point-eraser') {
            setSelectedTextId(null)
            setSelectedShapeId(null)
            if (currentTool === 'point-eraser') {
                pointEraseDirtyRef.current = false
            }
            eraseQueueRef.current = [pos]
            return
        }

        if (SHAPE_TOOL_IDS.includes(currentTool)) {
            if (selectedShape && isPointInRect(pos, getShapeResizeHitBounds(selectedShape))) {
                dragStateRef.current = {
                    kind: 'shape',
                    mode: 'resize',
                    shapeId: selectedShape.id,
                    startPointer: pos,
                    startWidth: selectedShape.width,
                    startHeight: selectedShape.height,
                    changed: false
                }
                return
            }

            const hitShape = getShapeAtPoint(pos)
            if (hitShape) {
                setSelectedShapeId(hitShape.id)
                setSelectedTextId(null)
                dragStateRef.current = {
                    kind: 'shape',
                    mode: 'move',
                    shapeId: hitShape.id,
                    offsetX: pos.x - hitShape.x,
                    offsetY: pos.y - hitShape.y,
                    changed: false
                }
                return
            }

            const shapeId = crypto.randomUUID()
            currentShapeRef.current = {
                id: shapeId,
                tool: currentTool,
                startPointer: pos,
                created: false
            }
            setSelectedShapeId(null)
            setSelectedTextId(null)
            setEditingText(null)
            return
        }

        setSelectedTextId(null)
        setSelectedShapeId(null)
        currentStrokeRef.current = {
            id: crypto.randomUUID(),
            color: currentStrokeColor,
            width: brushSize,
            opacity: 1,
            points: [pos]
        }
    }

    function handleCanvasClick(e) {
        if (e.button !== 0) return
        if (currentTool !== 'text') return

        if (suppressTextClickRef.current) {
            suppressTextClickRef.current = false
            return
        }

        const pos = getMousePos(e)
        const textItem = getTextAtPoint(pos)

        if (textItem) {
            setSelectedTextId(textItem.id)
            setSelectedShapeId(null)
            return
        }

        setSelectedTextId(null)
        setSelectedShapeId(null)
        setEditingText(createNextTextDraft(pos))
    }

    function handleCanvasDoubleClick(e) {
        if (e.button !== 0) return
        if (currentTool !== 'text') return

        const pos = getMousePos(e)
        const textItem = getTextAtPoint(pos)
        if (!textItem) return

        setSelectedTextId(textItem.id)
        setSelectedShapeId(null)
        setEditingText(createNextTextDraft(pos, textItem))
    }

    function handleMouseMove(e) {
        const screenPoint = getScreenPoint(e)
        positionToolCursor(screenPoint)

        if (panStateRef.current) {
            const pan = panStateRef.current
            updateCamera({
                ...cameraRef.current,
                x: pan.startCameraX + (e.clientX - pan.startClientX),
                y: pan.startCameraY + (e.clientY - pan.startClientY)
            })
            return
        }

        if (!isHoldingMouseDown.current) return
        const pos = screenToWorld(screenPoint)

        if (dragStateRef.current?.kind === 'text') {
            const drag = dragStateRef.current
            suppressTextClickRef.current = true
            drag.changed = true

            const nextTexts = textsRef.current.map(textItem => {
                if (textItem.id !== drag.textId) return textItem

                if (drag.mode === 'move') {
                    return {
                        ...textItem,
                        x: pos.x - drag.offsetX,
                        y: pos.y - drag.offsetY
                    }
                }

                return {
                    ...textItem,
                    width: Math.max(120, drag.startWidth + (pos.x - drag.startPointer.x)),
                    height: Math.max(60, drag.startHeight + (pos.y - drag.startPointer.y))
                }
            })

            textsRef.current = nextTexts
            setTexts(nextTexts)
            return
        }

        if (dragStateRef.current?.kind === 'shape') {
            const drag = dragStateRef.current
            drag.changed = true

            const nextShapes = shapesRef.current.map(shapeItem => {
                if (shapeItem.id !== drag.shapeId) return shapeItem

                if (drag.mode === 'move') {
                    return {
                        ...shapeItem,
                        x: pos.x - drag.offsetX,
                        y: pos.y - drag.offsetY
                    }
                }

                return {
                    ...shapeItem,
                    width: Math.max(SHAPE_MIN_SIZE, drag.startWidth + (pos.x - drag.startPointer.x)),
                    height: Math.max(SHAPE_MIN_SIZE, drag.startHeight + (pos.y - drag.startPointer.y))
                }
            })

            shapesRef.current = nextShapes
            setShapes(nextShapes)
            return
        }

        if (currentTool === 'eraser' || currentTool === 'point-eraser') {
            eraseQueueRef.current.push(pos)
            return
        }

        if (currentShapeRef.current) {
            const draft = currentShapeRef.current
            const dx = pos.x - draft.startPointer.x
            const dy = pos.y - draft.startPointer.y
            const distanceSquared = (dx * dx) + (dy * dy)

            if (!draft.created && distanceSquared < SHAPE_DRAG_THRESHOLD * SHAPE_DRAG_THRESHOLD) {
                return
            }

            const nextShape = createNextShapeDraft(
                draft.tool,
                draft.startPointer,
                pos,
                { id: draft.id }
            )

            const nextShapes = draft.created
                ? shapesRef.current.map(shapeItem => (
                    shapeItem.id === draft.id
                        ? nextShape
                        : shapeItem
                ))
                : [...shapesRef.current, nextShape]
            const nextLayerOrder = draft.created
                ? layerOrderRef.current
                : [...layerOrderRef.current, { type: 'shape', id: draft.id }]

            shapesRef.current = nextShapes
            layerOrderRef.current = nextLayerOrder
            setShapes(nextShapes)
            setLayerOrder(nextLayerOrder)
            setSelectedShapeId(draft.id)
            currentShapeRef.current = {
                ...draft,
                created: true
            }
            return
        }

        if (!currentStrokeRef.current) return

        const points = currentStrokeRef.current.points
        const last = points[points.length - 1]

        const dx = last.x - pos.x
        const dy = last.y - pos.y
        if (dx * dx + dy * dy < 4) return

        currentStrokeRef.current.points.push(pos)
        drawSegment(currentStrokeRef.current)
    }

    function handleMouseUp() {
        if (panStateRef.current) {
            panStateRef.current = null
            return
        }

        isHoldingMouseDown.current = false

        if (dragStateRef.current?.kind === 'text') {
            const drag = dragStateRef.current
            dragStateRef.current = null

            if (drag?.changed) {
                commitHistory(strokesRef.current, shapesRef.current, textsRef.current)
            }
            return
        }

        if (dragStateRef.current?.kind === 'shape') {
            const drag = dragStateRef.current
            dragStateRef.current = null

            if (drag?.changed) {
                commitHistory(strokesRef.current, shapesRef.current, textsRef.current)
            }
            return
        }

        if (currentShapeRef.current) {
            const { created, id: draftId } = currentShapeRef.current
            currentShapeRef.current = null

            if (!created) {
                return
            }

            const nextShapes = shapesRef.current.map(shapeItem => (
                shapeItem.id === draftId
                    ? ensureShapeMinimumSize(shapeItem)
                    : shapeItem
            ))

            applyBoardState(strokesRef.current, nextShapes, textsRef.current, { commitHistory: true })
            return
        }

        if (currentTool === 'brush') {
            if (!currentStrokeRef.current) return

            const finishedStroke = {
                ...currentStrokeRef.current,
                points: [...currentStrokeRef.current.points]
            }

            const nextStrokes = [...strokesRef.current, finishedStroke]
            currentStrokeRef.current = null
            applyBoardState(nextStrokes, shapesRef.current, textsRef.current, {
                commitHistory: true,
                layerOrder: [...layerOrderRef.current, { type: 'stroke', id: finishedStroke.id }]
            })
            return
        }

        if (currentTool === 'point-eraser') {
            processEraseQueue()

            if (pointEraseDirtyRef.current) {
                commitHistory(strokesRef.current, shapesRef.current, textsRef.current)
                pointEraseDirtyRef.current = false
            }
        }

        eraseQueueRef.current = []
    }
    function drawSegment(stroke) {
        const ctx = ctxRef.current
        if (!ctx || stroke.points.length < 2) return

        const prev = stroke.points[stroke.points.length - 2]
        const last = stroke.points[stroke.points.length - 1]

        ctx.save()
        applyViewportTransform(ctx)
        ctx.strokeStyle = stroke.color
        ctx.globalAlpha = stroke.opacity ?? 1
        ctx.lineWidth = stroke.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(last.x, last.y)
        ctx.stroke()
        ctx.restore()
    }

    function getSegmentEraseRanges(start, end, queue, threshold) {
        const dx = end.x - start.x
        const dy = end.y - start.y
        const lengthSquared = (dx * dx) + (dy * dy)
        const thresholdSquared = threshold * threshold

        if (lengthSquared === 0) {
            return isNear(start, queue, threshold) ? [{ start: 0, end: 1 }] : []
        }

        const ranges = []

        queue.forEach(pos => {
            const projection = (((pos.x - start.x) * dx) + ((pos.y - start.y) * dy)) / lengthSquared
            const closestT = Math.max(0, Math.min(1, projection))
            const closestX = start.x + (dx * closestT)
            const closestY = start.y + (dy * closestT)
            const distanceX = closestX - pos.x
            const distanceY = closestY - pos.y
            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY)

            if (distanceSquared >= thresholdSquared) return

            const offset = Math.sqrt((thresholdSquared - distanceSquared) / lengthSquared)
            const rangeStart = Math.max(0, projection - offset)
            const rangeEnd = Math.min(1, projection + offset)

            if (rangeEnd - rangeStart > 0.0001) {
                ranges.push({ start: rangeStart, end: rangeEnd })
            }
        })

        return mergeRanges(ranges)
    }

    function splitStrokeByErase(stroke, queue, threshold) {
        const points = stroke.points ?? []

        if (points.length === 0) return { segments: [], changed: false }
        if (points.length === 1) {
            return isNear(points[0], queue, threshold)
                ? { segments: [], changed: true }
                : { segments: [stroke], changed: false }
        }

        const segments = []
        let currentSegment = []
        let changed = false

        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i]
            const end = points[i + 1]
            const erasedRanges = getSegmentEraseRanges(start, end, queue, threshold)

            if (erasedRanges.length === 0) {
                if (currentSegment.length === 0) {
                    currentSegment.push(start)
                }

                appendPoint(currentSegment, end)
                continue
            }

            changed = true

            const visibleRanges = invertRanges(erasedRanges)

            if (visibleRanges.length === 0) {
                if (currentSegment.length > 1) {
                    segments.push({
                        ...stroke,
                        id: crypto.randomUUID(),
                        points: currentSegment
                    })
                }
                currentSegment = []
                continue
            }

            visibleRanges.forEach((range, index) => {
                const rangeStart = range.start <= 0 ? start : interpolatePoint(start, end, range.start)
                const rangeEnd = range.end >= 1 ? end : interpolatePoint(start, end, range.end)

                if (currentSegment.length === 0) {
                    currentSegment.push(rangeStart)
                } else {
                    appendPoint(currentSegment, rangeStart)
                }

                appendPoint(currentSegment, rangeEnd)

                if (index < visibleRanges.length - 1) {
                    if (currentSegment.length > 1) {
                        segments.push({
                            ...stroke,
                            id: crypto.randomUUID(),
                            points: currentSegment
                        })
                    }
                    currentSegment = []
                }
            })

            const lastVisibleRange = visibleRanges[visibleRanges.length - 1]
            if (lastVisibleRange.end < 1) {
                if (currentSegment.length > 1) {
                    segments.push({
                        ...stroke,
                        id: crypto.randomUUID(),
                        points: currentSegment
                    })
                }
                currentSegment = []
            }
        }

        if (!changed) {
            return { segments: [stroke], changed: false }
        }

        if (currentSegment.length > 1) {
            segments.push({
                ...stroke,
                id: crypto.randomUUID(),
                points: currentSegment
            })
        }

        return { segments, changed: true }
    }

    function processEraseQueue() {
        const queue = eraseQueueRef.current
        if (queue.length === 0) return

        const tool = currentToolRef.current
        const threshold = pointEraserSize

        let nextStrokes = strokesRef.current
        let nextShapes = shapesRef.current
        let nextTexts = textsRef.current
        let nextLayerOrder = layerOrderRef.current
        let hasChanges = false

        if (tool === 'eraser') {
            nextStrokes = strokesRef.current.filter(stroke => {
                if (!stroke.points || stroke.points.length === 0) return false
                return !stroke.points.some(point => isNear(point, queue, threshold * 3))
            })
            nextShapes = shapesRef.current.filter(shapeItem => (
                !queue.some(point => isPointInShape(point, shapeItem, threshold))
            ))
            nextTexts = textsRef.current.filter(textItem => (
                !queue.some(point => isPointInRect(point, getTextBounds(textItem)))
            ))
            hasChanges = nextStrokes.length !== strokesRef.current.length ||
                nextShapes.length !== shapesRef.current.length ||
                nextTexts.length !== textsRef.current.length
            nextLayerOrder = normalizeLayerOrder(nextStrokes, nextShapes, nextTexts, layerOrderRef.current)
        } else if (tool === 'point-eraser') {
            const replacementMap = new Map()
            nextStrokes = strokesRef.current.flatMap(stroke => {
                if (!stroke.points || stroke.points.length === 0) return []
                const result = splitStrokeByErase(stroke, queue, threshold)
                if (result.changed) {
                    hasChanges = true
                }
                replacementMap.set(stroke.id, result.segments.map(segment => segment.id))
                return result.segments
            })

            nextLayerOrder = []
            layerOrderRef.current.forEach(entry => {
                if (entry.type !== 'stroke') {
                    nextLayerOrder.push(entry)
                    return
                }

                const replacementIds = replacementMap.get(entry.id)
                if (!replacementIds) {
                    nextLayerOrder.push(entry)
                    return
                }

                replacementIds.forEach(id => {
                    nextLayerOrder.push({ type: 'stroke', id })
                })
            })
        }

        eraseQueueRef.current = []

        if (!hasChanges) return

        if (tool === 'point-eraser') {
            pointEraseDirtyRef.current = true
            applyBoardState(nextStrokes, nextShapes, nextTexts, { layerOrder: nextLayerOrder })
            return
        }

        if (isHoldingMouseDown.current) {
            applyBoardState(nextStrokes, nextShapes, nextTexts, { commitHistory: true, layerOrder: nextLayerOrder })
        }
    }

    function isNear(point, queue, threshold) {
        const t2 = threshold * threshold
        return queue.some(pos => {
            const dx = point.x - pos.x
            const dy = point.y - pos.y
            return dx * dx + dy * dy < t2
        })
    }

    function drawStroke(ctx, stroke) {
        const points = stroke.points
        if (points.length < 2) return

        ctx.save()
        ctx.strokeStyle = stroke.color
        ctx.globalAlpha = stroke.opacity ?? 1
        ctx.lineWidth = stroke.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)

        if (points.length === 2) {
            ctx.lineTo(points[1].x, points[1].y)
        } else {
            for (let i = 1; i < points.length - 1; i++) {
                const cpX = points[i].x
                const cpY = points[i].y
                const endX = (points[i].x + points[i + 1].x) / 2
                const endY = (points[i].y + points[i + 1].y) / 2

                ctx.quadraticCurveTo(cpX, cpY, endX, endY)
            }

            const secondLast = points[points.length - 2]
            const last = points[points.length - 1]
            ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y)
        }

        ctx.stroke()
        ctx.restore()
    }

    function drawWorld(ctx) {
        ctx.save()
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

        ctx.beginPath()
        for (let x = 0; x <= WORLD_WIDTH; x += WORLD_GRID_SIZE) {
            ctx.moveTo(x, 0)
            ctx.lineTo(x, WORLD_HEIGHT)
        }
        for (let y = 0; y <= WORLD_HEIGHT; y += WORLD_GRID_SIZE) {
            ctx.moveTo(0, y)
            ctx.lineTo(WORLD_WIDTH, y)
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.beginPath()
        for (let x = 0; x <= WORLD_WIDTH; x += WORLD_MAJOR_GRID_SIZE) {
            ctx.moveTo(x, 0)
            ctx.lineTo(x, WORLD_HEIGHT)
        }
        for (let y = 0; y <= WORLD_HEIGHT; y += WORLD_MAJOR_GRID_SIZE) {
            ctx.moveTo(0, y)
            ctx.lineTo(WORLD_WIDTH, y)
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)'
        ctx.lineWidth = 1.25
        ctx.stroke()

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)'
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
        ctx.restore()
    }

    function drawSelectionBounds(ctx, bounds, handle) {
        ctx.save()
        ctx.strokeStyle = '#2563eb'
        ctx.lineWidth = 1
        ctx.setLineDash([6, 4])
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
        ctx.setLineDash([])
        ctx.fillStyle = '#2563eb'
        ctx.fillRect(handle.x, handle.y, handle.width, handle.height)
        ctx.restore()
    }

    function drawTextSelection(ctx, textItem) {
        drawSelectionBounds(ctx, getTextBounds(textItem), getResizeHandleBounds(textItem))
    }

    function drawShapeSelection(ctx, shapeItem) {
        drawSelectionBounds(ctx, getShapeBounds(shapeItem), getShapeResizeHandleBounds(shapeItem))
    }

    function drawArrowShape(ctx, shapeItem) {
        const { start, end, arrowHeadTop, arrowHeadBottom } = getArrowGeometry(shapeItem)

        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.moveTo(arrowHeadTop.x, arrowHeadTop.y)
        ctx.lineTo(end.x, end.y)
        ctx.lineTo(arrowHeadBottom.x, arrowHeadBottom.y)
        ctx.stroke()
    }

    function drawShape(ctx, shapeItem) {
        if (shapeItem.width <= 0 || shapeItem.height <= 0) return

        ctx.save()
        ctx.lineWidth = shapeItem.strokeWidth
        ctx.strokeStyle = shapeItem.color
        ctx.fillStyle = shapeItem.color
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'

        if (shapeItem.type === 'rectangle') {
            ctx.fillRect(shapeItem.x, shapeItem.y, shapeItem.width, shapeItem.height)
            ctx.strokeRect(shapeItem.x, shapeItem.y, shapeItem.width, shapeItem.height)
        } else if (shapeItem.type === 'circle') {
            ctx.beginPath()
            ctx.ellipse(
                shapeItem.x + (shapeItem.width / 2),
                shapeItem.y + (shapeItem.height / 2),
                Math.max(1, shapeItem.width / 2),
                Math.max(1, shapeItem.height / 2),
                0,
                0,
                Math.PI * 2
            )
            ctx.fill()
            ctx.stroke()
        } else if (shapeItem.type === 'diamond') {
            const vertices = getShapeVertices(shapeItem)
            ctx.beginPath()
            ctx.moveTo(vertices[0].x, vertices[0].y)
            vertices.slice(1).forEach(vertex => ctx.lineTo(vertex.x, vertex.y))
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
        } else if (shapeItem.type === 'arrow') {
            drawArrowShape(ctx, shapeItem)
        }

        if (selectedShapeId === shapeItem.id) {
            drawShapeSelection(ctx, shapeItem)
        }

        ctx.restore()
    }

    function drawTexts(ctx, allTexts) {
        allTexts.forEach(textItem => {
            if (editingText?.id === textItem.id) {
                return
            }

            const layout = getTextLayout(ctx, textItem)

            ctx.save()
            ctx.font = `${layout.fontSize}px "Geist Variable", sans-serif`
            ctx.fillStyle = textItem.color || '#111827'
            ctx.textBaseline = 'top'

            layout.lines.forEach((line, index) => {
                ctx.fillText(
                    line,
                    textItem.x + TEXT_PADDING,
                    textItem.y + TEXT_PADDING + (index * layout.lineHeight)
                )
            })

            if (selectedTextId === textItem.id && editingText?.id !== textItem.id) {
                drawTextSelection(ctx, textItem)
            }

            ctx.restore()
        })
    }

    function redraw(allStrokes, allShapes, allTexts) {
        const ctx = ctxRef.current
        if (!ctx) return

        prepareCanvasForRedraw(ctx)
        drawWorld(ctx)

        const strokeMap = new Map(allStrokes.map(stroke => [stroke.id, stroke]))
        const shapeMap = new Map(allShapes.map(shapeItem => [shapeItem.id, shapeItem]))
        const textMap = new Map(allTexts.map(textItem => [textItem.id, textItem]))

        normalizeLayerOrder(allStrokes, allShapes, allTexts, layerOrderRef.current).forEach(entry => {
            if (entry.type === 'stroke') {
                const stroke = strokeMap.get(entry.id)
                if (stroke) {
                    drawStroke(ctx, stroke)
                }
                return
            }

            if (entry.type === 'shape') {
                const shapeItem = shapeMap.get(entry.id)
                if (shapeItem) {
                    drawShape(ctx, shapeItem)
                }
                return
            }

            if (entry.type === 'text') {
                const textItem = textMap.get(entry.id)
                if (textItem && editingText?.id !== textItem.id) {
                    const layout = getTextLayout(ctx, textItem)

                    ctx.save()
                    ctx.font = `${layout.fontSize}px "Geist Variable", sans-serif`
                    ctx.fillStyle = textItem.color || '#111827'
                    ctx.textBaseline = 'top'

                    layout.lines.forEach((line, index) => {
                        ctx.fillText(
                            line,
                            textItem.x + TEXT_PADDING,
                            textItem.y + TEXT_PADDING + (index * layout.lineHeight)
                        )
                    })

                    if (selectedTextId === textItem.id && editingText?.id !== textItem.id) {
                        drawTextSelection(ctx, textItem)
                    }

                    ctx.restore()
                }
            }
        })
    }

    function updateEditingTextFromInput(nextValue) {
        setEditingText(prev => {
            if (!prev) return prev
            return { ...prev, text: nextValue }
        })
    }

    function updateActiveTextStyle(updater) {
        if (editingText) {
            setEditingText(prev => {
                if (!prev) return prev

                const nextText = updater(prev)
                if (nextText.color && nextText.color !== currentTextColor) {
                    setCurrentTextColor(nextText.color)
                }
                if (nextText.fontSize && nextText.fontSize !== defaultTextFontSize) {
                    setDefaultTextFontSize(nextText.fontSize)
                }

                return nextText
            })
            return
        }

        const activeText = selectedText
        if (!activeText) {
            const nextTextDefaults = updater({
                color: currentTextColor,
                fontSize: defaultTextFontSize
            })

            if (nextTextDefaults.color && nextTextDefaults.color !== currentTextColor) {
                setCurrentTextColor(nextTextDefaults.color)
            }
            if (nextTextDefaults.fontSize && nextTextDefaults.fontSize !== defaultTextFontSize) {
                setDefaultTextFontSize(nextTextDefaults.fontSize)
            }
            return
        }

        const nextText = updater(activeText)
        if (nextText.color && nextText.color !== currentTextColor) {
            setCurrentTextColor(nextText.color)
        }
        if (nextText.fontSize && nextText.fontSize !== defaultTextFontSize) {
            setDefaultTextFontSize(nextText.fontSize)
        }

        updateSelectedText(updater)
    }

    function updateSelectedShape(updater) {
        if (!selectedShapeId) return

        const nextShapes = shapesRef.current.map(shapeItem => (
            shapeItem.id === selectedShapeId
                ? updater(shapeItem)
                : shapeItem
        ))

        const nextSelectedShape = nextShapes.find(shapeItem => shapeItem.id === selectedShapeId)
        if (nextSelectedShape?.color && nextSelectedShape.color !== currentShapeColor) {
            setCurrentShapeColor(nextSelectedShape.color)
        }
        if (nextSelectedShape?.strokeWidth && nextSelectedShape.strokeWidth !== brushSize) {
            setBrushSize(nextSelectedShape.strokeWidth)
        }

        applyBoardState(strokesRef.current, nextShapes, textsRef.current, { commitHistory: true })
    }

    function markTextInspectorInteraction() {
        textInspectorInteractingRef.current = true
    }

    function releaseTextInspectorInteraction() {
        requestAnimationFrame(() => {
            textInspectorInteractingRef.current = false
        })
    }

    function handleEditingTextBlur(e) {
        const nextFocusedElement = e.relatedTarget

        if (
            textInspectorInteractingRef.current ||
            (nextFocusedElement instanceof HTMLElement && textInspectorRef.current?.contains(nextFocusedElement))
        ) {
            requestAnimationFrame(() => {
                textInputRef.current?.focus()
            })
            return
        }

        commitEditingText()
    }

    function handleToolbarColorChange(nextColor) {
        if (currentTool === 'text') {
            updateActiveTextStyle(textItem => ({
                ...textItem,
                color: nextColor
            }))
            return
        }

        if (SHAPE_TOOL_IDS.includes(currentTool) && selectedShape) {
            updateSelectedShape(shapeItem => ({
                ...shapeItem,
                color: nextColor
            }))
            return
        }

        if (SHAPE_TOOL_IDS.includes(currentTool)) {
            setCurrentShapeColor(nextColor)
            return
        }

        setCurrentStrokeColor(nextColor)
    }

    function handleToolbarSizeChange(nextSize) {
        if (currentTool === 'text') {
            updateActiveTextStyle(textItem => ({
                ...textItem,
                fontSize: nextSize
            }))
            return
        }

        if (SHAPE_TOOL_IDS.includes(currentTool) && selectedShape) {
            updateSelectedShape(shapeItem => ({
                ...shapeItem,
                strokeWidth: nextSize
            }))
            return
        }

        setBrushSize(nextSize)
    }

    function commitEditingText() {
        if (!editingText) return

        const trimmedText = editingText.text.trim()
        const zoom = cameraRef.current.zoom
        const nextText = {
            ...editingText,
            width: Math.max(120, (textInputRef.current?.offsetWidth ?? (editingText.width * zoom)) / zoom),
            height: Math.max(60, (textInputRef.current?.offsetHeight ?? (editingText.height * zoom)) / zoom)
        }

        setEditingText(null)

        if (!trimmedText) {
            const nextTexts = textsRef.current.filter(textItem => textItem.id !== nextText.id)
            applyBoardState(strokesRef.current, shapesRef.current, nextTexts, { commitHistory: true })
            setSelectedTextId(null)
            return
        }

        const exists = textsRef.current.some(textItem => textItem.id === nextText.id)
        const nextTexts = exists
            ? textsRef.current.map(textItem => (
                textItem.id === nextText.id
                    ? { ...nextText, text: trimmedText }
                    : textItem
            ))
            : [...textsRef.current, { ...nextText, text: trimmedText }]

        applyBoardState(strokesRef.current, shapesRef.current, nextTexts, {
            commitHistory: true,
            layerOrder: exists
                ? layerOrderRef.current
                : [...layerOrderRef.current, { type: 'text', id: nextText.id }]
        })
        setSelectedTextId(nextText.id)
    }

    function updateSelectedText(updater) {
        if (!selectedTextId) return

        const nextTexts = textsRef.current.map(textItem => (
            textItem.id === selectedTextId
                ? updater(textItem)
                : textItem
        ))

        applyBoardState(strokesRef.current, shapesRef.current, nextTexts, { commitHistory: true })
    }

    function deleteSelectedText() {
        if (!selectedTextId) return

        const nextTexts = textsRef.current.filter(textItem => textItem.id !== selectedTextId)
        applyBoardState(strokesRef.current, shapesRef.current, nextTexts, { commitHistory: true })
        setSelectedTextId(null)
    }

    function deleteSelectedShape() {
        if (!selectedShapeId) return

        const nextShapes = shapesRef.current.filter(shapeItem => shapeItem.id !== selectedShapeId)
        applyBoardState(strokesRef.current, nextShapes, textsRef.current, { commitHistory: true })
        setSelectedShapeId(null)
    }

    function clearBoard() {
        applyBoardState([], [], [], { commitHistory: true })
        setSelectedTextId(null)
        setSelectedShapeId(null)
        setEditingText(null)
    }

    function exportBoard() {
        const canvas = canvasRef.current
        if (!canvas) return

        const url = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = url
        link.download = `${boardName.toLowerCase().replace(/\s+/g, '-') || 'whiteboard'}.png`
        link.click()
    }

    function handleWheel(e) {
        e.preventDefault()

        updateCanvasRect()
        const screenPoint = getScreenPoint(e)
        const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05
        setZoomAtScreenPoint(screenPoint, cameraRef.current.zoom + zoomDelta)
    }

    function handleCanvasMouseEnter(e) {
        updateCanvasRect()
        positionToolCursor(getScreenPoint(e))
    }

    function handleCanvasMouseLeave() {
        hideToolCursor()
        handleMouseUp()
    }

    function handleZoomIn() {
        const canvas = canvasRef.current
        if (!canvas) return

        setZoomAtScreenPoint(
            { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 },
            cameraRef.current.zoom + 0.05
        )
    }

    function handleZoomOut() {
        const canvas = canvasRef.current
        if (!canvas) return

        setZoomAtScreenPoint(
            { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 },
            cameraRef.current.zoom - 0.05
        )
    }

    function handleZoomInputChange(nextValue) {
        if (nextValue === '') {
            setZoomInput('')
            return
        }

        if (!/^\d+$/.test(nextValue)) return
        setZoomInput(nextValue)
    }

    function commitZoomInput() {
        const canvas = canvasRef.current
        const parsedValue = Number.parseInt(zoomInput, 10)

        if (!canvas || Number.isNaN(parsedValue)) {
            setZoomInput(`${Math.round(cameraRef.current.zoom * 100)}`)
            return
        }

        setZoomAtScreenPoint(
            { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 },
            parsedValue / 100
        )
    }

    const canUndo = historyIndex > 0
    const canRedo = historyIndex < historyRef.current.length - 1

    return (
        <div className="h-[100dvh] w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)] text-slate-900">
            <div className="mx-auto flex h-full w-full max-w-[1800px] min-h-0 flex-col">
                <main className="relative flex-1 min-h-0 overflow-hidden border border-white/70 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.10)]">
                    <FloatingToolbar
                        toolbarRef={textInspectorRef}
                        sizePopoverRef={sizePopoverRef}
                        onMouseDownCapture={markTextInspectorInteraction}
                        onMouseUpCapture={releaseTextInspectorInteraction}
                        tools={TOOLS}
                        shapeTools={SHAPE_TOOLS}
                        isShapeTool={isShapeTool}
                        currentTool={currentTool}
                        setCurrentTool={setCurrentTool}
                        activeShapeTool={activeShapeTool}
                        toolbarColor={toolbarColor}
                        onToolbarColorChange={handleToolbarColorChange}
                        activeToolbarPanel={activeToolbarPanel}
                        setActiveToolbarPanel={setActiveToolbarPanel}
                        toolbarSizeLabel={toolbarSizeLabel}
                        toolbarSizeValue={toolbarSizeValue}
                        toolbarSize={toolbarSize}
                        onToolbarSizeChange={handleToolbarSizeChange}
                    />
                    <CanvasActionButtons
                        canUndo={canUndo}
                        canRedo={canRedo}
                        zoomValue={zoomInput}
                        onUndo={undo}
                        onRedo={redo}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomChange={handleZoomInputChange}
                        onZoomCommit={commitZoomInput}
                        onExport={exportBoard}
                        onClear={clearBoard}
                    />
                    <WhiteboardCanvas
                        containerRef={containerRef}
                        canvasRef={canvasRef}
                        textInputRef={textInputRef}
                        canvasCursor={canvasCursor}
                        handleMouseDown={handleMouseDown}
                        handleCanvasMouseEnter={handleCanvasMouseEnter}
                        handleMouseMove={handleMouseMove}
                        handleMouseUp={handleMouseUp}
                        handleCanvasMouseLeave={handleCanvasMouseLeave}
                        handleCanvasClick={handleCanvasClick}
                        handleCanvasDoubleClick={handleCanvasDoubleClick}
                        editingText={editingText}
                        camera={camera}
                        worldToScreen={worldToScreen}
                        updateEditingTextFromInput={updateEditingTextFromInput}
                        handleEditingTextBlur={handleEditingTextBlur}
                        commitEditingText={commitEditingText}
                        handleEditingTextEscape={() => setEditingText(null)}
                    >
                        <CursorOverlay
                            currentTool={currentTool}
                            cursorOverlayRef={cursorOverlayRef}
                            shouldUseFollowCursor={shouldUseFollowCursor}
                            pointEraserSize={pointEraserSize}
                            cameraZoom={camera.zoom}
                        />
                    </WhiteboardCanvas>
                </main>
            </div>
        </div>
    )
}

export default App
