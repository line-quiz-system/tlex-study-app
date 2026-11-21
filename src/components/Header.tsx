'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, Table2 } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-3.5 sm:px-6">
        <Link href="/" className="flex items-center space-x-2.5 group min-w-0">
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/icon.svg?v=3`}
            alt="ECG Icon"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shadow-sm border border-teal-500/30 group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            TLE 学習アプリ
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/diagrams"
            className="px-3 py-1.5 text-indigo-700 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors text-xs font-bold flex items-center gap-1.5"
          >
            <Table2 className="w-4 h-4 text-indigo-600" />
            <span>図表まとめ</span>
          </Link>
          <Link
            href="/questions"
            className="px-3 py-1.5 text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors text-xs font-semibold flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-teal-600" />
            <span>問題庫・検索</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
