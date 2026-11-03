import type { SurveyStatus } from './survey';

export interface PresentationSurvey {
  id: string;
  title: string;
  status: SurveyStatus;
  publicSlug: string | null;
  responseCount: number;
}

export interface ActivatedSurvey {
  id: string;
  status: 'active';
  publicSlug: string;
}
