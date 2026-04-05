export function clampCamera(nextCamera, canvas, worldWidth, worldHeight) {
    if (!canvas) return nextCamera

    const viewportWidth = canvas.clientWidth
    const viewportHeight = canvas.clientHeight
    const worldScreenWidth = worldWidth * nextCamera.zoom
    const worldScreenHeight = worldHeight * nextCamera.zoom

    let clampedX = nextCamera.x
    let clampedY = nextCamera.y

    if (worldScreenWidth <= viewportWidth) {
        clampedX = (viewportWidth - worldScreenWidth) / 2
    } else {
        const minX = viewportWidth - worldScreenWidth
        clampedX = Math.min(0, Math.max(minX, clampedX))
    }

    if (worldScreenHeight <= viewportHeight) {
        clampedY = (viewportHeight - worldScreenHeight) / 2
    } else {
        const minY = viewportHeight - worldScreenHeight
        clampedY = Math.min(0, Math.max(minY, clampedY))
    }

    return {
        ...nextCamera,
        x: clampedX,
        y: clampedY
    }
}

export function screenToWorldPoint(camera, point) {
    const { x, y, zoom } = camera
    return {
        x: (point.x - x) / zoom,
        y: (point.y - y) / zoom
    }
}

export function worldToScreenPoint(camera, point) {
    const { x, y, zoom } = camera
    return {
        x: (point.x * zoom) + x,
        y: (point.y * zoom) + y
    }
}
