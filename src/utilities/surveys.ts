import type { SurveyStatusFilter, SurveySummary } from '../types/survey';

export function filterSurveys(
  surveys: SurveySummary[],
  search: string,
  status: SurveyStatusFilter,
  createdFrom = '',
  createdTo = '',
) {
  const query = search.trim().toLocaleLowerCase();
  return surveys.filter((survey) => {
    const createdDate = localCalendarDate(survey.createdAt);
    return (
      (status === 'all' || survey.status === status) &&
      (!query || survey.title.toLocaleLowerCase().includes(query)) &&
      (!createdFrom || (createdDate !== null && createdDate >= createdFrom)) &&
      (!createdTo || (createdDate !== null && createdDate <= createdTo))
    );
  });
}

function localCalendarDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
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
