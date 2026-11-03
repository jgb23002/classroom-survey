import { describe, expect, it } from 'vitest';
import type { SurveySummary } from '../types/survey';
import { filterSurveys, formatSurveyDate } from './surveys';

const surveys: SurveySummary[] = [
  {
    id: '1',
    title: 'Recursion Concept Check',
    description: null,
    status: 'draft',
    publicSlug: null,
    createdAt: '2026-08-17T12:00:00Z',
    updatedAt: '2026-08-17T12:00:00Z',
    responseCount: 0,
  },
  {
    id: '2',
    title: 'Pointer Review',
    description: null,
    status: 'closed',
    publicSlug: 'pointer-review',
    createdAt: '2026-08-18T12:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z',
    responseCount: 10,
  },
];

describe('dashboard survey utilities', () => {
  it('matches titles case-insensitively and trims the search', () => {
    expect(filterSurveys(surveys, '  RECURSION ', 'all').map(({ id }) => id)).toEqual(['1']);
  });

  it('combines title search and status filtering', () => {
    expect(filterSurveys(surveys, 'review', 'closed').map(({ id }) => id)).toEqual(['2']);
    expect(filterSurveys(surveys, 'review', 'draft')).toEqual([]);
  });

  it('filters created dates inclusively and combines them with title', () => {
    expect(filterSurveys(surveys, 'review', 'all', '2026-08-18', '2026-08-18')).toEqual([
      surveys[1],
    ]);
    expect(filterSurveys(surveys, '', 'all', '2026-08-19', '')).toEqual([]);
  });

  it('returns a safe fallback for invalid dates', () => {
    expect(formatSurveyDate('not-a-date')).toBe('Unknown date');
  });
});
