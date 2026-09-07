import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, Paintbrush, Trash2, Info } from 'lucide-react';

interface ObjectBrushCanvasProps {
  imageUrl: string;
  onMaskReady: (maskDataUrl: string | null) => void;
  objectDescription: string;
  setObjectDescription: (desc: string) => void;
}

export const ObjectBrushCanvas: React.FC<ObjectBrushCanvasProps> = ({
  imageUrl,
  onMaskReady,
  objectDescription,
  setObjectDescription,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [brushSize, setBrushSize] = useState<number>(28);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasStrokes, setHasStrokes] = useState(false);

  // Synchronize canvas dimensions with the rendered image
  const syncCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Use natural dimensions or client dimensions if naturalWidth not yet ready
    const width = img.naturalWidth || img.clientWidth || 800;
    const height = img.naturalHeight || img.clientHeight || 600;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      clearMask();
    }
  };

  useEffect(() => {
    // If image is already complete in DOM cache, sync canvas immediately
    if (imgRef.current && imgRef.current.complete) {
      syncCanvas();
    }
  }, [imageUrl]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history for undo
    setHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    const rect = canvas.getBoundingClientRect();
    const scaleRatio = rect.width > 0 ? canvas.width / rect.width : 1;
    const effectiveLineWidth = Math.max(10, brushSize * scaleRatio);

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)'; // vibrant semi-transparent rose
    ctx.fillStyle = 'rgba(244, 63, 94, 0.8)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = effectiveLineWidth;

    ctx.beginPath();
    ctx.arc(x, y, effectiveLineWidth / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasStrokes(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleRatio = rect.width > 0 ? canvas.width / rect.width : 1;
    const effectiveLineWidth = Math.max(10, brushSize * scaleRatio);

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = effectiveLineWidth;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.closePath();
      // Generate mask image
      generateMaskOutput();
    }
    setIsDrawing(false);
  };

  const generateMaskOutput = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) {
      onMaskReady(null);
      return;
    }

    // Create a high-contrast binary mask or composite overlay
    // White where brushed, black elsewhere (standard inpainting mask)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const mctx = maskCanvas.getContext('2d');
    if (!mctx) return;

    // Read the current drawing
    const currentCtx = canvas.getContext('2d');
    if (!currentCtx) return;
    const imgData = currentCtx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = mctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < imgData.data.length; i += 4) {
      const alpha = imgData.data[i + 3];
      if (alpha > 10) {
        maskData.data[i] = 255;
        maskData.data[i + 1] = 255;
        maskData.data[i + 2] = 255;
        maskData.data[i + 3] = 255;
      } else {
        maskData.data[i] = 0;
        maskData.data[i + 1] = 0;
        maskData.data[i + 2] = 0;
        maskData.data[i + 3] = 255;
      }
    }

    mctx.putImageData(maskData, 0, 0);
    onMaskReady(maskCanvas.toDataURL('image/png'));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory((prev) => prev.slice(0, -1));

    if (history.length <= 1) {
      setHasStrokes(false);
      onMaskReady(null);
    } else {
      generateMaskOutput();
    }
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setHasStrokes(false);
    onMaskReady(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Instructions & Brush Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-xs">
        <div className="flex items-center gap-2 text-rose-900 font-medium">
          <Paintbrush className="h-4 w-4 text-rose-600" />
          <span>Tap or drag over the object or person to vanish</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Size:</span>
            <input
              id="brush-size-slider"
              type="range"
              min="10"
              max="60"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="h-2 w-24 cursor-pointer accent-rose-600"
            />
            <span className="w-5 text-center text-slate-700 font-mono">{brushSize}</span>
          </div>

          {/* Undo */}
          <button
            id="brush-undo-btn"
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>

          {/* Clear */}
          <button
            id="brush-clear-btn"
            type="button"
            onClick={clearMask}
            disabled={!hasStrokes}
            className="flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Canvas container with image background */}
      <div
        ref={containerRef}
        className="relative mx-auto max-h-[460px] w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900 shadow-inner flex items-center justify-center select-none touch-none"
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Target for object removal"
          onLoad={syncCanvas}
          referrerPolicy="no-referrer"
          className="max-h-[460px] w-auto max-w-full object-contain pointer-events-none"
        />

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        />

        {!hasStrokes && (
          <div className="pointer-events-none absolute bottom-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white shadow backdrop-blur-xs flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-amber-400" />
            <span>Draw pink highlights over unwanted areas</span>
          </div>
        )}
      </div>

      {/* Optional Description Input */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <label
          htmlFor="object-description-input"
          className="mb-1 block text-xs font-semibold text-slate-700"
        >
          Optional: Name or describe the object (helps AI be extra precise)
        </label>
        <input
          id="object-description-input"
          type="text"
          value={objectDescription}
          onChange={(e) => setObjectDescription(e.target.value)}
          placeholder="e.g., the coffee cup on the desk, person in background, trash can"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>
    </div>
  );
};
