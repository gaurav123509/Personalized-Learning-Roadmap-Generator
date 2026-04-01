export interface UserInput {
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  hours: number;
  months: number;
  resources: string;
  language: 'English' | 'Hinglish' | 'Hindi';
  budget: 'free' | 'low' | 'medium' | 'high';
  // Optional features
  enableMockTest?: boolean;
  questionsCount?: number;
  enableProjectTasks?: boolean;
  projectComplexity?: 'simple' | 'moderate' | 'complex';
}

export interface Resource {
  type: 'video' | 'article' | 'course';
  title: string;
  url: string;
}

export interface Week {
  week: number;
  topics: string[];
  resources: Resource[];
  project: string;
  estimated_hours: number;
  milestone: string;
}

export interface Phase {
  phase: string;
  focus: string;
  weeks: Week[];
}

export interface Roadmap {
  title: string;
  overview: string;
  total_weeks: number;
  phases: Phase[];
  tips: string[];
  motivation: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

export interface ChatResponse {
  reply: string;
}

export type QuestionType = 'mcq' | 'short' | 'code';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  choices?: string[]; // for mcq
  answer?: string; // canonical answer
  points?: number;
}

export interface MockTest {
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  totalPoints?: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  milestone: string;
  estimated_hours?: number;
  done?: boolean;
}

export interface ProjectTasks {
  subject: string;
  tasks: ProjectTask[];
}

export interface Flashcard {
  id: string;
  front: string; // Question
  back: string; // Answer
}

export interface FlashcardSet {
  id: string;
  topic: string;
  cards: Flashcard[];
  createdAt: number;
}

export interface FlashcardReview {
  subject: string;
  cards: Flashcard[];
}

export type InterviewRound = 'hr' | 'technical';

export interface InterviewQuestion {
  id: string;
  round: InterviewRound;
  question: string;
  expected_points: string[];
}

export interface InterviewQuestionPack {
  subject: string;
  round: InterviewRound;
  questions: InterviewQuestion[];
}

export interface InterviewFeedback {
  score: number; // 1-10
  feedback: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}
