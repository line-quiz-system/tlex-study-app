'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import { getStatusBadgeInfo } from '@/lib/spaced-repetition';
import { EcgLoader } from '@/components/EcgLoader';
import { ExplanationImageViewer } from '@/components/ExplanationImageViewer';
import {
  Search,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
} from 'lucide-react';
import { StudyStatus } from '@/types';

export default function QuestionsPage() {
  const { questions = [], progressMap = {} } = useStudyStore();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState<number>(80);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const allQuestions = useMemo(() => (Array.isArray(questions) ? questions : []), [questions]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    allQuestions.forEach((q) => {
      if (q?.category) map.set(q.category, (map.get(q.category) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [allQuestions]);

  const filteredQuestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allQuestions.filter((q) => {
      if (!q) return false;
      const matchesCat = selectedCategory === 'ALL' || q.category === selectedCategory;
      if (!matchesCat) return false;

      const progress = progressMap[q.id];
      const status: StudyStatus = progress ? progress.status : 'unseen';
      const normalizedStatus = status === 'new' ? 'unseen' : status;
      const matchesStatus = selectedStatus === 'ALL' || normalizedStatus === selectedStatus;
      if (!matchesStatus) return false;

      if (!term) return true;
      return (
        (q.question && q.question.toLowerCase().includes(term)) ||
        (q.answer && q.answer.toLowerCase().includes(term)) ||
        (q.category && q.category.toLowerCase().includes(term)) ||
        (q.subcategory && q.subcategory.toLowerCase().includes(term)) ||
        (q.source_file && q.source_file.toLowerCase().includes(term))
      );
    });
  }, [allQuestions, searchTerm, selectedCategory, selectedStatus, progressMap]);

  if (!mounted || isLoading) {
    return (
      <EcgLoader
        message="問題庫データを読み込み中..."
        subMessage="LEAD II | Sinus Rhythm | HR 72 bpm | 25.0 mm/s"
      />
    );
  }

  const visibleQuestions = filteredQuestions.slice(0, displayLimit);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 bg-white">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-teal-600" />
          <span>収録問題・習得状況一覧</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          全 {allQuestions.length} 問のアクティブリコール問題と間隔反復ステータス
        </p>
      </div>

      {/* 検索・フィルタバー */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDisplayLimit(80);
            }}
            placeholder="キーワード検索（リード抜去、感染、Bridgeバルーン、エキシマレーザー、3830など）"
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">単元・分野</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setDisplayLimit(80);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">全分野 ({allQuestions.length}問)</option>
              {categories.map(([cat, cnt]) => (
                <option key={cat} value={cat}>
                  {cat} ({cnt}問)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">習得ステータス</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setDisplayLimit(80);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">全ステータス</option>
              <option value="unseen">未学習</option>
              <option value="loop_1">翌日復習中 (loop_1)</option>
              <option value="loop_3">3日後復習中 (loop_3)</option>
              <option value="wait_7">7日後待機・定着 (wait_7)</option>
              <option value="mastered">習得済み (mastered)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 問題リスト */}
      <div className="space-y-3">
        <div className="text-xs text-slate-500 font-semibold px-1 flex items-center justify-between">
          <span>該当問題: {filteredQuestions.length} 問</span>
          <span>タップで150〜200文字の論理解説を展開</span>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-500 text-xs sm:text-sm">
            条件に一致する問題は見つかりませんでした。
          </div>
        ) : (
          <>
            {visibleQuestions.map((q) => {
              const progress = progressMap[q.id];
              const status: StudyStatus = progress ? progress.status : 'unseen';
              const badge = getStatusBadgeInfo(status);
              const isExpanded = expandedId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:border-teal-400 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md font-semibold">
                        {q.category}
                      </span>
                      {q.subcategory && (
                        <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          {q.subcategory}
                        </span>
                      )}
                      <span
                        className={`text-[11px] border px-2 py-0.5 rounded-md font-bold ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="cursor-pointer"
                  >
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 space-y-3 text-xs sm:text-sm animate-fadeIn">
                      <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>解答・論理解説</span>
                          </div>
                          <span className="text-[11px] text-emerald-700 font-mono">
                            {q.answer.length}文字
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {q.answer}
                        </p>

                        {q.diagram_image && (
                          <div className="pt-2">
                            <ExplanationImageViewer
                              imagePath={q.diagram_image}
                              caption={q.diagram_title || q.question}
                              sourceFile={q.source_file || q.category}
                              variant="diagram"
                              compact
                            />
                          </div>
                        )}
                      </div>

                      {q.source_file && (
                        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                          <span className="flex items-center gap-1.5">
                            <BookmarkCheck className="w-3.5 h-3.5 text-teal-600" />
                            出典: {q.source_file}
                          </span>
                          {progress && (
                            <span>
                              次回復習予定:{' '}
                              {new Date(progress.next_review_date).toLocaleDateString('ja-JP')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredQuestions.length > displayLimit && (
              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 100)}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-6 py-3 text-xs font-bold text-teal-700 hover:bg-slate-100 transition"
                >
                  さらに表示する
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
