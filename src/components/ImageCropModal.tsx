/**
 * JESic Meet - Modale di Ritaglio, Zoom e Regolazione Foto Profilo
 * 
 * Funzionalità avanzate:
 * 1. Trascina/pan con mouse e tocco singolo su smartphone.
 * 2. Pinch-to-zoom multi-touch (2 dita) + zoom con rotellina del mouse (wheel).
 * 3. Slider zoom fluido con pulsanti rapidi + e -.
 * 4. Rotazione (oraria e antioraria a 90°) e specchiatura orizzontale (Flip).
 * 5. Griglia di allineamento e maschera circolare con bordo rosso JESic (#f23e2e).
 * 6. Rendering finale su Canvas ad alta definizione (400x400) con ritaglio perfetto.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Check,
  Move,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

  // Touch pinch zoom state
  const touchDistanceRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calcolo dimensioni base per centrare l'immagine nel cerchio da 240px
  const CROP_SIZE = 240;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
    // Posizione iniziale centrata
    setPosition({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile (pan and pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        setPosition({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        });
      } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchDistanceRef.current;
        setZoom((prev) => Math.min(3.5, Math.max(0.5, prev * factor)));
        touchDistanceRef.current = dist;
      }
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(3.5, Math.max(0.5, prev + delta)));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Rotazioni e Flip
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlipH((prev) => !prev);
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
  };

  // Rendering del ritaglio finale su Canvas ad alta definizione (400x400)
  const handleApplyCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const outputSize = 400; // Diametro avatar finale ad alta risoluzione
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Maschera ritaglio circolare anti-aliased
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.save();
    // Sposta al centro del canvas
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipH) {
      ctx.scale(-1, 1);
    }

    // Calcolo dimensioni base visualizzate (in proporzione al cerchio di anteprima da 240px)
    const previewScale = outputSize / CROP_SIZE; // 400 / 240 = 1.6667
    
    // Calcola il fattore di scala base per cui l'immagine copre il riquadro 240x240
    const nw = img.naturalWidth || 1;
    const nh = img.naturalHeight || 1;
    const baseFitRatio = Math.max(CROP_SIZE / nw, CROP_SIZE / nh);

    const baseDisplayWidth = nw * baseFitRatio;
    const baseDisplayHeight = nh * baseFitRatio;

    const finalDrawWidth = baseDisplayWidth * zoom * previewScale;
    const finalDrawHeight = baseDisplayHeight * zoom * previewScale;

    // Disegna l'immagine tenendo conto dell'offset applicato dall'utente
    ctx.drawImage(
      img,
      -finalDrawWidth / 2 + position.x * previewScale,
      -finalDrawHeight / 2 + position.y * previewScale,
      finalDrawWidth,
      finalDrawHeight
    );
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropComplete(croppedDataUrl);
  };

  // Calcolo dimensioni per l'anteprima DOM
  const nw = imgNaturalSize.width || 1;
  const nh = imgNaturalSize.height || 1;
  const baseFit = Math.max(CROP_SIZE / nw, CROP_SIZE / nh);
  const previewW = nw * baseFit;
  const previewH = nh * baseFit;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modale */}
        <div className="p-4 sm:px-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f23e2e] text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                Regola e Ritaglia Foto Profilo
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Centra il viso, regola lo zoom e orienta l'immagine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
            title="Chiudi"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Viewport di Ritaglio Interattiva */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
          className="relative w-full h-72 sm:h-80 bg-neutral-950 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Immagine trasformabile */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Anteprima ritaglio"
            onLoad={handleImageLoad}
            style={{
              width: `${previewW}px`,
              height: `${previewH}px`,
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom}) scaleX(${flipH ? -1 : 1})`,
              transformOrigin: 'center center',
              pointerEvents: 'none',
              transition: isDragging ? 'none' : 'transform 0.08s ease-out',
            }}
            className="max-w-none max-h-none object-cover"
          />

          {/* Maschera di ritaglio circolare con ghiera rossa e griglia di terzi */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Foro circolare 240px */}
            <div className="w-60 h-60 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.68)] ring-4 ring-[#f23e2e]/50 relative overflow-hidden">
              {/* Griglia a terzi per facilitare la centratura del volto */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-white"></div>
                <div className="border-r border-white"></div>
                <div></div>
              </div>

              {/* Suggerimento visivo */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Move className="w-3 h-3 text-[#f23e2e]" />
                <span>Trascina per centrare</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controlli di Regolazione Completi */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 overflow-y-auto">
          
          {/* Zoom Slider + Bottoni */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span>Ingrandimento (Zoom)</span>
              </span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200 font-bold">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.5, +(prev - 0.15).toFixed(2)))}
                className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                title="Riduci zoom"
              >
                <ZoomOut className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              </button>

              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#f23e2e] cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3.5, +(prev + 0.15).toFixed(2)))}
                className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                title="Aumenta zoom"
              >
                <ZoomIn className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              </button>
            </div>
          </div>

          {/* Bottoni Strumenti: Rotazione Sinistra/Destra, Specchia, Reimposta */}
          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotateCcw}
                className="py-1.5 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Ruota 90° a sinistra"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span>-90°</span>
              </button>

              <button
                type="button"
                onClick={handleRotateCw}
                className="py-1.5 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Ruota 90° a destra"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span>+90°</span>
              </button>

              <button
                type="button"
                onClick={handleFlipHorizontal}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  flipH
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-300 dark:border-red-800'
                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
                title="Specchia orizzontalmente"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-[#f23e2e]" />
                <span>Specchia</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="py-1.5 px-2.5 rounded-xl text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Reimposta zoom e posizione iniziali"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reimposta</span>
            </button>
          </div>

          {/* Azioni di Chiusura e Conferma */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-center"
            >
              Annulla
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={!imageLoaded}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#f23e2e] hover:bg-red-600 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-red-500/25 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3px]" />
              <span>Conferma e Salva</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
