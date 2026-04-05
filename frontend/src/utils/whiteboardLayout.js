import {
    DEFAULT_TEXT_HEIGHT,
    DEFAULT_TEXT_FONT_SIZE,
    DEFAULT_TEXT_WIDTH,
    SHAPE_MIN_SIZE,
    SHAPE_RESIZE_HIT_SIZE,
    SHAPE_RESIZE_HANDLE_SIZE,
    TEXT_LINE_HEIGHT_RATIO,
    TEXT_PADDING,
    TEXT_RESIZE_HANDLE_SIZE
} from '../lib/whiteboard/constants'
import { distanceToSegment, isPointInRect, normalizeShapeBounds, pointInPolygon } from './whiteboardMath'

export function createTextDraft(pos, baseText = {}, defaults = {}) {
    return {
        id: baseText.id ?? crypto.randomUUID(),
        x: baseText.x ?? pos.x,
        y: baseText.y ?? pos.y,
        text: baseText.text ?? '',
        color: baseText.color ?? defaults.currentTextColor,
        width: baseText.width ?? DEFAULT_TEXT_WIDTH,
        height: baseText.height ?? DEFAULT_TEXT_HEIGHT,
        fontSize: baseText.fontSize ?? defaults.defaultTextFontSize
    }
}

export function createShapeDraft(type, start, end, overrides = {}, defaults = {}) {
    const bounds = normalizeShapeBounds(start, end)

    return {
        id: overrides.id ?? crypto.randomUUID(),
        type,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        color: overrides.color ?? defaults.currentShapeColor,
        strokeWidth: overrides.strokeWidth ?? defaults.brushSize,
        arrowDirection: overrides.arrowDirection ?? (type === 'arrow' ? (end.x >= start.x ? 'right' : 'left') : undefined)
    }
}

export function ensureShapeMinimumSize(shapeItem) {
    return {
        ...shapeItem,
        width: Math.max(SHAPE_MIN_SIZE, shapeItem.width),
        height: Math.max(SHAPE_MIN_SIZE, shapeItem.height)
    }
}

export function getTextLayout(ctx, textItem) {
    const fontSize = textItem.fontSize ?? DEFAULT_TEXT_FONT_SIZE
    const lineHeight = Math.round(fontSize * TEXT_LINE_HEIGHT_RATIO)
    const maxWidth = Math.max(40, (textItem.width ?? DEFAULT_TEXT_WIDTH) - TEXT_PADDING * 2)
    const rawLines = (textItem.text || '').split('\n')
    const lines = []

    ctx.font = `${fontSize}px "Geist Variable", sans-serif`

    rawLines.forEach(rawLine => {
        if (rawLine.length === 0) {
            lines.push('')
            return
        }

        const words = rawLine.split(' ')
        let currentLine = words[0] ?? ''

        for (let i = 1; i < words.length; i++) {
            const candidate = `${currentLine} ${words[i]}`
            if (ctx.measureText(candidate).width <= maxWidth) {
                currentLine = candidate
                continue
            }

            lines.push(currentLine)
            currentLine = words[i]
        }

        while (ctx.measureText(currentLine).width > maxWidth && currentLine.length > 1) {
            let sliceIndex = currentLine.length - 1

            while (sliceIndex > 1 && ctx.measureText(currentLine.slice(0, sliceIndex)).width > maxWidth) {
                sliceIndex -= 1
            }

            lines.push(currentLine.slice(0, sliceIndex))
            currentLine = currentLine.slice(sliceIndex)
        }

        lines.push(currentLine)
    })

    const contentHeight = Math.max(lineHeight, lines.length * lineHeight)
    const width = textItem.width ?? DEFAULT_TEXT_WIDTH
    const height = Math.max(textItem.height ?? DEFAULT_TEXT_HEIGHT, contentHeight + TEXT_PADDING * 2)

    return {
        lines,
        fontSize,
        lineHeight,
        width,
        height
    }
}

export function getTextBounds(ctx, textItem) {
    if (!ctx) {
        return {
            x: textItem.x,
            y: textItem.y,
            width: textItem.width ?? DEFAULT_TEXT_WIDTH,
            height: textItem.height ?? DEFAULT_TEXT_HEIGHT
        }
    }

    const layout = getTextLayout(ctx, textItem)
    return {
        x: textItem.x,
        y: textItem.y,
        width: layout.width,
        height: layout.height
    }
}

export function getResizeHandleBounds(ctx, textItem) {
    const bounds = getTextBounds(ctx, textItem)
    return {
        x: bounds.x + bounds.width - TEXT_RESIZE_HANDLE_SIZE,
        y: bounds.y + bounds.height - TEXT_RESIZE_HANDLE_SIZE,
        width: TEXT_RESIZE_HANDLE_SIZE,
        height: TEXT_RESIZE_HANDLE_SIZE
    }
}

export function getShapeBounds(shapeItem) {
    return {
        x: shapeItem.x,
        y: shapeItem.y,
        width: shapeItem.width,
        height: shapeItem.height
    }
}

export function getShapeResizeHandleBounds(shapeItem) {
    const bounds = getShapeBounds(shapeItem)
    return {
        x: bounds.x + bounds.width - SHAPE_RESIZE_HANDLE_SIZE,
        y: bounds.y + bounds.height - SHAPE_RESIZE_HANDLE_SIZE,
        width: SHAPE_RESIZE_HANDLE_SIZE,
        height: SHAPE_RESIZE_HANDLE_SIZE
    }
}

export function getShapeResizeHitBounds(shapeItem) {
    const handle = getShapeResizeHandleBounds(shapeItem)
    const extraWidth = Math.max(0, SHAPE_RESIZE_HIT_SIZE - handle.width)
    const extraHeight = Math.max(0, SHAPE_RESIZE_HIT_SIZE - handle.height)

    return {
        x: handle.x - (extraWidth / 2),
        y: handle.y - (extraHeight / 2),
        width: handle.width + extraWidth,
        height: handle.height + extraHeight
    }
}

export function getShapeVertices(shapeItem) {
    const { x, y, width, height } = shapeItem

    return [
        { x: x + (width / 2), y },
        { x: x + width, y: y + (height / 2) },
        { x: x + (width / 2), y: y + height },
        { x, y: y + (height / 2) }
    ]
}

export function getArrowGeometry(shapeItem) {
    const centerY = shapeItem.y + (shapeItem.height / 2)
    const isLeftArrow = shapeItem.arrowDirection === 'left'
    const start = isLeftArrow
        ? { x: shapeItem.x + shapeItem.width, y: centerY }
        : { x: shapeItem.x, y: centerY }
    const end = isLeftArrow
        ? { x: shapeItem.x, y: centerY }
        : { x: shapeItem.x + shapeItem.width, y: centerY }
    const arrowHeadX = isLeftArrow
        ? shapeItem.x + (shapeItem.width * 0.28)
        : shapeItem.x + (shapeItem.width * 0.72)

    return {
        start,
        end,
        arrowHeadTop: { x: arrowHeadX, y: shapeItem.y },
        arrowHeadBottom: { x: arrowHeadX, y: shapeItem.y + shapeItem.height }
    }
}

export function isPointInShape(point, shapeItem, threshold = 0) {
    if (shapeItem.type === 'arrow') {
        const { start, end, arrowHeadTop, arrowHeadBottom } = getArrowGeometry(shapeItem)

        return distanceToSegment(point, start, end) <= Math.max(8, shapeItem.strokeWidth + threshold) ||
            pointInPolygon(point, [end, arrowHeadTop, arrowHeadBottom])
    }

    if (shapeItem.type === 'diamond') {
        return pointInPolygon(point, getShapeVertices(shapeItem))
    }

    if (shapeItem.type === 'circle') {
        const radiusX = shapeItem.width / 2
        const radiusY = shapeItem.height / 2
        const centerX = shapeItem.x + radiusX
        const centerY = shapeItem.y + radiusY
        const normalizedX = (point.x - centerX) / Math.max(1, radiusX + threshold)
        const normalizedY = (point.y - centerY) / Math.max(1, radiusY + threshold)

        return (normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1
    }

    return isPointInRect(point, {
        x: shapeItem.x - threshold,
        y: shapeItem.y - threshold,
        width: shapeItem.width + (threshold * 2),
        height: shapeItem.height + (threshold * 2)
    })
}
