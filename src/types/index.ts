export type StudyStatus =
  | 'unseen'
  | 'new'
  | 'loop_1'
  | 'loop_2'
  | 'loop_3'
  | 'loop_7'
  | 'loop_14'
  | 'wait_7'
  | 'mastered';

export type AnswerRating = 'forgot' | 'review_3d' | 'remembered';

export interface Question {
  id: string;
  question: string;
  answer: string;
  category: string;
  original_text?: string;
  source_file?: string;
  created_at: string;
  subcategory?: string;
  difficulty?: 1 | 2 | 3;
  diagram_id?: string | null;
  diagram_image?: string | null;
  diagram_title?: string | null;
}

export type DiagramVisualType =
  | 'table'
  | 'matrix'
  | 'flow'
  | 'diagram'
  | 'timeline'
  | 'cards';

export interface DiagramItem {
  id: string;
  unitPrefix: string;
  category: string;
  title: string;
  subtitle: string;
  visualType: DiagramVisualType;
  theme: string;
  imagePath: string;
  examPoint: string;
  keywords: string[];
  relatedQuestionCount: number;
}

export interface ReviewCalculationResult {
  nextStatus: StudyStatus;
  nextReviewDate: Date;
  daysAdded: number;
  explanation: string;
}

export interface UserProgress {
  id?: string;
  user_id?: string;
  question_id: string;
  status: StudyStatus;
  next_review_date: string; // ISO 8601 string
  review_count?: number;
  correct_count: number;
  incorrect_count: number;
  last_reviewed_at?: string | null;
  created_at?: string;
  updated_at: string;
}

export interface StudyCard {
  question: Question;
  progress: UserProgress;
}

export type StudyQuota = 5 | 10 | 20 | 50 | 100 | 'all';
export type StudySessionMode = 'review' | 'unseen';

export interface ActiveSessionData {
  sessionCards: StudyCard[];
  currentSessionIndex: number;
  sessionCorrectIds: string[];
  sessionIncorrectIds: string[];
  sessionReview3dIds?: string[];
  sessionMode?: StudySessionMode;
  selectedQuota?: StudyQuota;
  selectedCategories?: string[];
  updatedAt: string;
}

export interface ProfileRecord {
  id: string;
  active_session: ActiveSessionData | null;
  updated_at: string;
}

export interface CategoryStat {
  category: string;
  total: number;
  dueCount: number;
  newCount: number;
  loopCount: number;
  waitCount: number;
  masteredCount: number;
}

export interface OverallStats {
  totalQuestions: number;
  dueTodayCount: number;
  newCount: number;
  todayAnsweredCount: number;
  learningCount?: number;
  waitCount?: number;
  masteredCount?: number;
}
