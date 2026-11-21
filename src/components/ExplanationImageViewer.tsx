"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  X,
  Image as ImageIcon,
  Maximize2,
  RotateCcw,
  RotateCw,
  Hand,
  Table2,
  Columns2,
} from "lucide-react";

interface ExplanationImageViewerProps {
  imagePath?: string | null;
  caption?: string;
  sourceFile?: string;
  compact?: boolean;
  variant?: "slide" | "diagram";
  headerLabel?: string;
}

export function resolveSlideImageUrl(rawPath?: string | null): string {
  if (!rawPath) return "";
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return rawPath;
  }

  const normalized = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const envBase = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const full =
    envBase && normalized.startsWith(`${envBase}/`)
      ? normalized
      : `${envBase}${normalized}`;

  if (full.includes("/images/diagrams/") && !full.includes("?v=")) {
    return `${full}?v=3`;
  }
  return full;
}

function getTouchDistance(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export function ExplanationImageViewer({
  imagePath,
  caption,
  sourceFile,
  compact = false,
  variant = "slide",
  headerLabel,
}: ExplanationImageViewerProps) {
  const isDiagram = variant === "diagram";
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isRotated, setIsRotated] = useState<boolean>(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasError, setHasError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>(() =>
    resolveSlideImageUrl(imagePath)
  );

  // タッチピンチ＆ドラッグ管理用Ref
  const gestureRef = useRef<{
    mode: "none" | "pan" | "pinch";
    startDist: number;
    startScale: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    lastTapTime: number;
  }>({
    mode: "none",
    startDist: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    lastTapTime: 0,
  });

  // マウスドラッグ管理用Ref
  const mouseDragRef = useRef<{
    isDragging: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  }>({
    isDragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  useEffect(() => {
    setHasError(false);
    setIsLightboxOpen(false);
    setZoomScale(1);
    setIsRotated(false);
    setPan({ x: 0, y: 0 });
    setResolvedUrl(resolveSlideImageUrl(imagePath));
  }, [imagePath]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  const resetZoomAndPan = () => {
    setZoomScale(1);
    setIsRotated(false);
    setPan({ x: 0, y: 0 });
  };

  const applyZoom = (nextScale: number) => {
    const clamped = Math.min(5, Math.max(1, Number(nextScale.toFixed(2))));
    setZoomScale(clamped);
    if (clamped <= 1.02) {
      setPan({ x: 0, y: 0 });
    }
  };

  // タッチ開始（2本指ピンチ または 1本指ドラッグ / ダブルタップ）
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      gestureRef.current.mode = "pinch";
      gestureRef.current.startDist = dist;
      gestureRef.current.startScale = zoomScale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      const timeDiff = now - gestureRef.current.lastTapTime;

      // ダブルタップで拡大・等倍をトグル
      if (timeDiff > 0 && timeDiff < 280) {
        if (zoomScale > 1.1) {
          resetZoomAndPan();
        } else {
          setZoomScale(2.4);
          setPan({ x: 0, y: 0 });
        }
        gestureRef.current.lastTapTime = 0;
        gestureRef.current.mode = "none";
        return;
      }

      gestureRef.current.lastTapTime = now;
      gestureRef.current.mode = "pan";
      gestureRef.current.startX = e.touches[0].clientX;
      gestureRef.current.startY = e.touches[0].clientY;
      gestureRef.current.startPanX = pan.x;
      gestureRef.current.startPanY = pan.y;
    }
  };

  // タッチ移動（ピンチ拡縮・1本指パン移動）
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      if (
        gestureRef.current.mode !== "pinch" ||
        gestureRef.current.startDist <= 0
      ) {
        gestureRef.current.mode = "pinch";
        gestureRef.current.startDist = dist;
        gestureRef.current.startScale = zoomScale;
        return;
      }
      const ratio = dist / gestureRef.current.startDist;
      const nextScale = Math.min(
        5,
        Math.max(1, gestureRef.current.startScale * ratio)
      );
      setZoomScale(nextScale);
      if (nextScale <= 1.02) {
        setPan({ x: 0, y: 0 });
      }
    } else if (
      e.touches.length === 1 &&
      gestureRef.current.mode === "pan" &&
      zoomScale > 1
    ) {
      const dx = e.touches[0].clientX - gestureRef.current.startX;
      const dy = e.touches[0].clientY - gestureRef.current.startY;
      setPan({
        x: gestureRef.current.startPanX + dx,
        y: gestureRef.current.startPanY + dy,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.touches.length === 0) {
      gestureRef.current.mode = "none";
      if (zoomScale <= 1.02) {
        resetZoomAndPan();
      }
    } else if (e.touches.length === 1) {
      // 2本指から1本指になった場合は現在のパン位置を基準に切り替え
      gestureRef.current.mode = "pan";
      gestureRef.current.startX = e.touches[0].clientX;
      gestureRef.current.startY = e.touches[0].clientY;
      gestureRef.current.startPanX = pan.x;
      gestureRef.current.startPanY = pan.y;
    }
  };

  // PCマウスホイールでの拡大縮小
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    applyZoom(zoomScale + delta);
  };

  // PCマウスドラッグでの移動
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    mouseDragRef.current = {
      isDragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mouseDragRef.current.isDragging) return;
    const dx = e.clientX - mouseDragRef.current.startX;
    const dy = e.clientY - mouseDragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      mouseDragRef.current.moved = true;
    }
    setPan({
      x: mouseDragRef.current.startPanX + dx,
      y: mouseDragRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    mouseDragRef.current.isDragging = false;
  };

  if (!imagePath || hasError || !resolvedUrl) {
    return null;
  }

  const displayHeaderTitle =
    headerLabel ||
    (isDiagram
      ? `まとめ表・図解${caption ? `：${caption}` : ""}`
      : `講義スライド図解${sourceFile ? `（${sourceFile}）` : ""}`);

  const lightboxTitle = isDiagram
    ? `まとめ表・図解：${caption || sourceFile || ""}`
    : sourceFile
    ? `出典スライド: ${sourceFile}`
    : "講義スライド図解";

  return (
    <>
      <div
        className={`rounded-2xl border bg-white overflow-hidden shadow-sm transition ${
          isDiagram
            ? "border-indigo-500/35 hover:border-indigo-600"
            : "border-teal-500/30 hover:border-teal-600"
        }`}
      >
        {/* ヘッダーバー */}
        <div
          onClick={() => {
            resetZoomAndPan();
            setIsLightboxOpen(true);
          }}
          className={`flex items-center justify-between gap-2 px-3.5 py-2 text-white cursor-pointer select-none ${
            isDiagram
              ? "bg-gradient-to-r from-indigo-700 to-blue-600"
              : "bg-gradient-to-r from-teal-700 to-emerald-600"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isDiagram ? (
              <Table2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-indigo-100" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-teal-100" />
            )}
            <span className="text-[11px] sm:text-xs font-bold truncate">
              {displayHeaderTitle}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white shrink-0 hover:bg-white/25 transition">
            <ZoomIn className="h-3 w-3" />
            <span>タップ・指で拡大</span>
          </span>
        </div>

        {/* 画像本体（タップまたは2本指ピンチで全画面拡大モーダルを開く） */}
        <div
          onClick={() => {
            resetZoomAndPan();
            setIsLightboxOpen(true);
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              resetZoomAndPan();
              setZoomScale(1.8);
              setIsLightboxOpen(true);
            }
          }}
          className={`relative group bg-white flex items-center justify-center cursor-zoom-in ${
            isDiagram ? "p-0 sm:p-2" : "p-1.5 sm:p-3"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedUrl}
            alt={caption || (isDiagram ? "まとめ表・図解" : "講義解説スライド図解")}
            onError={() => setHasError(true)}
            loading="lazy"
            className={`w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.01] ${
              isDiagram
                ? "sm:max-w-[480px] mx-auto"
                : compact
                ? "rounded-lg max-h-[260px] sm:max-h-[340px]"
                : "rounded-lg max-h-[300px] sm:max-h-[420px]"
            }`}
          />
          <div
            className={`pointer-events-none absolute bottom-3 right-3 rounded-xl px-2.5 py-1 text-[10px] font-bold text-white shadow-md flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${
              isDiagram ? "bg-indigo-800/85" : "bg-teal-800/85"
            }`}
          >
            <Maximize2 className="h-3 w-3" />
            <span>タップで全画面・指でピンチ拡大</span>
          </div>
        </div>
      </div>

      {/* 全画面ピンチズーム＆ドラッグ対応ライトボックスモーダル（スマホ余白ゼロ・90°回転対応） */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col select-none animate-fadeIn h-[100dvh] w-[100vw]"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* 上部コントロールバー（コンパクト1行設計） */}
          <div
            className={`flex items-center justify-between gap-1.5 px-2.5 sm:px-5 py-2 text-white border-b border-white/15 shrink-0 z-10 ${
              isDiagram ? "bg-indigo-800" : "bg-teal-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 flex-1 hidden sm:block">
              <div className="text-xs sm:text-sm font-extrabold truncate">
                {lightboxTitle}
              </div>
              <div
                className={`text-[10px] sm:text-[11px] flex items-center gap-1 mt-0.5 ${
                  isDiagram ? "text-indigo-100" : "text-teal-100"
                }`}
              >
                <Hand className="h-3 w-3 shrink-0" />
                <span>
                  2本指ピンチまたはダブルタップで拡大・1本指ドラッグで移動
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 w-full sm:w-auto shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRotated((prev) => !prev);
                    setZoomScale(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold transition ${
                    isRotated
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "bg-white/15 hover:bg-white/25 text-white"
                  }`}
                  title="90度回転（横向き全画面）"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>{isRotated ? "縦に戻す" : "横全画面"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyZoom(zoomScale - 0.5)}
                  disabled={zoomScale <= 1}
                  className="inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 p-1.5 sm:p-2 text-xs font-bold text-white transition"
                  title="縮小"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.1}
                  value={Math.min(4, zoomScale)}
                  onChange={(e) => applyZoom(parseFloat(e.target.value))}
                  className="w-14 sm:w-24 accent-teal-300 cursor-pointer"
                  aria-label="ズーム倍率スライダー"
                />

                <span className="text-[11px] sm:text-xs font-mono font-bold min-w-[38px] sm:min-w-[44px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => applyZoom(zoomScale + 0.5)}
                  disabled={zoomScale >= 5}
                  className="inline-flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 p-1.5 sm:p-2 text-xs font-bold text-white transition"
                  title="拡大"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                {zoomScale > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 px-2 py-1.5 text-[11px] font-bold text-white transition"
                    title="倍率リセット"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="inline-flex items-center gap-1 rounded-xl bg-white text-slate-900 hover:bg-slate-100 px-2.5 sm:px-3 py-1.5 text-xs font-extrabold shadow-sm transition shrink-0"
              >
                <X className="h-4 w-4" />
                <span>閉じる</span>
              </button>
            </div>
          </div>

          {/* 2本指ピンチ＆1本指パン操作キャンバス（スマホでは画面端まで余白ゼロ） */}
          <div
            className="relative flex-1 overflow-hidden flex items-center justify-center p-0 sm:p-3 bg-white sm:bg-slate-950"
            style={{ touchAction: "none" }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              onDoubleClick={() => {
                if (zoomScale > 1.1) {
                  setZoomScale(1);
                  setPan({ x: 0, y: 0 });
                } else {
                  setZoomScale(2.2);
                  setPan({ x: 0, y: 0 });
                }
              }}
              className="flex items-center justify-center w-full h-full"
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomScale})`,
                transformOrigin: "center center",
                transition:
                  gestureRef.current.mode !== "none" ||
                  mouseDragRef.current.isDragging
                    ? "none"
                    : "transform 0.15s ease-out",
                cursor: zoomScale > 1 ? "grab" : "zoom-in",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedUrl}
                alt={caption || "講義解説スライド拡大図"}
                draggable={false}
                style={
                  isRotated
                    ? {
                        transform: "rotate(90deg)",
                        maxWidth: "calc(100dvh - 52px)",
                        maxHeight: "100vw",
                        width: "auto",
                        height: "auto",
                      }
                    : undefined
                }
                className={
                  isRotated
                    ? "object-contain select-none pointer-events-none bg-white"
                    : "w-full h-full sm:w-auto sm:h-auto max-w-[100vw] max-h-[calc(100dvh-52px)] object-contain select-none pointer-events-none bg-white sm:rounded-xl sm:shadow-2xl"
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ExplanationVisualsPanelProps {
  diagramImage?: string | null;
  diagramTitle?: string | null;
  slideImage?: string | null;
  slideCaption?: string;
  sourceFile?: string;
  compact?: boolean;
}

export function ExplanationVisualsPanel({
  diagramImage,
  diagramTitle,
  slideImage,
  slideCaption,
  sourceFile,
  compact = false,
}: ExplanationVisualsPanelProps) {
  const hasDiagram = Boolean(diagramImage);
  const hasSlide = Boolean(slideImage);
  const [viewMode, setViewMode] = useState<"both" | "diagram" | "slide">("both");

  useEffect(() => {
    setViewMode("both");
  }, [diagramImage, slideImage]);

  if (!hasDiagram && !hasSlide) {
    return null;
  }

  if (hasDiagram && !hasSlide) {
    return (
      <ExplanationImageViewer
        imagePath={diagramImage}
        caption={diagramTitle || slideCaption}
        sourceFile={sourceFile}
        compact={compact}
        variant="diagram"
      />
    );
  }

  if (!hasDiagram && hasSlide) {
    return (
      <ExplanationImageViewer
        imagePath={slideImage}
        caption={slideCaption}
        sourceFile={sourceFile}
        compact={compact}
        variant="slide"
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {/* 表示切り替えバー（両方 / まとめ表・図解 / 講義スライド） */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/90 border border-slate-200 px-2.5 py-1.5 shadow-sm">
        <span className="text-[11px] font-bold text-slate-600 pl-1">
          解説ビジュアル（2点）
        </span>
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode("both")}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-bold transition ${
              viewMode === "both"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Columns2 className="h-3 w-3" />
            <span>両方表示</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("diagram")}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-bold transition ${
              viewMode === "diagram"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-indigo-700"
            }`}
          >
            <Table2 className="h-3 w-3" />
            <span>まとめ図表</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("slide")}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-bold transition ${
              viewMode === "slide"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 hover:text-teal-700"
            }`}
          >
            <ImageIcon className="h-3 w-3" />
            <span>講義スライド</span>
          </button>
        </div>
      </div>

      {(viewMode === "both" || viewMode === "diagram") && (
        <ExplanationImageViewer
          imagePath={diagramImage}
          caption={diagramTitle || slideCaption}
          sourceFile={sourceFile}
          compact={compact}
          variant="diagram"
        />
      )}

      {(viewMode === "both" || viewMode === "slide") && (
        <ExplanationImageViewer
          imagePath={slideImage}
          caption={slideCaption}
          sourceFile={sourceFile}
          compact={compact}
          variant="slide"
        />
      )}
    </div>
  );
}
