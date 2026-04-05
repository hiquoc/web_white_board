import { Download, Minus, Plus, RotateCcw, RotateCw, Trash2 } from 'lucide-react'

export default function CanvasActionButtons({
    canUndo,
    canRedo,
    zoomValue,
    onUndo,
    onRedo,
    onZoomIn,
    onZoomOut,
    onZoomChange,
    onZoomCommit,
    onExport,
    onClear
}) {
    return (
        <>
            <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/20 bg-white/90 text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur transition hover:bg-white disabled:opacity-40"
                    title="Undo"
                    aria-label="Undo"
                >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/20 bg-white/90 text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur transition hover:bg-white disabled:opacity-40"
                    title="Redo"
                    aria-label="Redo"
                >
                    <RotateCw className="w-4 h-4 shrink-0" />
                </button>
                <button
                    onClick={onExport}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/20 bg-white/90 text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.18)] transition hover:bg-white"
                    title="Export PNG"
                    aria-label="Export PNG"
                >
                    <Download className="w-4 h-4 shrink-0" />
                </button>
                <button
                    onClick={onClear}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-200 bg-white/90 text-rose-600 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur transition hover:bg-white"
                    title="Clear"
                    aria-label="Clear"
                >
                    <Trash2 className="w-4 h-4 shrink-0" />
                </button>
            </div>
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-black/15 bg-white/92 px-2 py-2 text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur">
                <button
                    onClick={onZoomOut}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50"
                    title="Zoom out"
                    aria-label="Zoom out"
                >
                    <Minus className="w-4 h-4 shrink-0" />
                </button>
                <label className="flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-medium tabular-nums">
                    <input
                        type="number"
                        min="5"
                        max="300"
                        step="5"
                        value={zoomValue}
                        onChange={(e) => onZoomChange(e.target.value)}
                        onBlur={onZoomCommit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onZoomCommit()
                                e.currentTarget.blur()
                            }
                        }}
                        className="w-14 appearance-none border-0 bg-transparent text-center outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        aria-label="Zoom percentage"
                        title="Zoom percentage"
                    />
                    <span>%</span>
                </label>
                <button
                    onClick={onZoomIn}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50"
                    title="Zoom in"
                    aria-label="Zoom in"
                >
                    <Plus className="w-4 h-4 shrink-0" />
                </button>
            </div>
        </>
    )
}
