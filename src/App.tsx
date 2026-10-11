/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Download,
  Upload,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  Eye,
  EyeOff,
  HelpCircle,
  Check,
  Copy,
  Layers,
  Sparkles,
  RotateCcw,
  Maximize2,
  RectangleHorizontal,
  RectangleVertical
} from 'lucide-react';

import { useWebcam } from './hooks/useWebcam';
import { processChromaKey, ChromaKeyOptions } from './utils/chromaKey';
import { getPresetFrames, PresetFrame, PhotoOrientation } from './utils/presetFrames';
import { createSamplePortrait } from './utils/samplePhoto';
import {
  renderComposite,
  downloadCanvasAsPng,
  copyCanvasToClipboard,
  PhotoTransform
} from './utils/composite';
import { playBeep, playShutterSound } from './utils/audio';

type ActiveTab = 'frames' | 'chromakey' | 'adjust' | 'guide';

export default function App() {
  // Webcam hook
  const {
    videoRef,
    isStreaming,
    isLoading: isCamLoading,
    error: camError,
    devices,
    isMirrored,
    startStream,
    switchCamera,
    toggleMirror,
    captureFrame
  } = useWebcam();

  // App State: 'camera' (Live Capture) or 'preview' (Edit & Export)
  const [appMode, setAppMode] = useState<'camera' | 'preview'>('camera');

  // Photostrip Size / Orientation state: 'landscape' (600px x 500px) or 'portrait' (500px x 600px)
  const [orientation, setOrientation] = useState<PhotoOrientation>('landscape');
  // Export resolution: standard (600x500 / 500x600) vs HD (1200x1000 / 1000x1200)
  const [exportHd, setExportHd] = useState<boolean>(false);

  // Countdown state
  const [countdownDuration, setCountdownDuration] = useState<number>(3); // 3, 5, or 0
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Sound effects toggle
  const [soundEnabled] = useState(true);

  // Live overlay preview during camera mode
  const [showLiveOverlay, setShowLiveOverlay] = useState(true);

  // Frames state
  const [presetFrames, setPresetFrames] = useState<PresetFrame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>('polaroid');
  const [customFrameUrl, setCustomFrameUrl] = useState<string | null>(null);
  const [customFrameName, setCustomFrameName] = useState<string | null>(null);

  // Captured Photo state
  const [, setCapturedPhotoUrl] = useState<string | null>(null);
  const capturedPhotoImgRef = useRef<HTMLImageElement | null>(null);

  // Chroma Key options
  const [chromaOptions, setChromaOptions] = useState<ChromaKeyOptions>({
    enabled: true,
    keyColor: '#00FF00',
    tolerance: 0.38,
    smoothing: 0.08,
    despill: true,
  });

  // Transparent pixels ratio feedback
  const [transparentRatio, setTransparentRatio] = useState<number>(0);

  // Photo Transformations
  const [transform, setTransform] = useState<PhotoTransform>({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    rotate: 0,
    mirror: false,
    filter: 'normal',
    brightness: 1.0,
    contrast: 1.0,
  });

  // Active studio sidebar tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('frames');

  // UI notifications
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Canvas refs
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load preset frames on mount and when orientation changes
  useEffect(() => {
    const frames = getPresetFrames(orientation);
    setPresetFrames(frames);
  }, [orientation]);

  // Start camera stream on initial mount
  useEffect(() => {
    startStream();
  }, [startStream]);

  // Determine current active frame image URL
  const activeFrameUrl = customFrameUrl || presetFrames.find((f) => f.id === selectedFrameId)?.dataUrl || '';

  // Process Chroma Key on active frame whenever frame or chroma options change
  useEffect(() => {
    if (!activeFrameUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const result = processChromaKey(img, chromaOptions);
      processedFrameCanvasRef.current = result.canvas;
      setTransparentRatio(result.transparentRatio);

      // Render live overlay preview canvas
      if (liveOverlayCanvasRef.current) {
        const liveCanvas = liveOverlayCanvasRef.current;
        liveCanvas.width = result.width;
        liveCanvas.height = result.height;
        const ctx = liveCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, result.width, result.height);
          ctx.drawImage(result.canvas, 0, 0);
        }
      }

      // Re-render composite if in preview mode
      if (capturedPhotoImgRef.current && compositeCanvasRef.current && result.canvas) {
        renderComposite(
          compositeCanvasRef.current,
          capturedPhotoImgRef.current,
          result.canvas,
          transform
        );
      }
    };
    img.src = activeFrameUrl;
  }, [activeFrameUrl, chromaOptions, transform]);

  // Re-render composite canvas whenever photo transform changes
  useEffect(() => {
    if (appMode === 'preview' && capturedPhotoImgRef.current && compositeCanvasRef.current && processedFrameCanvasRef.current) {
      renderComposite(
        compositeCanvasRef.current,
        capturedPhotoImgRef.current,
        processedFrameCanvasRef.current,
        transform
      );
    }
  }, [transform, appMode]);

  // Load a photo from data URL into active editor
  const loadPhotoFromUrl = useCallback((url: string) => {
    setCapturedPhotoUrl(url);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      capturedPhotoImgRef.current = img;
      setAppMode('preview');

      // Play shutter click sound & trigger flash
      if (soundEnabled) {
        playShutterSound();
      }
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 450);

      // Reset transform defaults for clean alignment
      setTransform((prev) => ({
        ...prev,
        zoom: 1.0,
        panX: 0,
        panY: 0,
        rotate: 0,
      }));
    };
    img.src = url;
  }, [soundEnabled]);

  // Handle Photo Capture Execution
  const triggerShutter = useCallback(() => {
    const canvas = captureFrame();
    if (!canvas) {
      // Fallback: if camera was not available, use sample portrait with current orientation
      const sample = createSamplePortrait(orientation);
      loadPhotoFromUrl(sample);
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    loadPhotoFromUrl(dataUrl);
  }, [captureFrame, orientation, loadPhotoFromUrl]);

  // Start Countdown Sequence
  const handleStartCapture = () => {
    if (countdownDuration === 0) {
      triggerShutter();
      return;
    }

    setCurrentCountdown(countdownDuration);
    if (soundEnabled) {
      playBeep(880, 0.1);
    }

    let count = countdownDuration;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCurrentCountdown(count);
        if (soundEnabled) {
          playBeep(880, 0.1);
        }
      } else {
        clearInterval(interval);
        setCurrentCountdown(null);
        triggerShutter();
      }
    }, 1000);
  };

  // Handle Custom Frame Upload
  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomFrameUrl(dataUrl);
      setCustomFrameName(file.name);
      setSelectedFrameId('custom');
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom User Photo Upload (Alternative to Webcam)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      loadPhotoFromUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Use Sample Portrait
  const handleUseSample = () => {
    const sample = createSamplePortrait(orientation);
    loadPhotoFromUrl(sample);
  };

  // Target download dimensions
  const getTargetDimensions = useCallback(() => {
    if (orientation === 'landscape') {
      return exportHd ? { width: 1200, height: 1000 } : { width: 600, height: 500 };
    } else {
      return exportHd ? { width: 1000, height: 1200 } : { width: 500, height: 600 };
    }
  }, [orientation, exportHd]);

  // Download Final Result
  const handleDownload = () => {
    if (!compositeCanvasRef.current) return;
    const target = getTargetDimensions();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `photobooth-${orientation}-${target.width}x${target.height}-${timestamp}.png`;
    downloadCanvasAsPng(compositeCanvasRef.current, filename, target);
  };

  // Copy to Clipboard
  const handleCopyClipboard = async () => {
    if (!compositeCanvasRef.current) return;
    const target = getTargetDimensions();
    const ok = await copyCanvasToClipboard(compositeCanvasRef.current, target);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    }
  };

  // Reset to live camera mode
  const handleRetake = () => {
    setAppMode('camera');
    setCapturedPhotoUrl(null);
    capturedPhotoImgRef.current = null;
    startStream();
  };

  // Drag to pan interaction on preview canvas
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: transform.panX,
      panY: transform.panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setTransform((prev) => ({
      ...prev,
      panX: Math.round(dragStartRef.current.panX + dx * 1.5),
      panY: Math.round(dragStartRef.current.panY + dy * 1.5),
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Switch size orientation handler
  const handleSelectOrientation = (newOrientation: PhotoOrientation) => {
    setOrientation(newOrientation);
    // If a custom frame was loaded, clearing it ensures preset switches cleanly to the new aspect ratio
    if (selectedFrameId !== 'custom') {
      setCustomFrameUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* FLASH OVERLAY EFFECT */}
      {isFlashing && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-camera-flash" />
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-40">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
              STUDIO PHOTOBOOTH
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium">CHROMA KEY</span>
            </span>
          </div>
        </div>

        {/* Center Orientation / Size Selector (Landscape vs Portrait) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleSelectOrientation('landscape')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              orientation === 'landscape'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RectangleHorizontal className="w-3.5 h-3.5" />
            <span>Landscape</span>
            <span className={`text-[10px] font-mono font-normal ml-0.5 ${orientation === 'landscape' ? 'text-slate-900' : 'text-slate-500'}`}>
              (600×500)
            </span>
          </button>

          <button
            onClick={() => handleSelectOrientation('portrait')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              orientation === 'portrait'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RectangleVertical className="w-3.5 h-3.5" />
            <span>Portrait</span>
            <span className={`text-[10px] font-mono font-normal ml-0.5 ${orientation === 'portrait' ? 'text-slate-900' : 'text-slate-500'}`}>
              (500×600)
            </span>
          </button>
        </div>

        {/* Action Zone */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Panduan Hijau</span>
          </button>

          {appMode === 'preview' ? (
            <button
              onClick={handleRetake}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Foto Ulang</span>
            </button>
          ) : (
            <button
              onClick={handleStartCapture}
              disabled={currentCountdown !== null}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>Ambil Foto</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT / CENTER VIEWPORT (CAMERA OR PREVIEW CANVAS) */}
        <div className="flex-1 flex flex-col items-center">
          
          {/* Quick Format Ribbon */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">Ukuran Aktif:</span>
              <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                {orientation === 'landscape' ? 'Landscape (600 × 500 px · Rasio 6:5)' : 'Portrait (500 × 600 px · Rasio 5:6)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Kualitas Ekspor:</span>
              <button
                onClick={() => setExportHd(!exportHd)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  exportHd
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Beralih antara Resolusi Standar (600x500/500x600) atau HD 2x"
              >
                {exportHd ? 'HD 2×' : 'Standar (1×)'}
              </button>
            </div>
          </div>

          {/* VIEWPORT CONTAINER (Adapts dynamically to Landscape 6:5 or Portrait 5:6) */}
          <div
            className={`w-full ${
              orientation === 'landscape' ? 'aspect-[6/5] max-w-2xl' : 'aspect-[5/6] max-w-xl'
            } bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl flex items-center justify-center group select-none transition-all duration-300`}
          >
            {/* 1. CAMERA MODE */}
            {appMode === 'camera' && (
              <>
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-transform duration-200 ${
                    isMirrored ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Optional Live Chroma Key Frame Overlay */}
                {showLiveOverlay && (
                  <canvas
                    ref={liveOverlayCanvasRef}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                  />
                )}

                {/* Loading Spinner */}
                {isCamLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-sm font-medium text-slate-300">Menghubungkan kamera webcam...</p>
                  </div>
                )}

                {/* Camera Error / Permission Fallback View */}
                {camError && (
                  <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center gap-4 z-20">
                    <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <CameraOff className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-1">Akses Kamera Terkendala</h4>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{camError}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs mt-2">
                      <button
                        onClick={() => startStream()}
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Kamera Lagi</span>
                      </button>
                      <button
                        onClick={handleUseSample}
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Foto Sampel</span>
                      </button>
                    </div>

                    <label className="text-xs text-slate-400 hover:text-cyan-400 cursor-pointer underline flex items-center gap-1.5 mt-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Atau unggah foto dari galeri Anda</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                )}

                {/* Animated Countdown Overlay */}
                {currentCountdown !== null && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-30">
                    <div className="w-32 h-32 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center animate-bounce shadow-2xl shadow-cyan-500/50">
                      <span className="text-7xl font-extrabold text-white font-mono tabular-nums">
                        {currentCountdown}
                      </span>
                    </div>
                  </div>
                )}

                {/* Live Camera Bottom HUD Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {/* Mirror Toggle */}
                    <button
                      onClick={toggleMirror}
                      title="Balik Cermin (Mirror)"
                      className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
                        isMirrored
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>

                    {/* Switch Camera if multi cameras */}
                    {devices.length > 1 && (
                      <button
                        onClick={switchCamera}
                        title="Ganti Kamera"
                        className="p-2 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Live Frame Overlay Toggle */}
                    <button
                      onClick={() => setShowLiveOverlay(!showLiveOverlay)}
                      title="Pratinjau Bingkai saat Live"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        showLiveOverlay
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {showLiveOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span className="hidden sm:inline">Overlay Bingkai</span>
                    </button>
                  </div>

                  {/* Shutter Countdown Selector */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {[0, 3, 5].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setCountdownDuration(sec)}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          countdownDuration === sec
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec === 0 ? '0s' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 2. PREVIEW & EDIT COMPOSITE MODE */}
            {appMode === 'preview' && (
              <div
                className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* The composite canvas element */}
                <canvas
                  ref={compositeCanvasRef}
                  className="w-full h-full object-contain"
                />

                {/* Drag to Pan Hint pill */}
                <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-[11px] text-slate-300 pointer-events-none flex items-center gap-1.5">
                  <Maximize2 className="w-3 h-3 text-cyan-400" />
                  <span>Klik & geser untuk atur posisi foto</span>
                </div>

                {/* Bottom Quick Tools */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTransform((p) => ({ ...p, zoom: Math.max(0.5, p.zoom - 0.1) }))}
                      title="Perkecil Foto"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-cyan-400 w-12 text-center">
                      {Math.round(transform.zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setTransform((p) => ({ ...p, zoom: Math.min(2.5, p.zoom + 0.1) }))}
                      title="Perbesar Foto"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTransform((p) => ({ ...p, rotate: (p.rotate + 90) % 360 }))}
                      title="Putar Foto 90°"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 ml-1"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setTransform((p) => ({ ...p, panX: 0, panY: 0, zoom: 1.0, rotate: 0 }))}
                    className="text-xs text-slate-400 hover:text-cyan-400 px-2 py-1"
                  >
                    Reset Posisi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* VIEWPORT ACTION BUTTONS */}
          <div className={`w-full ${orientation === 'landscape' ? 'max-w-2xl' : 'max-w-xl'} mt-4 flex items-center justify-between gap-3`}>
            {appMode === 'camera' ? (
              <>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  <button
                    onClick={handleUseSample}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pakai Contoh</span>
                  </button>
                </div>

                <button
                  onClick={handleStartCapture}
                  disabled={currentCountdown !== null}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>{countdownDuration > 0 ? `Hitung Mundur (${countdownDuration}s)` : 'Jepret Langsung'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Foto Ulang</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyClipboard}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-colors"
                  >
                    {copyFeedback ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-cyan-400" />
                        <span>Salin Gambar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {orientation === 'landscape' ? '600×500' : '500×600'} PNG</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* CHROMA KEY TRANSPARENCY STATUS BADGE */}
          <div className={`w-full ${orientation === 'landscape' ? 'max-w-2xl' : 'max-w-xl'} mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${chromaOptions.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span>Chroma Key:</span>
              <span className="font-semibold text-slate-200">
                {chromaOptions.enabled ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span>Transparansi:</span>
              <span className="text-cyan-400 font-bold">
                {Math.round(transparentRatio * 100)}% Area Hijau
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: CONTROLS & STUDIO TABS */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          
          {/* TAB NAVIGATION HEADER */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('frames')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'frames'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bingkai</span>
            </button>
            <button
              onClick={() => setActiveTab('chromakey')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'chromakey'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chroma Key</span>
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'adjust'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Filter Foto</span>
            </button>
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            
            {/* TAB 1: FRAME SELECTION & UPLOAD */}
            {activeTab === 'frames' && (
              <div className="space-y-4">
                {/* Size / Format Option Card */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Pilihan Ukuran Photostrip</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSelectOrientation('landscape')}
                      className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                        orientation === 'landscape'
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <RectangleHorizontal className="w-4 h-4" />
                        <span className="font-bold text-xs">Landscape</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">600 × 500 px</span>
                    </button>

                    <button
                      onClick={() => handleSelectOrientation('portrait')}
                      className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                        orientation === 'portrait'
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <RectangleVertical className="w-4 h-4" />
                        <span className="font-bold text-xs">Portrait</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">500 × 600 px</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Preset Bingkai ({orientation === 'landscape' ? 'Landscape' : 'Portrait'})</h3>
                  <p className="text-xs text-slate-400">
                    Bingkai proporsional dengan area hijau murni (#00FF00) siap dideteksi.
                  </p>
                </div>

                {/* Preset Frames Grid */}
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {presetFrames.map((frame) => {
                    const isSelected = selectedFrameId === frame.id && !customFrameUrl;
                    return (
                      <button
                        key={frame.id}
                        onClick={() => {
                          setSelectedFrameId(frame.id);
                          setCustomFrameUrl(null);
                        }}
                        className={`p-2 rounded-xl text-left border transition-all flex flex-col gap-2 ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div className={`${orientation === 'landscape' ? 'aspect-[6/5]' : 'aspect-[5/6]'} w-full rounded-lg overflow-hidden bg-slate-900 relative`}>
                          <img
                            src={frame.dataUrl}
                            alt={frame.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200 truncate">{frame.name}</p>
                          <p className="text-[10px] text-slate-400">{frame.category}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Frame Upload Dropzone */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">Unggah Bingkai Kustom Anda</span>
                    {customFrameName && (
                      <span className="text-[11px] text-cyan-400 truncate max-w-[140px]">
                        {customFrameName}
                      </span>
                    )}
                  </div>

                  <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-950/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 flex items-center justify-center transition-colors">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-200">Pilih file bingkai (PNG / JPG)</p>
                      <p className="text-[11px] text-slate-400">
                        Disarankan rasio {orientation === 'landscape' ? '600×500 px (Landscape)' : '500×600 px (Portrait)'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleFrameUpload}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: CHROMA KEY SETTINGS */}
            {activeTab === 'chromakey' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5">Pengaturan Chroma Key</h3>
                    <p className="text-xs text-slate-400">Deteksi warna latar dan ubah menjadi transparan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chromaOptions.enabled}
                      onChange={(e) =>
                        setChromaOptions((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {/* Key Color Selection */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <label className="text-xs font-semibold text-slate-300 block">Warna Kunci (Target Key Color)</label>
                  
                  <div className="flex items-center gap-2">
                    {[
                      { label: 'Green Screen', hex: '#00FF00', color: 'bg-[#00FF00]' },
                      { label: 'Blue Screen', hex: '#0000FF', color: 'bg-[#0000FF]' },
                      { label: 'Magenta Screen', hex: '#FF00FF', color: 'bg-[#FF00FF]' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() =>
                          setChromaOptions((prev) => ({ ...prev, keyColor: c.hex }))
                        }
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                          chromaOptions.keyColor.toUpperCase() === c.hex
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${c.color} shrink-0`} />
                        <span className="truncate">{c.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">Pilih Manual:</span>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        value={chromaOptions.keyColor}
                        onChange={(e) =>
                          setChromaOptions((prev) => ({ ...prev, keyColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                      />
                      <input
                        type="text"
                        value={chromaOptions.keyColor}
                        onChange={(e) =>
                          setChromaOptions((prev) => ({ ...prev, keyColor: e.target.value }))
                        }
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono w-28 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Tolerance & Sensitivity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Toleransi Warna (Threshold)</span>
                    <span className="text-cyan-400 font-mono">
                      {Math.round(chromaOptions.tolerance * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.80"
                    step="0.02"
                    value={chromaOptions.tolerance}
                    onChange={(e) =>
                      setChromaOptions((prev) => ({ ...prev, tolerance: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400">
                    Naikkan toleransi jika warna hijau pada bingkai memiliki bayangan atau variasi rona.
                  </p>
                </div>

                {/* Edge Smoothing / Feathering */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Kehalusan Tepi (Feathering)</span>
                    <span className="text-cyan-400 font-mono">
                      {Math.round(chromaOptions.smoothing * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.25"
                    step="0.01"
                    value={chromaOptions.smoothing}
                    onChange={(e) =>
                      setChromaOptions((prev) => ({ ...prev, smoothing: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400">
                    Membuat peralihan batas antara bingkai dan foto lebih halus tanpa patah-patah.
                  </p>
                </div>

                {/* De-spill filter toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-300">Bersihkan Pantulan Hijau (De-spill)</span>
                  <input
                    type="checkbox"
                    checked={chromaOptions.despill}
                    onChange={(e) =>
                      setChromaOptions((prev) => ({ ...prev, despill: e.target.checked }))
                    }
                    className="w-4 h-4 accent-cyan-500 rounded bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PHOTO ADJUSTMENTS & COLOR FILTERS */}
            {activeTab === 'adjust' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Filter Warna & Efek Foto</h3>
                  <p className="text-xs text-slate-400">Terapkan grading warna estetik pada foto jepretan Anda</p>
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', name: 'Asli', desc: 'Natural' },
                    { id: 'bw', name: 'B&W', desc: 'Monochrome' },
                    { id: 'vintage', name: 'Vintage', desc: '90s Film' },
                    { id: 'warm', name: 'Warm', desc: 'Golden Hour' },
                    { id: 'cyber', name: 'Cyber', desc: 'Cyan Punch' },
                    { id: 'vivid', name: 'Vivid', desc: 'Pop Color' },
                  ].map((f) => {
                    const isActive = transform.filter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() =>
                          setTransform((prev) => ({
                            ...prev,
                            filter: f.id as PhotoTransform['filter'],
                          }))
                        }
                        className={`p-2 rounded-xl text-center border transition-all ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <p className="text-xs">{f.name}</p>
                        <p className="text-[10px] text-slate-400">{f.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Zoom Slider */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Skala / Zoom Foto</span>
                    <span className="text-cyan-400 font-mono">
                      {Math.round(transform.zoom * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={transform.zoom}
                    onChange={(e) =>
                      setTransform((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Brightness Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Kecerahan (Brightness)</span>
                    <span className="text-cyan-400 font-mono">
                      {Math.round(transform.brightness * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.05"
                    value={transform.brightness}
                    onChange={(e) =>
                      setTransform((prev) => ({ ...prev, brightness: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Contrast Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Kontras</span>
                    <span className="text-cyan-400 font-mono">
                      {Math.round(transform.contrast * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={transform.contrast}
                    onChange={(e) =>
                      setTransform((prev) => ({ ...prev, contrast: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Horizontal Mirror / Flip */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-300">Cerminkan Foto Horizontal</span>
                  <button
                    onClick={() => setTransform((prev) => ({ ...prev, mirror: !prev.mirror }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      transform.mirror
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>{transform.mirror ? 'Aktif' : 'Nonaktif'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-400">
        <p>Photobooth Digital &copy; 2026 &middot; Ukuran: Landscape (600×500 px) &amp; Portrait (500×600 px)</p>
      </footer>

      {/* CHROMA KEY GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Panduan Ukuran &amp; Chroma Key</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-cyan-400">Format &amp; Ukuran yang Didukung:</div>
                <p>
                  • <strong>Landscape (600px &times; 500px)</strong>: Rasio 6:5, ideal untuk foto kelompok, layar lebar, dan tampilan horizontal.
                </p>
                <p>
                  • <strong>Portrait (500px &times; 600px)</strong>: Rasio 5:6, ideal untuk foto tunggal, media sosial, dan photostrip vertikal.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#00FF00] inline-block" />
                  <span>Cara membuat bingkai sendiri di Photoshop / Canva / Figma:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Buat kanvas ukuran <strong>600 &times; 500 px</strong> (Landscape) atau <strong>500 &times; 600 px</strong> (Portrait).</li>
                  <li>Desain tepian bingkai Anda sesuai selera.</li>
                  <li>Isi bagian tengah (area tempat foto muncul) dengan warna hijau solid <strong>#00FF00</strong> (R: 0, G: 255, B: 0).</li>
                  <li>Simpan sebagai file <strong>PNG</strong> atau <strong>JPG</strong>, lalu unggah melalui tombol <em>Unggah Bingkai</em>.</li>
                </ol>
              </div>

              <p className="text-slate-400">
                Aplikasi ini akan otomatis mendeteksi warna hijau tersebut dan meletakkan foto jepretan Anda di belakang bingkai secara presisi.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Mengerti, Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
