import { TEXT_LINE_HEIGHT_RATIO, TEXT_PADDING } from '../lib/whiteboard/constants'

export default function WhiteboardCanvas({
    containerRef,
    canvasRef,
    textInputRef,
    canvasCursor,
    handleMouseDown,
    handleCanvasMouseEnter,
    handleMouseMove,
    handleMouseUp,
    handleCanvasMouseLeave,
    handleCanvasClick,
    handleCanvasDoubleClick,
    editingText,
    camera,
    worldToScreen,
    updateEditingTextFromInput,
    handleEditingTextBlur,
    commitEditingText,
    handleEditingTextEscape,
    children
}) {
    return (
        <div
            ref={containerRef}
            className="relative h-full min-h-0 w-full flex-1 overflow-hidden"
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: canvasCursor,
                    touchAction: 'none'
                }}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleCanvasMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
                onContextMenu={(e) => {
                    if (e.button === 1) {
                        e.preventDefault()
                    }
                }}
            />

            {editingText && (
                <textarea
                    ref={textInputRef}
                    style={{
                        position: 'absolute',
                        left: `${worldToScreen({ x: editingText.x, y: editingText.y }).x}px`,
                        top: `${worldToScreen({ x: editingText.x, y: editingText.y }).y}px`,
                        width: `${editingText.width * camera.zoom}px`,
                        height: `${editingText.height * camera.zoom}px`,
                        fontSize: `${editingText.fontSize * camera.zoom}px`,
                        lineHeight: TEXT_LINE_HEIGHT_RATIO,
                        color: editingText.color,
                        border: '1px solid #2563eb',
                        padding: `${TEXT_PADDING * camera.zoom}px`,
                        background: 'rgba(255, 255, 255, 0.98)',
                        zIndex: 20,
                        outline: 'none',
                        resize: 'both',
                        overflow: 'hidden',
                        fontFamily: '"Geist Variable", sans-serif',
                        whiteSpace: 'pre-wrap',
                        borderRadius: '18px',
                        boxShadow: '0 12px 32px rgba(37, 99, 235, 0.18)'
                    }}
                    value={editingText.text}
                    onChange={(e) => updateEditingTextFromInput(e.target.value)}
                    onBlur={handleEditingTextBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            handleEditingTextEscape()
                            return
                        }

                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault()
                            commitEditingText()
                        }
                    }}
                />
            )}

            {children}
        </div>
    )
}
