import { useRef } from 'react'

export function useDrawingState() {
    return {
        currentStrokeRef: useRef(null),
        currentShapeRef: useRef(null),
        isHoldingMouseDown: useRef(false),
        dragStateRef: useRef(null),
        pointEraseDirtyRef: useRef(false),
        eraseQueueRef: useRef([])
    }
}
