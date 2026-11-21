'use client';

import React from 'react';
import {
  RotateCw,
  CheckCircle2,
  BookmarkCheck,
} from 'lucide-react';
import { StudyCard, AnswerRating } from '@/types';
import { getStatusBadgeInfo } from '@/lib/spaced-repetition';
import { ExplanationImageViewer } from './ExplanationImageViewer';

interface FlashcardProps {
  card: StudyCard;
  isFlipped: boolean;
  isSubmitting?: boolean;
  onFlip: () => void;
  onAnswer: (rating: AnswerRating | boolean) => void;
}

export function Flashcard({
  card,
  isFlipped,
  isSubmitting = false,
  onFlip,
  onAnswer,
}: FlashcardProps) {
  const { question, progress } = card;
  const statusInfo = getStatusBadgeInfo(progress?.status || 'unseen');

  const handleRate = (rating: AnswerRating) => {
    if (isSubmitting) return;
    onAnswer(rating);
  };

  return (
    <div className="w-full">
      <div className="relative min-h-[380px] sm:min-h-[460px] w-full rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden transition-all duration-300">
        {!isFlipped ? (
          /* 【表面】1問1答問題 */
          <div
            onClick={onFlip}
            className="flex flex-col justify-between p-5 sm:p-8 min-h-[380px] sm:min-h-[460px] cursor-pointer select-none active:bg-slate-50"
          >
            <div>
              {/* カード上部メタ情報 */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 pb-3 sm:pb-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-teal-700 border border-teal-200">
                    {question.category}
                  </span>
                  {question.subcategory && (
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-700 border border-slate-200">
                      {question.subcategory}
                    </span>
                  )}
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold border ${statusInfo.bgClass} ${statusInfo.textClass} ${statusInfo.borderClass}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* 問題文 */}
              <div className="my-8 sm:my-12">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 leading-relaxed tracking-wide">
                  {question.question}
                </h2>
              </div>
            </div>

            {/* 反転ガイドボタン */}
            <div className="mt-6 pt-3 sm:pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3.5 sm:py-4 px-4 text-sm font-bold text-white hover:from-teal-500 hover:to-emerald-500 active:scale-[0.98] shadow-md shadow-teal-600/20 transition"
              >
                <RotateCw className="h-4 w-4 text-white" />
                <span>タップして解答・解説を表示</span>
              </button>
            </div>
          </div>
        ) : (
          /* 【裏面】150〜200文字の論理的解答・解説 & 3段階評価ボタン */
          <div className="flex flex-col justify-between p-4 sm:p-8 min-h-[400px] sm:min-h-[480px]">
            <div>
              {/* カード上部メタ情報 */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    解答・論理解説
                  </span>
                  <span className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-none">
                    {question.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onFlip}
                  className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 transition"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>問題に戻す</span>
                </button>
              </div>

              {/* 設問の再掲 */}
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                  Q. {question.question}
                </p>
              </div>

              {/* 150〜200文字の解答・解説ボックス */}
              <div className="mt-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-600" />
                    <span>正解のポイント・メカニズム解説</span>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-mono text-emerald-800 border border-emerald-200">
                    {question.answer.length}文字
                  </span>
                </div>
                <div className="text-sm sm:text-lg leading-relaxed text-slate-900 whitespace-pre-wrap font-medium">
                  {question.answer}
                </div>

                {/* まとめ表・図解（スマホ全画面・横回転・ピンチ拡大対応） */}
                {question.diagram_image && (
                  <div className="pt-2">
                    <ExplanationImageViewer
                      imagePath={question.diagram_image}
                      caption={question.diagram_title || question.question}
                      sourceFile={question.source_file || question.category}
                      variant="diagram"
                    />
                  </div>
                )}

                {/* 出典情報 */}
                {question.source_file && (
                  <div className="pt-2.5 border-t border-emerald-200/70 text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <BookmarkCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                    <span className="truncate">出典: {question.source_file}</span>
                  </div>
                )}
              </div>
            </div>

            {/* スマホでもスクロール不要で親指タップできる3列評価ボタン */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="mb-2.5 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  記憶の定着度を選択して次へ
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500">即座に自動保存</span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* 1. 忘れていた (翌日) */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRate('forgot')}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100/80 p-2.5 sm:p-3.5 text-center transition active:scale-95 hover:border-rose-400"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-rose-700">
                    忘れていた
                  </span>
                  <span className="mt-0.5 text-[10px] sm:text-xs text-rose-600 font-medium">
                    明日復習 (1日後)
                  </span>
                </button>

                {/* 2. 3日後復習 */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRate('review_3d')}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100/80 p-2.5 sm:p-3.5 text-center transition active:scale-95 hover:border-amber-400"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-amber-700">
                    やや曖昧
                  </span>
                  <span className="mt-0.5 text-[10px] sm:text-xs text-amber-600 font-medium">
                    3日後復習
                  </span>
                </button>

                {/* 3. 覚えている (7日後) */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRate('remembered')}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 p-2.5 sm:p-3.5 text-center transition active:scale-95 hover:border-emerald-400"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-700">
                    覚えている
                  </span>
                  <span className="mt-0.5 text-[10px] sm:text-xs text-emerald-600 font-medium">
                    7日後復習
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
