import type { SurveyStatus } from './survey';

export type QuestionType = 'multiple_choice' | 'true_false';

export interface EditorChoice {
  id: string;
  text: string;
}

export interface EditorQuestion {
  id: string;
  text: string;
  type: QuestionType;
  choices: EditorChoice[];
}

export interface SurveyEditorValue {
  title: string;
  description: string;
  questions: EditorQuestion[];
}

export interface LoadedSurveyEditor {
  id: string;
  status: SurveyStatus;
  updatedAt: string;
  responseCount: number;
  value: SurveyEditorValue;
}

export type SurveyEditorErrors = Record<string, string>;

export interface SavedSurvey {
  id: string;
  status: 'draft';
  updatedAt: string;
}
