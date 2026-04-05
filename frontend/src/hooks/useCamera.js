import { useRef, useState } from 'react'
import { clampCamera, screenToWorldPoint, worldToScreenPoint } from '../utils/whiteboardCoordinates'

export function useCamera({ canvasRef, worldWidth, worldHeight }) {
    const devicePixelRatioRef = useRef(1)
    const cameraRef = useRef({ x: 0, y: 0, zoom: 1 })
    const hasInitializedCameraRef = useRef(false)
    const [camera, setCamera] = useState(cameraRef.current)

    function applyViewportTransform(ctx) {
        const dpr = devicePixelRatioRef.current
        const { x, y, zoom } = cameraRef.current
        ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * x, dpr * y)
    }

    function updateCamera(nextCamera) {
        const clampedCamera = clampCamera(nextCamera, canvasRef.current, worldWidth, worldHeight)
        cameraRef.current = clampedCamera
        setCamera(clampedCamera)
    }

    function screenToWorld(point) {
        return screenToWorldPoint(cameraRef.current, point)
    }

    function worldToScreen(point) {
        return worldToScreenPoint(cameraRef.current, point)
    }

    function zoomAtScreenPoint(screenPoint, zoomFactor) {
        const worldPoint = screenToWorld(screenPoint)
        const nextZoom = Math.min(3, Math.max(0.05, cameraRef.current.zoom * zoomFactor))

        updateCamera({
            x: screenPoint.x - (worldPoint.x * nextZoom),
            y: screenPoint.y - (worldPoint.y * nextZoom),
            zoom: nextZoom
        })
    }

    function setZoomAtScreenPoint(screenPoint, nextZoom) {
        const worldPoint = screenToWorld(screenPoint)
        const clampedZoom = Math.min(3, Math.max(0.05, nextZoom))

        updateCamera({
            x: screenPoint.x - (worldPoint.x * clampedZoom),
            y: screenPoint.y - (worldPoint.y * clampedZoom),
            zoom: clampedZoom
        })
    }

    return {
        camera,
        setCamera,
        cameraRef,
        devicePixelRatioRef,
        hasInitializedCameraRef,
        applyViewportTransform,
        updateCamera,
        screenToWorld,
        worldToScreen,
        zoomAtScreenPoint,
        setZoomAtScreenPoint
    }
}
