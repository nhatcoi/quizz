export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: Date;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions?: Question[];
  questionCount?: number;
  submissionCount?: number;
  timeLimit?: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard' | 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  createdBy: string;
  creator?: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: Date;
  isPublished: boolean;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  answers: number[]; // array of selected option indices
  score: number;
  totalPoints: number;
  startedAt: Date;
  submittedAt: Date;
  timeSpent: number; // in seconds
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  quizId?: string;
  quizTitle?: string;
  message: string;
  type: 'question' | 'suggestion' | 'bug_report';
  createdAt: Date;
  isRead: boolean;
}

export interface QuizProgress {
  currentQuestion: number;
  answers: (number | null)[];
  timeRemaining?: number;
  startTime: Date;
} 