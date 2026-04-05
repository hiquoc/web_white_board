export function normalizeShapeBounds(start, end) {
    return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y)
    }
}

export function isPointInRect(point, rect) {
    return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
    )
}

export function pointInPolygon(point, vertices) {
    let inside = false

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x
        const yi = vertices[i].y
        const xj = vertices[j].x
        const yj = vertices[j].y
        const intersects = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.0001)) + xi)

        if (intersects) {
            inside = !inside
        }
    }

    return inside
}

export function distanceToSegment(point, start, end) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lengthSquared = (dx * dx) + (dy * dy)

    if (lengthSquared === 0) {
        return Math.hypot(point.x - start.x, point.y - start.y)
    }

    const t = Math.max(0, Math.min(1, (((point.x - start.x) * dx) + ((point.y - start.y) * dy)) / lengthSquared))
    const projectedX = start.x + (dx * t)
    const projectedY = start.y + (dy * t)

    return Math.hypot(point.x - projectedX, point.y - projectedY)
}

export function interpolatePoint(start, end, t) {
    return {
        x: start.x + ((end.x - start.x) * t),
        y: start.y + ((end.y - start.y) * t)
    }
}

export function appendPoint(points, point) {
    const last = points[points.length - 1]

    if (!last) {
        points.push(point)
        return
    }

    const dx = point.x - last.x
    const dy = point.y - last.y

    if (dx * dx + dy * dy < 0.0001) return
    points.push(point)
}

export function mergeRanges(ranges) {
    if (ranges.length === 0) return []

    const sorted = [...ranges].sort((a, b) => a.start - b.start)
    const merged = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i]
        const previous = merged[merged.length - 1]

        if (current.start <= previous.end) {
            previous.end = Math.max(previous.end, current.end)
            continue
        }

        merged.push(current)
    }

    return merged
}

export function invertRanges(ranges) {
    if (ranges.length === 0) {
        return [{ start: 0, end: 1 }]
    }

    const segments = []
    let cursor = 0

    ranges.forEach(range => {
        if (range.start > cursor) {
            segments.push({ start: cursor, end: range.start })
        }
        cursor = Math.max(cursor, range.end)
    })

    if (cursor < 1) {
        segments.push({ start: cursor, end: 1 })
    }

    return segments.filter(range => range.end - range.start > 0.0001)
}
