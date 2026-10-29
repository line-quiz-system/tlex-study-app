"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStudyStore } from "@/store/useStudyStore";
import { StudyStatus, StudySessionMode } from "@/types";
import { isDueForReview } from "@/lib/spaced-repetition";
import {
  X,
  CheckSquare,
  Square,
  Play,
  BookOpen,
  Search,
  Filter,
} from "lucide-react";

export type SelectModalFilterType = "learning" | "due" | "new" | "mastered" | "all";

interface QuestionSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterType: SelectModalFilterType;
  initialCategory?: string;
  title?: string;
}

export function QuestionSelectModal({
  isOpen,
  onClose,
  filterType,
  initialCategory = "ALL",
  title,
}: QuestionSelectModalProps) {
  const router = useRouter();
  const { questions = [], progressMap = {}, startCustomQuestionsSession } = useStudyStore();

  const [currentTab, setCurrentTab] = useState<SelectModalFilterType>(filterType);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // タブごとの件数集計
  const countMap = useMemo(() => {
    const now = new Date();
    let due = 0;
    let unseen = 0;
    let learning = 0;
    let mastered = 0;

    for (const q of questions) {
      const prog = progressMap[q.id];
      const status: StudyStatus = prog?.status || "unseen";
      if (status === "unseen" || status === "new") {
        unseen++;
      } else {
        if (isDueForReview(prog, now)) {
          due++;
        }
        if (status === "mastered") {
          mastered++;
        } else {
          learning++;
        }
      }
    }
    return { due, unseen, learning, mastered, all: questions.length };
  }, [questions, progressMap]);

  const targetQuestions = useMemo(() => {
    const now = new Date();
    return questions.filter((q) => {
      const prog = progressMap[q.id];
      const status: StudyStatus = prog?.status || "unseen";

      if (currentTab === "learning") {
        return (
          status === "loop_1" ||
          status === "loop_2" ||
          status === "loop_3" ||
          status === "loop_7" ||
          status === "loop_14" ||
          status === "wait_7"
        );
      } else if (currentTab === "due") {
        return isDueForReview(prog, now);
      } else if (currentTab === "new") {
        return status === "unseen" || status === "new";
      } else if (currentTab === "mastered") {
        return status === "mastered";
      }
      return true;
    });
  }, [questions, progressMap, currentTab]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of targetQuestions) {
      map.set(q.category, (map.get(q.category) || 0) + 1);
    }
    return Array.from(map.entries());
  }, [targetQuestions]);

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return targetQuestions.filter((q) => {
      if (selectedCategory !== "ALL" && q.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      return (
        q.question.toLowerCase().includes(query) ||
        q.answer.toLowerCase().includes(query) ||
        (q.subcategory && q.subcategory.toLowerCase().includes(query)) ||
        (q.source_file && q.source_file.toLowerCase().includes(query))
      );
    });
  }, [targetQuestions, selectedCategory, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setCurrentTab(filterType);
      const initCat = initialCategory && initialCategory !== "ALL" ? initialCategory : "ALL";
      setSelectedCategory(initCat);
      setSearchQuery("");
      setDisplayLimit(100);
      const initialFiltered =
        initCat !== "ALL"
          ? targetQuestions.filter((q) => q.category === initCat)
          : targetQuestions;
      if (filterType === "due" || initialFiltered.length <= 20) {
        setSelectedIds(new Set(initialFiltered.map((q) => q.id)));
      } else {
        setSelectedIds(new Set(initialFiltered.slice(0, 15).map((q) => q.id)));
      }
    }
  }, [isOpen, filterType, initialCategory]);

  if (!isOpen) return null;

  const modalTitle =
    title ||
    (currentTab === "due"
      ? "本日の復習問題を選択"
      : currentTab === "new"
      ? "未学習問題を選択"
      : "問題を選択");

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectFilteredAll = () => {
    setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectRandom = (count: number) => {
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    setSelectedIds(new Set(shuffled.slice(0, count).map((q) => q.id)));
  };

  const handleStart = () => {
    if (selectedIds.size === 0) return;
    const chosenIds = Array.from(selectedIds);
    const sessionMode: StudySessionMode = currentTab === "due" ? "review" : "unseen";
    const success = startCustomQuestionsSession(chosenIds, sessionMode);
    if (success) {
      onClose();
      router.push("/study");
    }
  };

  const visibleQuestions = filteredQuestions.slice(0, displayLimit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[88vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-900">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 sm:px-6 py-4 bg-white">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{modalTitle}</h3>
              <p className="text-xs text-slate-500">
                出題する問題を選択してください（現在 {selectedIds.size} 問選択中 / 表示対象 {filteredQuestions.length} 問）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* モード切替タブ（未学習・復習・学習中・すべて） */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 sm:px-6 pt-2.5 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setCurrentTab("new");
              setSelectedIds(new Set());
              setDisplayLimit(100);
            }}
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap transition ${
              currentTab === "new"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            未学習 ({countMap.unseen}問)
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentTab("due");
              setSelectedIds(new Set());
              setDisplayLimit(100);
            }}
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap transition ${
              currentTab === "due"
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            本日復習 ({countMap.due}問)
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentTab("learning");
              setSelectedIds(new Set());
              setDisplayLimit(100);
            }}
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap transition ${
              currentTab === "learning"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            学習中 ({countMap.learning}問)
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentTab("all");
              setSelectedIds(new Set());
              setDisplayLimit(100);
            }}
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap transition ${
              currentTab === "all"
                ? "border-slate-800 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            すべて ({countMap.all}問)
          </button>
        </div>

        {/* フィルター＆検索バー */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 sm:px-6 py-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <Filter className="h-3.5 w-3.5 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setDisplayLimit(100);
                }}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">すべての分野 ({targetQuestions.length}問)</option>
                {categories.map(([cat, cnt]) => (
                  <option key={cat} value={cat}>
                    {cat} ({cnt}問)
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="問題・解答・キーワードで検索..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* クイック選択ボタン群 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-semibold text-[11px] mr-1">クイック選択:</span>
              {[5, 10, 15, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSelectRandom(num)}
                  disabled={filteredQuestions.length === 0}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 font-bold hover:border-teal-500 hover:text-teal-600 transition disabled:opacity-40"
                >
                  ランダム{num}問
                </button>
              ))}
              <button
                type="button"
                onClick={handleSelectFilteredAll}
                disabled={filteredQuestions.length === 0}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 font-bold hover:border-teal-500 hover:text-teal-600 transition disabled:opacity-40"
              >
                全選択 ({filteredQuestions.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-500 hover:text-slate-700 transition"
              >
                全解除
              </button>
            </div>
            <span className="text-slate-500 text-[11px]">
              {currentTab === "due" ? "本日復習対象" : currentTab === "new" ? "未学習問題" : "表示中の対象"}
            </span>
          </div>
        </div>

        {/* リスト本文 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 bg-white">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              条件に一致する問題がありません。
            </div>
          ) : (
            <>
              {visibleQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);

                return (
                  <div
                    key={q.id}
                    onClick={() => handleToggle(q.id)}
                    className={`cursor-pointer flex items-start space-x-3.5 rounded-2xl border p-3.5 sm:p-4 transition-all duration-150 ${
                      isSelected
                        ? "border-teal-500 bg-teal-50/50 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-teal-600"
                      tabIndex={-1}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 fill-teal-100 text-teal-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 border border-teal-200">
                          {q.category}
                        </span>
                        {q.subcategory && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 border border-slate-200">
                            {q.subcategory}
                          </span>
                        )}
                        {q.source_file && (
                          <span className="text-[10px] text-slate-400">
                            {q.source_file}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                        {q.question}
                      </p>
                    </div>
                  </div>
                );
              })}

              {filteredQuestions.length > displayLimit && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setDisplayLimit((prev) => prev + 150)}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-2.5 text-xs font-bold text-teal-700 hover:bg-slate-100 transition"
                  >
                    さらに表示する
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-slate-200 bg-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            選択中: <span className="font-bold text-teal-600 text-sm">{selectedIds.size}</span> 問
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={selectedIds.size === 0}
              className={`flex items-center space-x-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-md ${
                selectedIds.size > 0
                  ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-600/20 hover:from-teal-500 hover:to-emerald-500"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>選択した問題で開始 ({selectedIds.size}問)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
