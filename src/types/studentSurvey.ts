export type PublicSurveyState = 'active' | 'closed' | 'not_found';

export interface PublicChoice {
  id: string;
  text: string;
  position: number;
}

export interface PublicQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  position: number;
  choices: PublicChoice[];
}

export interface ActivePublicSurvey {
  state: 'active';
  survey: {
    id: string;
    title: string;
    description: string | null;
  };
  questions: PublicQuestion[];
}

export type PublicSurveyResult = ActivePublicSurvey | { state: 'closed' } | { state: 'not_found' };

export type SubmissionErrorKind = 'duplicate' | 'closed' | 'invalid' | 'network' | 'unknown';
