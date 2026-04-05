export function createCircleCursor(size) {
    const diameter = Math.max(12, Math.round(size))
    const padding = 6
    const canvasSize = diameter + (padding * 2)
    const radius = diameter / 2
    const center = canvasSize / 2
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="rgba(255,255,255,0.15)" stroke="#0f172a" stroke-width="1.5" />
        </svg>
    `.trim()
    const encoded = encodeURIComponent(svg)

    return `url("data:image/svg+xml,${encoded}") ${center} ${center}, crosshair`
}

function createSvgCursor(svg, hotspotX, hotspotY, fallback = 'crosshair') {
    const encoded = encodeURIComponent(svg.trim())
    return `url("data:image/svg+xml,${encoded}") ${hotspotX} ${hotspotY}, ${fallback}`
}

export function createPenCursor() {
    return createSvgCursor(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 18l-1 4 4-1L20 10l-3-3L6 18Z" fill="#0f172a"/>
            <path d="M15.5 5.5l3 3" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `, 4, 20, 'crosshair')
}

export function createEraserCursor() {
    return createSvgCursor(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-eraser" viewBox="0 0 24 24">
            <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"/>
        </svg>`, 4, 20, 'cell')
}
