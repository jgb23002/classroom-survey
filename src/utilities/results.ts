import type { SurveyExport } from '../types/results';

export function resultPercentage(count: number, answeredCount: number): number {
  if (answeredCount <= 0) return 0;
  return Math.round((count / answeredCount) * 1000) / 10;
}

export function formatResultPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function spreadsheetSafe(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number): string {
  const safe = spreadsheetSafe(String(value));
  return `"${safe.replaceAll('"', '""')}"`;
}

export function createSurveyCsv(data: SurveyExport): string {
  const questions = [...data.questions].sort((a, b) => a.position - b.position);
  const header = [
    'row_type',
    'survey_id',
    'survey_title',
    'survey_description',
    'survey_status',
    'survey_created_at',
    'response_id',
    'submitted_at',
    ...questions.map((question, index) => `Q${index + 1}: ${question.text}`),
  ];
  const metadata = [
    'survey_metadata',
    data.survey.id,
    data.survey.title,
    data.survey.description ?? '',
    data.survey.status,
    data.survey.createdAt,
    '',
    '',
    ...questions.map(() => ''),
  ];
  const rows = data.responses.map((response) => {
    const answers = new Map(response.answers.map((answer) => [answer.questionId, answer.answer]));
    return [
      'response',
      data.survey.id,
      data.survey.title,
      data.survey.description ?? '',
      data.survey.status,
      data.survey.createdAt,
      response.id,
      response.submittedAt,
      ...questions.map((question) => answers.get(question.id) ?? ''),
    ];
  });
  return `\uFEFF${[header, metadata, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function resultsFilename(title: string): string {
  const stem = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${stem || 'survey'}-results.csv`;
}
