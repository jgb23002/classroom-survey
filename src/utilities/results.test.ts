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
  function parseCsv(csv: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    const source = csv.replace(/^\uFEFF/, '');
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted && character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) {
        row.push(cell);
        cell = '';
      } else if (character === '\r' && source[index + 1] === '\n' && !quoted) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        index += 1;
      } else cell += character;
    }
    return rows;
  }

  it('exports one row per response with Unicode, line breaks, quoting and formula safety', () => {
    const csv = createSurveyCsv({
      survey: {
        id: 'survey',
        title: '=Unsafe, "title" ✓',
        description: 'Line one\nLine two',
        status: 'closed',
        createdAt: '2026-11-03T00:00:00Z',
      },
      questions: [{ id: 'q1', text: 'Choice, "quoted"?', position: 1 }],
      responses: [
        {
          id: 'response',
          submittedAt: '2026-11-03T00:01:00Z',
          answers: [{ questionId: 'q1', answer: ' +Formula\n日本語' }],
        },
        {
          id: 'response-2',
          submittedAt: '2026-11-03T00:02:00Z',
          answers: [{ questionId: 'q1', answer: 'Normal, answer' }],
        },
      ],
    });
    const rows = parseCsv(csv);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain("'=Unsafe");
    expect(csv).toContain("' +Formula");
    expect(rows).toHaveLength(4);
    expect(rows[0]?.at(-1)).toBe('Q1: Choice, "quoted"?');
    expect(rows[2]?.at(-1)).toBe("' +Formula\n日本語");
    expect(rows[3]?.[6]).toBe('response-2');
    expect(csv).not.toContain('anonymous_token');
  });
});
