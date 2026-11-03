import type {
  EditorChoice,
  EditorQuestion,
  QuestionType,
  SurveyEditorErrors,
  SurveyEditorValue,
} from '../types/surveyEditor';

export function createChoice(text = ''): EditorChoice {
  return { id: crypto.randomUUID(), text };
}

export function createQuestion(type: QuestionType = 'multiple_choice'): EditorQuestion {
  return {
    id: crypto.randomUUID(),
    text: '',
    type,
    choices:
      type === 'true_false'
        ? [createChoice('True'), createChoice('False')]
        : [createChoice(), createChoice()],
  };
}

export function choicesForType(question: EditorQuestion, type: QuestionType): EditorChoice[] {
  if (type === question.type) return question.choices;
  return type === 'true_false'
    ? [createChoice('True'), createChoice('False')]
    : [createChoice(), createChoice()];
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const result = [...items];
  [result[index], result[target]] = [result[target] as T, result[index] as T];
  return result;
}

export function validateSurveyEditor(
  value: SurveyEditorValue,
  mode: 'draft' | 'activate',
): SurveyEditorErrors {
  const errors: SurveyEditorErrors = {};
  if (!value.title.trim()) errors.title = 'Enter a survey title.';
  if (mode === 'activate' && value.questions.length === 0) {
    errors.questions = 'Add at least one question before activation.';
  }

  value.questions.forEach((question, questionIndex) => {
    if (!question.text.trim()) {
      errors[`question:${question.id}`] = `Enter text for question ${questionIndex + 1}.`;
    }
    if (question.type === 'true_false') {
      const labels = question.choices.map((choice) => choice.text.trim().toLocaleLowerCase());
      if (question.choices.length !== 2 || !labels.includes('true') || !labels.includes('false')) {
        errors[`choices:${question.id}`] =
          'True/False questions must contain exactly True and False.';
      }
    }
    if (mode === 'activate' && question.type === 'multiple_choice' && question.choices.length < 2) {
      errors[`choices:${question.id}`] = 'Add at least two choices before activation.';
    }

    const seen = new Set<string>();
    question.choices.forEach((choice) => {
      const normalized = choice.text.trim().toLocaleLowerCase();
      if (!normalized) {
        errors[`choice:${choice.id}`] = 'Choice text cannot be empty.';
      } else if (seen.has(normalized)) {
        errors[`choice:${choice.id}`] = 'Choices must be unique within a question.';
      } else {
        seen.add(normalized);
      }
    });
  });
  return errors;
}

export function serializeEditor(value: SurveyEditorValue) {
  return JSON.stringify(value);
}

export function normalizeEditorValue(value: SurveyEditorValue): SurveyEditorValue {
  return {
    title: value.title.trim(),
    description: value.description.trim(),
    questions: value.questions.map((question) => ({
      ...question,
      text: question.text.trim(),
      choices: question.choices.map((choice) => ({ ...choice, text: choice.text.trim() })),
    })),
  };
}
