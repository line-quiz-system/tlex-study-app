import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Question,
  UserProgress,
  StudyQuota,
  StudyCard,
  StudyStatus,
  AnswerRating,
  ActiveSessionData,
  OverallStats,
  CategoryStat,
  StudySessionMode,
} from '@/types';
import { SEED_QUESTIONS } from '@/data/seed-questions';
import {
  calculateNextProgress,
  isDueForReview,
  selectSessionCards,
  selectReviewCards,
  selectUnseenCards,
} from '@/lib/spaced-repetition';
import {
  saveProgressToCloud,
  saveSessionToCloud,
  fetchSessionFromCloud,
  fetchProgressFromCloud,
} from '@/lib/cloud-api';

interface StudyStoreState {
  questions: Question[];
  progressMap: Record<string, UserProgress>;

  sessionCards: StudyCard[];
  currentSessionIndex: number;
  isFlipped: boolean;
  sessionCorrectIds: string[];
  sessionIncorrectIds: string[];
  sessionReview3dIds: string[];
  sessionMode: StudySessionMode;
  isSessionActive: boolean;
  isSessionCompleted: boolean;

  cloudActiveSession: ActiveSessionData | null;
  isLoadingCloudSession: boolean;

  selectedCategories: string[];
  selectedQuota: StudyQuota;

  setQuestions: (questions: Question[]) => void;
  setSelectedCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
  setSelectedQuota: (quota: StudyQuota) => void;

  startSession: (quota?: StudyQuota, categories?: string[]) => boolean;
  startReviewSession: () => boolean;
  startUnseenSession: (limit?: number) => boolean;
  startCustomQuestionsSession: (questionIds: string[], customMode?: StudySessionMode) => boolean;
  flipCard: () => void;
  submitAnswer: (rating: AnswerRating | boolean) => void;
  endSession: () => void;

  syncSessionFromCloud: () => Promise<ActiveSessionData | null>;
  syncProgressFromCloud: () => Promise<void>;
  resumeActiveSession: () => void;
  discardCloudSession: () => Promise<void>;

  recordAnswerLocally: (questionId: string, rating: AnswerRating | boolean) => UserProgress;
  resetProgressForQuestion: (questionId: string) => void;
  resetAllProgress: () => void;
  importCustomQuestions: (questions: Question[]) => void;
  importFullBackup: (data: { questions?: Question[]; progressMap?: Record<string, UserProgress> }) => boolean;

  getOverallStats: () => OverallStats;
  getCategoryStats: () => CategoryStat[];
  getDueCardsCount: (categories?: string[]) => number;
}

export const useStudyStore = create<StudyStoreState>()(
  persist(
    (set, get) => ({
      questions: SEED_QUESTIONS,
      progressMap: {},

      sessionCards: [],
      currentSessionIndex: 0,
      isFlipped: false,
      sessionCorrectIds: [],
      sessionIncorrectIds: [],
      sessionReview3dIds: [],
      sessionMode: 'review',
      isSessionActive: false,
      isSessionCompleted: false,

      cloudActiveSession: null,
      isLoadingCloudSession: false,

      selectedCategories: [],
      selectedQuota: 20,

      setQuestions: (questions) => set({ questions }),

      setSelectedCategories: (categories) => set({ selectedCategories: categories }),

      toggleCategory: (category) => {
        const current = get().selectedCategories;
        if (current.includes(category)) {
          set({ selectedCategories: current.filter((c) => c !== category) });
        } else {
          set({ selectedCategories: [...current, category] });
        }
      },

      setSelectedQuota: (quota) => set({ selectedQuota: quota }),

      startSession: (customQuota, customCategories) => {
        const { isSessionActive, sessionCards } = get();
        if (isSessionActive && sessionCards.length > 0) {
          return true;
        }
        const { questions, progressMap } = get();
        const unseenCards = selectUnseenCards(questions, progressMap);
        if (unseenCards.length > 0) {
          return get().startUnseenSession(15);
        }
        const dueCards = selectReviewCards(questions, progressMap);
        if (dueCards.length > 0) {
          return get().startReviewSession();
        }
        return false;
      },

      startReviewSession: () => {
        const { questions, progressMap } = get();
        const reviewCards = selectReviewCards(questions, progressMap);
        if (reviewCards.length === 0) return false;

        const newActiveSession: ActiveSessionData = {
          sessionCards: reviewCards,
          currentSessionIndex: 0,
          sessionCorrectIds: [],
          sessionIncorrectIds: [],
          sessionReview3dIds: [],
          sessionMode: 'review',
          updatedAt: new Date().toISOString(),
        };

        set({
          sessionCards: reviewCards,
          currentSessionIndex: 0,
          sessionMode: 'review',
          isFlipped: false,
          sessionCorrectIds: [],
          sessionIncorrectIds: [],
          sessionReview3dIds: [],
          isSessionActive: true,
          isSessionCompleted: false,
          cloudActiveSession: null,
        });

        saveSessionToCloud(newActiveSession);
        return true;
      },

      startUnseenSession: (limit?: number) => {
        const { questions, progressMap } = get();
        const allUnseenCards = selectUnseenCards(questions, progressMap);
        if (allUnseenCards.length === 0) return false;

        const unseenCards =
          limit && limit > 0 ? allUnseenCards.slice(0, limit) : allUnseenCards;

        const newActiveSession: ActiveSessionData = {
          sessionCards: unseenCards,
          currentSessionIndex: 0,
          sessionCorrectIds: [],
          sessionIncorrectIds: [],
          sessionReview3dIds: [],
          sessionMode: 'unseen',
          updatedAt: new Date().toISOString(),
        };

        set({
          sessionCards: unseenCards,
          currentSessionIndex: 0,
          sessionMode: 'unseen',
          isFlipped: false,
          sessionCorrectIds: [],
          sessionIncorrectIds: [],
          sessionReview3dIds: [],
          isSessionActive: true,
          isSessionCompleted: false,
          cloudActiveSession: null,
        });

        saveSessionToCloud(newActiveSession);
        return true;
      },

      startCustomQuestionsSession: (questionIds, customMode) => {
        const { questions, progressMap } = get();
        if (!questionIds || questionIds.length === 0) return false;

        const targetQuestions = questions.filter((q) => questionIds.includes(q.id));
        if (targetQuestions.length === 0) return false;

        const cardPool: StudyCard[] = targetQuestions.map((q) => {
          const progress: UserProgress = progressMap[q.id] || {
            question_id: q.id,
            status: 'unseen',
            correct_count: 0,
            incorrect_count: 0,
            next_review_date: new Date(0).toISOString(),
            last_reviewed_at: null,
            updated_at: new Date().toISOString(),
          };
          return { question: q, progress };
        });

        // Fisher-Yatesシャッフル
        const shuffled = [...cardPool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const mode: StudySessionMode = customMode || 'unseen';

        const newActiveSession: ActiveSessionData = {
          sessionCards: shuffled,
          currentSessionIndex: 0,
          sessionCorrectIds: [],
          sessionIncorrectIds: [],
          sessionReview3dIds: [],
          sessionMode: mode,
          selectedQuota: 'all',
          selectedCategories: [],
          updatedAt: new Date().toISOString(),
        };

        set({
          sessionCards: shuffled,
          currentSessionIndex: 0,
          sessionMode: mode,
          isFlipped: false,
          sessionCorrectIds: [],
          sessionIncorrectIds: [],
          sessionReview3dIds: [],
          isSessionActive: true,
          isSessionCompleted: false,
          cloudActiveSession: null,
        });

        // D1へセッション開始を非同期保存
        saveSessionToCloud(newActiveSession);

        return true;
      },

      flipCard: () => {
        set((state) => ({ isFlipped: !state.isFlipped }));
      },

      /**
       * 1問ごとの即時保存（Optimistic UI）
       * UIを即時更新し、D1への保存はバックグラウンドで並列実行
       */
      submitAnswer: (rating: AnswerRating | boolean) => {
        const state = get();
        const {
          sessionCards,
          currentSessionIndex,
          sessionCorrectIds,
          sessionIncorrectIds,
          sessionReview3dIds,
          selectedQuota,
          selectedCategories,
        } = state;

        const currentCard = sessionCards[currentSessionIndex];
        if (!currentCard) return;

        const qId = currentCard.question.id;

        // 1. ローカル進捗を即時更新（Optimistic UI）
        const updatedProgress = state.recordAnswerLocally(qId, rating);

        const isCorrect = rating === true || rating === 'remembered';
        const isReview3d = rating === 'review_3d';

        const newCorrect = isCorrect ? [...sessionCorrectIds, qId] : sessionCorrectIds;
        const newReview3d = isReview3d ? [...sessionReview3dIds, qId] : sessionReview3dIds;
        const newIncorrect = (!isCorrect && !isReview3d) ? [...sessionIncorrectIds, qId] : sessionIncorrectIds;
        const nextIndex = currentSessionIndex + 1;
        const isFinished = nextIndex >= sessionCards.length;

        const nextSessionPayload: ActiveSessionData | null = isFinished
          ? null
          : {
              sessionCards,
              currentSessionIndex: nextIndex,
              sessionCorrectIds: newCorrect,
              sessionIncorrectIds: newIncorrect,
              sessionReview3dIds: newReview3d,
              sessionMode: state.sessionMode,
              selectedQuota,
              selectedCategories,
              updatedAt: new Date().toISOString(),
            };

        // 2. UIを通信を待たずに即座に遷移
        set({
          currentSessionIndex: nextIndex,
          isFlipped: false,
          sessionCorrectIds: newCorrect,
          sessionIncorrectIds: newIncorrect,
          sessionReview3dIds: newReview3d,
          isSessionCompleted: isFinished,
          isSessionActive: !isFinished,
        });

        // 3. バックグラウンドで D1 へ並列保存（Promise.all相当）
        Promise.all([
          saveProgressToCloud(updatedProgress),
          saveSessionToCloud(nextSessionPayload),
        ]).catch(() => {
          // オフライン時はローカルストレージで保護されているため安全
        });
      },

      endSession: () => {
        set({
          isSessionActive: false,
          isSessionCompleted: false,
          sessionCards: [],
          currentSessionIndex: 0,
          isFlipped: false,
        });
        // D1のセッションをクリア
        saveSessionToCloud(null);
      },

      /**
       * D1から中断セッションを取得（端末間シームレス再開）
       */
      syncSessionFromCloud: async () => {
        set({ isLoadingCloudSession: true });
        try {
          const session = await fetchSessionFromCloud();
          if (
            session &&
            session.sessionCards &&
            session.sessionCards.length > 0 &&
            session.currentSessionIndex < session.sessionCards.length
          ) {
            set({ cloudActiveSession: session, isLoadingCloudSession: false });
            return session;
          }
          set({ cloudActiveSession: null, isLoadingCloudSession: false });
          return null;
        } catch {
          set({ cloudActiveSession: null, isLoadingCloudSession: false });
          return null;
        }
      },

      /**
       * D1から全進捗データを取得してローカルと統合（初回起動時）
       */
      syncProgressFromCloud: async () => {
        try {
          const cloudProgressMap = await fetchProgressFromCloud();
          if (!cloudProgressMap) return;

          set((state) => ({
            progressMap: {
              // ローカルとクラウドをマージ（updated_at が新しい方を優先）
              ...cloudProgressMap,
              ...Object.fromEntries(
                Object.entries(state.progressMap).filter(([qId, localProg]) => {
                  const cloudProg = cloudProgressMap[qId];
                  if (!cloudProg) return true;
                  return new Date(localProg.updated_at) > new Date(cloudProg.updated_at);
                })
              ),
            },
          }));
        } catch {
          // フォールバック: ローカルキャッシュを維持
        }
      },

      resumeActiveSession: () => {
        const session = get().cloudActiveSession;
        if (!session) return;

        set({
          sessionCards: session.sessionCards,
          currentSessionIndex: session.currentSessionIndex,
          sessionCorrectIds: session.sessionCorrectIds || [],
          sessionIncorrectIds: session.sessionIncorrectIds || [],
          sessionReview3dIds: session.sessionReview3dIds || [],
          sessionMode: session.sessionMode || 'review',
          selectedQuota: session.selectedQuota,
          selectedCategories: session.selectedCategories || [],
          isSessionActive: true,
          isSessionCompleted: false,
          isFlipped: false,
          cloudActiveSession: null,
        });
      },

      discardCloudSession: async () => {
        set({
          cloudActiveSession: null,
          isSessionActive: false,
          isSessionCompleted: false,
          sessionCards: [],
          currentSessionIndex: 0,
          isFlipped: false,
        });
        await saveSessionToCloud(null);
      },

      recordAnswerLocally: (questionId: string, rating: AnswerRating | boolean) => {
        const currentProg = get().progressMap[questionId] || {
          question_id: questionId,
          status: 'unseen' as StudyStatus,
          next_review_date: new Date().toISOString(),
          correct_count: 0,
          incorrect_count: 0,
          last_reviewed_at: null,
          updated_at: new Date().toISOString(),
        };

        const nextProg = calculateNextProgress(currentProg, rating);

        set((state) => ({
          progressMap: {
            ...state.progressMap,
            [questionId]: nextProg,
          },
        }));

        return nextProg;
      },

      resetProgressForQuestion: (questionId) => {
        set((state) => {
          const newMap = { ...state.progressMap };
          delete newMap[questionId];
          return { progressMap: newMap };
        });
      },

      resetAllProgress: () => {
        set({
          progressMap: {},
          isSessionActive: false,
          isSessionCompleted: false,
          sessionCards: [],
          currentSessionIndex: 0,
        });
      },

      importCustomQuestions: (newQuestions) => {
        set((state) => {
          const existingIds = new Set(state.questions.map((q) => q.id));
          const toAdd = newQuestions.filter((q) => !existingIds.has(q.id));
          return { questions: [...state.questions, ...toAdd] };
        });
      },

      importFullBackup: (data) => {
        try {
          set((state) => ({
            questions: data.questions && Array.isArray(data.questions) ? data.questions : state.questions,
            progressMap: data.progressMap && typeof data.progressMap === 'object' ? data.progressMap : state.progressMap,
          }));
          return true;
        } catch {
          return false;
        }
      },

      getOverallStats: () => {
        const { questions, progressMap } = get();
        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        let dueTodayCount = 0;
        let newCount = 0;
        let todayAnsweredCount = 0;
        let learningCount = 0;
        let waitCount = 0;
        let masteredCount = 0;

        questions.forEach((q) => {
          const prog = progressMap[q.id];
          if (!prog || prog.status === 'unseen' || prog.status === 'new') {
            newCount++;
          } else {
            if (isDueForReview(prog, now)) {
              dueTodayCount++;
            }
            if (prog.status === 'mastered') {
              masteredCount++;
            } else if (prog.status === 'wait_7') {
              waitCount++;
              learningCount++;
            } else {
              learningCount++;
            }
          }

          if (prog?.last_reviewed_at && new Date(prog.last_reviewed_at) >= todayStart) {
            todayAnsweredCount++;
          }
        });

        return {
          totalQuestions: questions.length,
          dueTodayCount,
          newCount,
          todayAnsweredCount,
          learningCount,
          waitCount,
          masteredCount,
        };
      },

      getCategoryStats: () => {
        const { questions, progressMap } = get();
        const now = new Date();
        const categoryMap: Record<string, CategoryStat> = {};

        questions.forEach((q) => {
          if (!categoryMap[q.category]) {
            categoryMap[q.category] = {
              category: q.category,
              total: 0,
              dueCount: 0,
              newCount: 0,
              loopCount: 0,
              waitCount: 0,
              masteredCount: 0,
            };
          }
          const stat = categoryMap[q.category];
          stat.total++;
          const prog = progressMap[q.id];
          if (!prog || prog.status === 'unseen' || prog.status === 'new') {
            stat.newCount++;
          } else if (prog.status === 'mastered') {
            stat.masteredCount++;
          } else if (prog.status === 'wait_7') {
            stat.waitCount++;
            if (new Date(prog.next_review_date) <= now) stat.dueCount++;
          } else {
            stat.loopCount++;
            if (new Date(prog.next_review_date) <= now) stat.dueCount++;
          }
        });

        return Object.values(categoryMap);
      },

      getDueCardsCount: (categories) => {
        const { questions, progressMap } = get();
        const now = new Date();
        const target = categories && categories.length > 0 ? categories : null;
        return questions.filter((q) => {
          if (target && !target.includes(q.category)) return false;
          const prog = progressMap[q.id];
          if (!prog || prog.status === 'unseen' || prog.status === 'new' || prog.status === 'mastered') {
            return false;
          }
          return new Date(prog.next_review_date) <= now;
        }).length;
      },
    }),
    {
      name: 'tlex-recall-storage-v1',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.questions = SEED_QUESTIONS;
        }
      },
      partialize: (state) => ({
        progressMap: state.progressMap,
        selectedCategories: state.selectedCategories,
        selectedQuota: state.selectedQuota,
      }),
    }
  )
);
