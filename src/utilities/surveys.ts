import type { SurveyStatusFilter, SurveySummary } from '../types/survey';

export function filterSurveys(
  surveys: SurveySummary[],
  search: string,
  status: SurveyStatusFilter,
) {
  const query = search.trim().toLocaleLowerCase();
  return surveys.filter(
    (survey) =>
      (status === 'all' || survey.status === status) &&
      (!query || survey.title.toLocaleLowerCase().includes(query)),
  );
}

export function formatSurveyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
