import { ArrowRight, Brush, Circle, Diamond, Eraser, Square, Type } from 'lucide-react'

function getCursorIcon(currentTool) {
    if (currentTool === 'brush') return Brush
    if (currentTool === 'eraser') return Eraser
    if (currentTool === 'text') return Type
    if (currentTool === 'arrow') return ArrowRight
    if (currentTool === 'rectangle') return Square
    if (currentTool === 'circle') return Circle
    if (currentTool === 'diamond') return Diamond
    return null
}

export default function CursorOverlay({
    currentTool,
    cursorOverlayRef,
    shouldUseFollowCursor,
    pointEraserSize,
    cameraZoom
}) {
    if (!shouldUseFollowCursor) return null

    const CursorIcon = getCursorIcon(currentTool)

    return (
        <div
            ref={cursorOverlayRef}
            className={`pointer-events-none absolute z-30 transition-opacity ${currentTool === 'point-eraser'
                ? '-translate-x-1/2 -translate-y-1/2'
                : '-translate-x-1/3 -translate-y-5/6'
                }`}
            style={{
                left: 0,
                top: 0,
                opacity: 0
            }}
        >
            {currentTool === 'point-eraser' ? (
                <div
                    className="rounded-full border border-slate-900/60 bg-white/15"
                    style={{
                        width: `${Math.max(16, pointEraserSize * cameraZoom)}px`,
                        height: `${Math.max(16, pointEraserSize * cameraZoom)}px`
                    }}
                />
            ) : CursorIcon ? (
                <CursorIcon className={`h-5 w-5 ${currentTool === 'text' && 'mt-10'} text-slate-900`} strokeWidth={2} />
            ) : null}
        </div>
    )
}
