import { useEffect, useRef } from 'react'

export function useMouseCanvas({ canvasRef, shouldUseFollowCursor }) {
    const canvasRectRef = useRef({ left: 0, top: 0, width: 0, height: 0 })
    const cursorOverlayRef = useRef(null)

    useEffect(() => {
        if (shouldUseFollowCursor) return
        hideToolCursor()
    }, [shouldUseFollowCursor])

    function updateCanvasRect() {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return null

        const nextRect = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        }

        canvasRectRef.current = nextRect
        return nextRect
    }

    function getScreenPoint(e) {
        const rect = (canvasRectRef.current.width > 0 && canvasRectRef.current.height > 0)
            ? canvasRectRef.current
            : updateCanvasRect()

        if (!rect) {
            return { x: 0, y: 0 }
        }

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    function positionToolCursor(screenPoint) {
        const cursorOverlay = cursorOverlayRef.current
        if (!cursorOverlay || !shouldUseFollowCursor) return

        cursorOverlay.style.opacity = '1'
        cursorOverlay.style.left = `${screenPoint.x}px`
        cursorOverlay.style.top = `${screenPoint.y}px`
    }

    function hideToolCursor() {
        const cursorOverlay = cursorOverlayRef.current
        if (!cursorOverlay) return
        cursorOverlay.style.opacity = '0'
    }

    return {
        canvasRectRef,
        cursorOverlayRef,
        updateCanvasRect,
        getScreenPoint,
        positionToolCursor,
        hideToolCursor
    }
}
