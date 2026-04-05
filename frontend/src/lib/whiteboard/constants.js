import { ArrowRight, Brush, Circle, Diamond, Eraser, Shapes, Shredder, Square, Type } from 'lucide-react'

export const DEFAULT_TEXT_WIDTH = 240
export const DEFAULT_TEXT_HEIGHT = 120
export const DEFAULT_TEXT_FONT_SIZE = 24
export const TEXT_LINE_HEIGHT_RATIO = 1.35
export const TEXT_PADDING = 10
export const TEXT_RESIZE_HANDLE_SIZE = 12
export const POINT_ERASER_SIZE_RATIO = 2
export const SHAPE_MIN_SIZE = 24
export const SHAPE_RESIZE_HANDLE_SIZE = 16
export const SHAPE_RESIZE_HIT_SIZE = 28
export const SHAPE_TOOL_IDS = ['arrow', 'rectangle', 'diamond', 'circle']

export const TOOLS = [
    { id: 'brush', label: 'Brush', icon: Brush },
    { id: 'eraser', label: 'Erase Stroke', icon: Eraser },
    { id: 'point-eraser', label: 'Erase Points', icon: Shredder },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'shape', label: 'Shapes', icon: Shapes }
]

export const SHAPE_TOOLS = [
    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
    { id: 'rectangle', label: 'Square', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'diamond', label: 'Diamond', icon: Diamond },
]

export const COLOR_SWATCHES = [
    '#111827',
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#ea580c',
    '#dc2626',
    '#9333ea'
]
