import { ChevronRight, Palette, SlidersHorizontal } from 'lucide-react'

export default function FloatingToolbar({
    toolbarRef,
    sizePopoverRef,
    onMouseDownCapture,
    onMouseUpCapture,
    tools,
    shapeTools,
    isShapeTool,
    currentTool,
    setCurrentTool,
    activeShapeTool,
    toolbarColor,
    onToolbarColorChange,
    activeToolbarPanel,
    setActiveToolbarPanel,
    toolbarSizeLabel,
    toolbarSizeValue,
    toolbarSize,
    onToolbarSizeChange
}) {
    return (
        <aside
            ref={toolbarRef}
            className="absolute top-4 left-4 z-20 flex min-h-0 flex-col items-center gap-2 overflow-visible p-1"
            onMouseDownCapture={onMouseDownCapture}
            onMouseUpCapture={onMouseUpCapture}
        >
            <section className="flex w-full flex-col items-center gap-2">
                {tools.map(tool => {
                    if (tool.id === 'shape') {
                        const ActiveShapeIcon = activeShapeTool?.icon ?? tool.icon

                        return (
                            <div key={tool.id} className="relative">
                                <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setActiveToolbarPanel(prev => prev === 'shapes' ? null : 'shapes')}
                                    title={activeShapeTool?.label ? `Shapes: ${activeShapeTool.label}` : tool.label}
                                    aria-label={tool.label}
                                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${isShapeTool || activeToolbarPanel === 'shapes'
                                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_12px_32px_rgba(15,23,42,0.18)] hover:bg-slate-800'
                                        : 'border-black/20 bg-white/90 text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur hover:bg-white'
                                        }`}
                                >
                                    <ActiveShapeIcon className="h-4 w-4 shrink-0" />
                                    <ChevronRight className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-white text-slate-500" />
                                </button>

                                {activeToolbarPanel === 'shapes' && (
                                    <div className="absolute left-[calc(100%+12px)] top-1/2 z-30 flex -translate-y-1/2 gap-2 rounded-[22px] border border-black/10 bg-white/95 p-3 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur">
                                        {shapeTools.map(shapeTool => {
                                            const ShapeIcon = shapeTool.icon

                                            return (
                                                <button
                                                    key={shapeTool.id}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => {
                                                        setCurrentTool(shapeTool.id)
                                                        setActiveToolbarPanel(null)
                                                    }}
                                                    title={shapeTool.label}
                                                    aria-label={shapeTool.label}
                                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${currentTool === shapeTool.id
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]'
                                                        : 'border-black/15 bg-white text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <ShapeIcon className="h-4 w-4 shrink-0" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    const Icon = tool.icon

                    return (
                        <button
                            key={tool.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setCurrentTool(tool.id)}
                            title={tool.label}
                            aria-label={tool.label}
                            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${currentTool === tool.id
                                ? 'border-slate-900 bg-slate-900 text-white shadow-[0_12px_32px_rgba(15,23,42,0.18)] hover:bg-slate-800'
                                : 'border-black/20 bg-white/90 text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur hover:bg-white'
                                }`}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                        </button>
                    )
                })}
            </section>

            <div className="my-1 h-px w-8 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

            <div className="relative flex w-full flex-col items-center gap-2">
                <label
                    className="group relative inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-black/20 bg-white/90 text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur transition hover:bg-white"
                    title={currentTool === 'text' ? 'Text color' : 'Stroke color'}
                    aria-label={currentTool === 'text' ? 'Text color' : 'Stroke color'}
                >
                    <Palette className="h-4 w-4 shrink-0" />
                    <span
                        className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: toolbarColor }}
                    />
                    <input
                        type="color"
                        value={toolbarColor}
                        onChange={(e) => onToolbarColorChange(e.target.value)}
                        className="absolute ml-10 inset-0 cursor-pointer opacity-0"
                    />
                </label>

                {!isShapeTool && (
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setActiveToolbarPanel(prev => prev === 'size' ? null : 'size')}
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border outline-none transition focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${activeToolbarPanel === 'size'
                            ? 'border-slate-900 bg-slate-900 text-white shadow-[0_12px_32px_rgba(15,23,42,0.18)] hover:bg-slate-800'
                            : 'border-black/20 bg-white/90 text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur hover:bg-white'
                            }`}
                        title={toolbarSizeLabel}
                        aria-label={toolbarSizeLabel}
                    >
                        <SlidersHorizontal className="h-4 w-4 shrink-0" />
                    </button>
                )}

                {!isShapeTool && activeToolbarPanel === 'size' && (
                    <div
                        ref={sizePopoverRef}
                        className="absolute left-[calc(100%+12px)] top-1/2 z-30 w-48 -translate-y-1/2 rounded-[22px] border border-black/10 bg-white/95 p-4 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {toolbarSizeLabel}
                            </span>
                            <span className="text-sm font-semibold text-slate-700">{toolbarSizeValue}px</span>
                        </div>
                        <input
                            type="range"
                            min={currentTool === 'text' ? '14' : '2'}
                            max={currentTool === 'text' ? '72' : '32'}
                            value={toolbarSize}
                            onChange={(e) => onToolbarSizeChange(Number(e.target.value))}
                            className="block w-full accent-slate-900"
                        />
                    </div>
                )}
            </div>
        </aside>
    )
}
