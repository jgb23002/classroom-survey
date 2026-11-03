import type { SurveyStatus } from './survey';

export interface ResultChoice {
  id: string;
  text: string;
  position: number;
  count: number;
  percentage: number;
}

export interface QuestionResult {
  id: string;
  text: string;
  position: number;
  answeredCount: number;
  unansweredCount: number;
  choices: ResultChoice[];
}

export interface SurveyResults {
  survey: {
    id: string;
    title: string;
    description: string | null;
    status: SurveyStatus;
    publicSlug: string | null;
    createdAt: string;
  };
  responseCount: number;
  questions: QuestionResult[];
}

export interface SurveyExport {
  survey: {
    id: string;
    title: string;
    description: string | null;
    status: SurveyStatus;
    createdAt: string;
  };
  questions: Array<{ id: string; text: string; position: number }>;
  responses: Array<{
    id: string;
    submittedAt: string;
    answers: Array<{ questionId: string; answer: string }>;
  }>;
}
