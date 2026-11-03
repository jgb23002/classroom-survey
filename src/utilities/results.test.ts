import { describe, expect, it } from 'vitest';
import { createSurveyCsv, formatResultPercentage, resultPercentage } from './results';

describe('result calculations', () => {
  it('calculates counts against the per-question answered denominator', () => {
    expect(resultPercentage(2, 3)).toBe(66.7);
    expect(formatResultPercentage(resultPercentage(2, 3))).toBe('66.7%');
  });

  it('returns zero for zero responses without NaN or Infinity', () => {
    expect(resultPercentage(0, 0)).toBe(0);
    expect(formatResultPercentage(resultPercentage(0, 0))).toBe('0.0%');
  });

  it('uses answered rather than total submissions for incomplete historical data', () => {
    const totalResponses = 5;
    const answered = 3;
    expect(totalResponses - answered).toBe(2);
    expect(resultPercentage(1, answered)).toBe(33.3);
  });

  it('rounds to one decimal place', () => {
    expect(resultPercentage(1, 6)).toBe(16.7);
    expect(resultPercentage(5, 6)).toBe(83.3);
  });
});

describe('results CSV', () => {
  it('exports metadata and responses without tokens and escapes formulas', () => {
    const csv = createSurveyCsv({
      survey: {
        id: 'survey',
        title: '=Unsafe, "title"',
        description: null,
        status: 'closed',
        createdAt: '2026-11-03T00:00:00Z',
      },
      questions: [{ id: 'q1', text: 'Choice?', position: 1 }],
      responses: [
        {
          id: 'response',
          submittedAt: '2026-11-03T00:01:00Z',
          answers: [{ questionId: 'q1', answer: '+Formula' }],
        },
      ],
    });
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain("'=Unsafe");
    expect(csv).toContain("'+Formula");
    expect(csv).not.toContain('anonymous_token');
  });
});
