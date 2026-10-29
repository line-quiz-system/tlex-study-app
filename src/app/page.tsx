'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyStore } from '@/store/useStudyStore';
import { QuestionSelectModal, SelectModalFilterType } from '@/components/QuestionSelectModal';
import { EcgLoader } from '@/components/EcgLoader';
import {
  Sparkles,
  CalendarClock,
  BookOpen,
  Play,
  Layers,
  ChevronRight,
  Award,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const {
    getOverallStats,
    getCategoryStats,
    startReviewSession,
    startUnseenSession,
    cloudActiveSession,
    syncSessionFromCloud,
    syncProgressFromCloud,
    resumeActiveSession,
    discardCloudSession,
    isSessionActive,
    sessionCards,
    currentSessionIndex,
  } = useStudyStore();

  const [mounted, setMounted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedQuota, setSelectedQuota] = useState<number>(10);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    filterType: SelectModalFilterType;
    initialCategory: string;
    title: string;
  }>({
    isOpen: false,
    filterType: 'due',
    initialCategory: 'ALL',
    title: '',
  });

  useEffect(() => {
    setMounted(true);
    Promise.all([
      syncSessionFromCloud().catch(() => null),
      syncProgressFromCloud().catch(() => {}),
    ]);
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, [syncSessionFromCloud, syncProgressFromCloud]);

  const stats = getOverallStats();
  const categoryStats = getCategoryStats();

  const hasCloudSession =
    cloudActiveSession &&
    cloudActiveSession.sessionCards.length > 0 &&
    cloudActiveSession.currentSessionIndex < cloudActiveSession.sessionCards.length;

  const hasLocalSession =
    isSessionActive && sessionCards.length > 0 && currentSessionIndex < sessionCards.length;

  const hasIncompleteSession = mounted && (hasCloudSession || hasLocalSession);

  const activeCardCount = cloudActiveSession ? cloudActiveSession.sessionCards.length : sessionCards.length;
  const activeCurrentIndex = cloudActiveSession ? cloudActiveSession.currentSessionIndex : currentSessionIndex;

  const handleResume = () => {
    if (cloudActiveSession) resumeActiveSession();
    router.push('/study');
  };

  const handleDiscard = () => {
    discardCloudSession();
  };

  const handleStartDue = () => {
    if (stats.dueTodayCount > 0) {
      startReviewSession();
      router.push('/study');
    }
  };

  const handleStartUnseen = (quota: number) => {
    if (stats.newCount > 0) {
      startUnseenSession(quota > 0 ? quota : undefined);
      router.push('/study');
    }
  };

  const openDueModal = (category = 'ALL') => {
    setModalState({
      isOpen: true,
      filterType: 'due',
      initialCategory: category,
      title: '本日の復習問題を選択',
    });
  };

  const openUnseenModal = (category = 'ALL') => {
    setModalState({
      isOpen: true,
      filterType: 'new',
      initialCategory: category,
      title: '未学習問題を選択',
    });
  };

  if (!mounted || isInitialLoading) {
    return (
      <EcgLoader
        message="TLEX 経静脈的リード抜去術 学習データを読み込み中..."
        subMessage="Normal Sinus Rhythm | HR 72 bpm | 25.0 mm/s"
      />
    );
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-8 bg-white">
      {/* 中断セッション復元バナー（あるときだけ表示） */}
      {hasIncompleteSession && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 border border-teal-200">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">前回の学習を再開できます</h4>
                <p className="text-xs text-slate-600">
                  全{activeCardCount}問中、{activeCurrentIndex + 1}問目から途中再開可能です
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                破棄
              </button>
              <button
                type="button"
                onClick={handleResume}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-500 transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>前回の学習を再開</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヒーローセクション */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/40 p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              アクティブリコール学習
            </span>
          </h1>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* 本日の復習を開始（0問のときは非表示） */}
              {stats.dueTodayCount > 0 && (
                <button
                  type="button"
                  onClick={handleStartDue}
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-600 hover:to-rose-700 transition active:scale-[0.98]"
                >
                  <CalendarClock className="h-4 w-4" />
                  <span>本日の復習を開始</span>
                </button>
              )}

              {/* 新規問題に取り組む（0問のときは非表示） */}
              {stats.newCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartUnseen(selectedQuota)}
                    className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-500 hover:to-emerald-500 transition active:scale-[0.98]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>
                      新規問題に取り組む {selectedQuota === 0 ? '（自由）' : `（${selectedQuota}問）`}
                    </span>
                  </button>

                  {/* 隙間時間に合わせて自由に選べる出題数 */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    {[5, 10, 15, 30, 0].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedQuota(num)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                          selectedQuota === num
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {num === 0 ? '自由' : `${num}問`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stats.dueTodayCount === 0 && stats.newCount === 0 && (
                <div className="px-5 py-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-bold border border-emerald-200">
                  すべての問題の演習が完了しています
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 集計カード（3枚構成） */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* 1. 本日復習カード */}
        <div
          onClick={() => openDueModal('ALL')}
          className="group cursor-pointer relative overflow-hidden rounded-2xl border border-rose-200 bg-white p-5 shadow-sm transition hover:border-rose-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              本日復習
            </span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 border border-rose-200 group-hover:scale-105 transition-transform">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              {stats.dueTodayCount}
            </span>
            <span className="text-xs text-slate-500">問が期日到来</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>前日不正解・期日到来分</span>
            <span className="text-rose-600 font-semibold group-hover:underline inline-flex items-center text-[11px]">
              選択して開始 <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </p>
        </div>

        {/* 2. 未学習カード */}
        <div
          onClick={() => openUnseenModal('ALL')}
          className="group cursor-pointer relative overflow-hidden rounded-2xl border border-teal-200 bg-white p-5 shadow-sm transition hover:border-teal-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              未学習
            </span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600 border border-teal-200 group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              {stats.newCount}
            </span>
            <span className="text-xs text-slate-500">問の新規問題</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>未着手の専門問題集</span>
            <span className="text-teal-600 font-semibold group-hover:underline inline-flex items-center text-[11px]">
              選択して開始 <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </p>
        </div>

        {/* 3. 本日解答数カード */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              本日解答数
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 border border-emerald-200">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              {stats.todayAnsweredCount}
            </span>
            <span className="text-xs text-slate-500">問演習完了</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            本日の総演習実績（暦日 00:00〜現在）
          </p>
        </div>
      </div>

      {/* 分野別 習得進捗リスト */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">分野別 習得進捗リスト</h3>
              <p className="text-xs text-slate-500">
                各単元をクリックすると、その単元の問題を選んで学習を開始できます
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {categoryStats.map((item) => {
            const completed = item.total - item.newCount;
            const mastered = item.masteredCount + item.waitCount;
            const percent = item.total > 0 ? Math.round((completed / item.total) * 100) : 0;

            return (
              <div
                key={item.category}
                className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-teal-400 hover:bg-teal-50/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span
                      onClick={() => openUnseenModal(item.category)}
                      className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition cursor-pointer"
                    >
                      {item.category}
                    </span>
                    {item.dueCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDueModal(item.category);
                        }}
                        className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition"
                      >
                        復習 {item.dueCount}問
                      </button>
                    )}
                    {item.newCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUnseenModal(item.category);
                        }}
                        className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-700 hover:bg-teal-100 transition"
                      >
                        新規 {item.newCount}問
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-500">
                      進捗: <span className="text-slate-900 font-semibold">{completed}</span> /{' '}
                      {item.total} 問
                    </span>
                    <span className="text-emerald-600 font-semibold">
                      (定着: {mastered}問)
                    </span>
                    <span className="font-bold text-teal-600">{percent}%</span>
                    <button
                      type="button"
                      onClick={() => openUnseenModal(item.category)}
                      className="p-1 text-slate-400 group-hover:text-teal-600 transition"
                      title="問題選択"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* プログレスバー */}
                <div
                  onClick={() => openUnseenModal(item.category)}
                  className="h-2 w-full overflow-hidden rounded-full bg-slate-200 flex cursor-pointer"
                >
                  <div
                    style={{ width: `${percent}%` }}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 問題選択モーダル */}
      <QuestionSelectModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        filterType={modalState.filterType}
        initialCategory={modalState.initialCategory}
        title={modalState.title}
      />
    </div>
  );
}
