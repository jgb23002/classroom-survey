export const surveyStatuses = ['draft', 'active', 'closed', 'archived'] as const;

export type SurveyStatus = (typeof surveyStatuses)[number];
export type SurveyStatusFilter = 'all' | SurveyStatus;

export interface SurveySummary {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
  responseCount: number;
}

export function isSurveyStatus(value: unknown): value is SurveyStatus {
  return typeof value === 'string' && surveyStatuses.includes(value as SurveyStatus);
}
