"use client";

import React from "react";
import { Activity } from "lucide-react";

interface EcgLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export const EcgLoader: React.FC<EcgLoaderProps> = ({
  message = "TLE 経静脈的リード抜去術 学習データを読み込み中...",
  subMessage = "Normal Sinus Rhythm | HR 72 bpm | 25.0 mm/s",
  fullScreen = false,
}) => {
  const ecgPath =
    "M 0,75 L 35,75 " +
    "C 42,75 46,62 54,62 C 62,62 66,75 73,75 " +
    "L 90,75 " +
    "L 96,86 L 106,18 L 116,108 L 123,75 " +
    "L 142,75 " +
    "C 152,75 158,52 170,52 C 182,52 188,75 198,75 " +
    "L 235,75 " +
    "C 242,75 246,62 254,62 C 262,62 266,75 273,75 " +
    "L 290,75 " +
    "L 296,86 L 306,16 L 316,108 L 323,75 " +
    "L 342,75 " +
    "C 352,75 358,52 370,52 C 382,52 388,75 398,75 " +
    "L 435,75 " +
    "C 442,75 446,62 454,62 C 462,62 466,75 473,75 " +
    "L 490,75 " +
    "L 496,86 L 506,18 L 516,108 L 523,75 " +
    "L 542,75 " +
    "C 552,75 558,52 570,52 C 582,52 588,75 600,75";

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 select-none bg-white ${
        fullScreen ? "min-h-[75vh]" : "min-h-[60vh]"
      }`}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
        {/* モニター上部ステータスバー */}
        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono font-bold text-teal-700 tracking-wider">
              LEAD II
            </span>
            <span className="text-[11px] text-slate-500 font-mono">10mm/mV</span>
          </div>
          <div className="flex items-center space-x-1.5 font-mono text-emerald-600">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span className="text-sm font-black">72</span>
            <span className="text-[10px] text-slate-500">BPM</span>
          </div>
        </div>

        {/* 心電図波形モニター領域（左から右へ流れるSVG） */}
        <div className="relative h-32 sm:h-36 w-full overflow-hidden rounded-2xl border border-teal-200 bg-slate-950 shadow-inner">
          {/* 心電図記録紙風の背景グリッド */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #14b8a6 1px, transparent 1px), linear-gradient(to bottom, #14b8a6 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          <svg
            viewBox="0 0 600 130"
            className="relative z-10 h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
              </linearGradient>
              <filter id="ecgGlow" x="-10%" y="-20%" width="120%" height="140%">
                <feGaussianBlur stdDeviation="2.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 薄い残像ベースライン */}
            <path
              d={ecgPath}
              fill="none"
              stroke="#0f766e"
              strokeWidth="1.5"
              strokeOpacity="0.28"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 左から右へ流れるメインの心電図波形 */}
            <path
              d={ecgPath}
              pathLength={1000}
              fill="none"
              stroke="url(#ecgGradient)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#ecgGlow)"
              className="animate-ecg-trace"
            />
          </svg>
        </div>

        {/* ローディングメッセージ */}
        <div className="text-center space-y-1 pt-1">
          <p className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
            {message}
          </p>
          <p className="text-[11px] font-mono text-teal-600">{subMessage}</p>
        </div>
      </div>
    </div>
  );
};
