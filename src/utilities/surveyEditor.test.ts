import { describe, expect, it } from 'vitest';
import type { SurveyEditorValue } from '../types/surveyEditor';
import { choicesForType, moveItem, validateSurveyEditor } from './surveyEditor';

const value: SurveyEditorValue = {
  title: 'Concept check',
  description: '',
  questions: [
    {
      id: 'q1',
      text: 'Pick one',
      type: 'multiple_choice',
      choices: [
        { id: 'c1', text: 'A' },
        { id: 'c2', text: 'B' },
      ],
    },
  ],
};

describe('survey editor validation and ordering', () => {
  it('requires a title and at least one question only for activation', () => {
    expect(validateSurveyEditor({ title: '', description: '', questions: [] }, 'draft')).toEqual({
      title: 'Enter a survey title.',
    });
    expect(
      validateSurveyEditor({ title: 'Draft', description: '', questions: [] }, 'activate'),
    ).toEqual({
      questions: 'Add at least one question before activation.',
    });
  });

  it('rejects empty and duplicate choices', () => {
    const invalid = structuredClone(value);
    invalid.questions[0]!.choices = [
      { id: 'c1', text: 'Same' },
      { id: 'c2', text: ' same ' },
      { id: 'c3', text: '' },
    ];
    const errors = validateSurveyEditor(invalid, 'draft');
    expect(errors['choice:c2']).toContain('unique');
    expect(errors['choice:c3']).toContain('empty');
  });

  it('requires two multiple-choice options for activation but permits an incomplete draft', () => {
    const incomplete = structuredClone(value);
    incomplete.questions[0]!.choices = [{ id: 'c1', text: 'Only choice' }];
    expect(validateSurveyEditor(incomplete, 'draft')).toEqual({});
    expect(validateSurveyEditor(incomplete, 'activate')['choices:q1']).toContain('two');
  });

  it('normalizes true/false choices and preserves stable IDs while reordering', () => {
    const question = value.questions[0]!;
    const choices = choicesForType(question, 'true_false');
    expect(choices.map(({ text }) => text)).toEqual(['True', 'False']);
    const moved = moveItem(question.choices, 0, 1);
    expect(moved.map(({ id }) => id)).toEqual(['c2', 'c1']);
  });
});
