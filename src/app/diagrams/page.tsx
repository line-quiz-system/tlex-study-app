'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Table2,
  Search,
  BookOpen,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { DIAGRAMS_DATA } from '@/data/diagramsData';
import { DiagramVisualType } from '@/types';
import { ExplanationImageViewer } from '@/components/ExplanationImageViewer';

const VISUAL_TYPE_LABELS: Record<DiagramVisualType, string> = {
  table: '比較・分類表',
  matrix: '2項目対比',
  flow: '手順・鑑別フロー',
  diagram: '模式図・図解',
  timeline: '時系列まとめ',
  cards: '要点カード',
};

const VISUAL_TYPE_BADGE_COLORS: Record<DiagramVisualType, string> = {
  table: 'bg-teal-50 text-teal-700 border-teal-200',
  matrix: 'bg-blue-50 text-blue-700 border-blue-200',
  flow: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  diagram: 'bg-violet-50 text-violet-700 border-violet-200',
  timeline: 'bg-amber-50 text-amber-800 border-amber-200',
  cards: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function DiagramsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [displayLimit, setDisplayLimit] = useState<number>(30);

  const units = useMemo(() => {
    const map = new Map<string, { prefix: string; category: string; count: number }>();
    for (const d of DIAGRAMS_DATA) {
      const existing = map.get(d.unitPrefix);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(d.unitPrefix, { prefix: d.unitPrefix, category: d.category, count: 1 });
      }
    }
    return Array.from(map.values());
  }, []);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of DIAGRAMS_DATA) {
      counts[d.visualType] = (counts[d.visualType] || 0) + 1;
    }
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return DIAGRAMS_DATA.filter((d) => {
      if (selectedUnit !== 'ALL' && d.unitPrefix !== selectedUnit) return false;
      if (selectedType !== 'ALL' && d.visualType !== selectedType) return false;
      if (!q) return true;
      const hay = [
        d.unitPrefix,
        d.category,
        d.title,
        d.subtitle,
        d.examPoint,
        ...(d.keywords || []),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [searchTerm, selectedUnit, selectedType]);

  const visible = filtered.slice(0, displayLimit);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Table2 className="w-6 h-6 text-indigo-600" />
            <span>TLE 図表まとめ一覧（直前復習用）</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            全4分野のガイドライン・手技・安全管理から作成したスマホ最適化図表 全{DIAGRAMS_DATA.length}点（タップ全画面・横回転拡大対応）
          </p>
        </div>

        <Link
          href="/questions"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition"
        >
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>問題庫を見る</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDisplayLimit(30);
            }}
            placeholder="キーワード検索（Class I、SVC損傷、ブリッジバルーン、レーザー、Micraなど）"
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              分野（全{units.length}分野）
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setDisplayLimit(30);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">全分野（{DIAGRAMS_DATA.length}点）</option>
              {units.map((u) => (
                <option key={u.prefix} value={u.prefix}>
                  {u.prefix} {u.category}（{u.count}点）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              図表の種別
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setDisplayLimit(30);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">すべての種別（{DIAGRAMS_DATA.length}点）</option>
              {(Object.keys(VISUAL_TYPE_LABELS) as DiagramVisualType[]).map((vt) => (
                <option key={vt} value={vt}>
                  {VISUAL_TYPE_LABELS[vt]}（{typeCounts[vt] || 0}点）
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>該当図表: {filtered.length} 点</span>
        </span>
        {(searchTerm || selectedUnit !== 'ALL' || selectedType !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedUnit('ALL');
              setSelectedType('ALL');
              setDisplayLimit(30);
            }}
            className="text-indigo-600 hover:underline font-bold"
          >
            フィルタをリセット
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-500 text-xs sm:text-sm">
          条件に一致する図表が見つかりませんでした。
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {visible.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm hover:border-indigo-300 transition space-y-2.5 flex flex-col"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
                    {item.unitPrefix} {item.category}
                  </span>
                  <span
                    className={`text-[11px] font-bold border px-2 py-0.5 rounded-md ${
                      VISUAL_TYPE_BADGE_COLORS[item.visualType] ||
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {VISUAL_TYPE_LABELS[item.visualType] || '図表'}
                  </span>
                  {item.relatedQuestionCount > 0 && (
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      解説連動 {item.relatedQuestionCount}問
                    </span>
                  )}
                </div>

                <ExplanationImageViewer
                  imagePath={item.imagePath}
                  caption={item.title}
                  sourceFile={`${item.unitPrefix} ${item.category}`}
                  variant="diagram"
                  headerLabel={item.title}
                />
              </article>
            ))}
          </div>

          {filtered.length > displayLimit && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 30)}
                className="rounded-2xl border border-indigo-200 bg-indigo-50 px-6 py-3 text-xs sm:text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
              >
                さらに図表を表示する（残り {filtered.length - displayLimit} 点）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
