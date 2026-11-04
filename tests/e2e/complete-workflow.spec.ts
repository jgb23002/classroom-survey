import { expect, test, type Page } from '@playwright/test';

const surveyId = '10000000-0000-4000-8000-000000000140';
const responseId = '40000000-0000-4000-8000-000000000140';
const slug = 'phase14-public-slug';

interface SavedChoice {
  id: string;
  choice_text: string;
  position: number;
}

interface SavedQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  position: number;
  choices: SavedChoice[];
}

interface WorkflowState {
  title: string;
  description: string;
  status: 'draft' | 'active' | 'closed';
  updatedAt: string;
  questions: SavedQuestion[];
  answers: Array<{ question_id: string; choice_id: string }> | null;
}

function authResponse() {
  return {
    access_token: 'phase14-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'phase14-refresh-token',
    user: {
      id: '90000000-0000-4000-8000-000000000140',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'phase14-instructor@example.test',
      email_confirmed_at: '2026-11-03T00:00:00.000Z',
      app_metadata: { provider: 'email', providers: ['email'], role: 'instructor' },
      user_metadata: {},
      identities: [],
      created_at: '2026-11-03T00:00:00.000Z',
      updated_at: '2026-11-03T00:00:00.000Z',
    },
  };
}

function editorRecord(state: WorkflowState) {
  return {
    id: surveyId,
    title: state.title,
    description: state.description || null,
    status: state.status,
    updated_at: state.updatedAt,
    responses: [{ count: state.answers ? 1 : 0 }],
    questions: state.questions,
  };
}

function resultPayload(state: WorkflowState) {
  return {
    survey: {
      id: surveyId,
      title: state.title,
      description: state.description || null,
      status: state.status,
      public_slug: slug,
      created_at: '2026-11-03T12:00:00.000Z',
    },
    response_count: state.answers ? 1 : 0,
    questions: state.questions.map((question) => ({
      id: question.id,
      question_text: question.question_text,
      position: question.position,
      answered_count: state.answers?.some((answer) => answer.question_id === question.id) ? 1 : 0,
      unanswered_count:
        state.answers && !state.answers.some((answer) => answer.question_id === question.id)
          ? 1
          : 0,
      choices: question.choices.map((choice) => ({
        id: choice.id,
        choice_text: choice.choice_text,
        position: choice.position,
        count: state.answers?.some(
          (answer) => answer.question_id === question.id && answer.choice_id === choice.id,
        )
          ? 1
          : 0,
      })),
    })),
  };
}

async function installControlledBackend(page: Page, state: WorkflowState) {
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authResponse()),
    });
  });
  await page.route('**/auth/v1/logout*', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const operation = url.pathname.split('/').pop();
    const body = request.postDataJSON() as Record<string, unknown> | null;

    if (operation === 'save_survey') {
      state.title = String(body?.p_title ?? '');
      state.description = String(body?.p_description ?? '');
      state.questions = (body?.p_questions as SavedQuestion[]) ?? [];
      state.status = 'draft';
      state.updatedAt = new Date(Date.parse(state.updatedAt) + 1_000).toISOString();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: surveyId, status: 'draft', updated_at: state.updatedAt }),
      });
      return;
    }
    if (operation === 'activate_survey') {
      state.status = 'active';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: surveyId, status: 'active', public_slug: slug }),
      });
      return;
    }
    if (operation === 'close_survey') {
      state.status = 'closed';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: surveyId, status: 'closed' }),
      });
      return;
    }
    if (operation === 'get_public_survey') {
      const data =
        state.status === 'active'
          ? {
              state: 'active',
              survey: { id: surveyId, title: state.title, description: state.description },
              questions: state.questions,
            }
          : { state: 'closed' };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
      return;
    }
    if (operation === 'submit_survey_response') {
      if (state.status !== 'active') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'P0001', message: 'SURVEY_NOT_ACTIVE' }),
        });
      } else if (state.answers) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ code: '23505', message: 'DUPLICATE_RESPONSE' }),
        });
      } else {
        state.answers = (body?.p_answers as WorkflowState['answers']) ?? null;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, response_id: responseId }),
        });
      }
      return;
    }
    if (operation === 'get_survey_results') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(resultPayload(state)),
      });
      return;
    }
    if (operation === 'export_survey_responses') {
      const answers = (state.answers ?? []).map((answer) => {
        const question = state.questions.find((item) => item.id === answer.question_id);
        return {
          question_id: answer.question_id,
          answer:
            question?.choices.find((choice) => choice.id === answer.choice_id)?.choice_text ?? '',
        };
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          survey: {
            id: surveyId,
            title: state.title,
            description: state.description,
            status: state.status,
            created_at: '2026-11-03T12:00:00.000Z',
          },
          questions: state.questions,
          responses: state.answers
            ? [{ id: responseId, submitted_at: '2026-11-03T12:30:00.000Z', answers }]
            : [],
        }),
      });
      return;
    }
    if (operation === 'surveys' && request.method() === 'GET') {
      const select = url.searchParams.get('select') ?? '';
      if (select.includes('questions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/vnd.pgrst.object+json',
          body: JSON.stringify(editorRecord(state)),
        });
      } else if (select.startsWith('id,title,status')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/vnd.pgrst.object+json',
          body: JSON.stringify({
            id: surveyId,
            title: state.title,
            status: state.status,
            public_slug: state.status === 'draft' ? null : slug,
            responses: [{ count: state.answers ? 1 : 0 }],
          }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: `Unhandled controlled test operation: ${operation}` }),
    });
  });
}

test('complete instructor, student, results, closure and history workflow', async ({ page }) => {
  const state: WorkflowState = {
    title: '',
    description: '',
    status: 'draft',
    updatedAt: '2026-11-03T12:00:00.000Z',
    questions: [],
    answers: null,
  };
  await installControlledBackend(page, state);

  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('phase14-instructor@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');

  await page.getByRole('link', { name: 'New survey' }).first().click();
  await page.getByLabel('Survey title').fill('Phase 14 Concept Check');
  await page.getByLabel('Description').fill('Initial draft');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Question text').fill('Which item stops recursion?');
  await page.getByLabel('Choice 1').fill('A base case');
  await page.getByLabel('Choice 2').fill('A pointer');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page).toHaveURL(`/surveys/${surveyId}/edit`);

  await page.getByLabel('Description').fill('Edited draft');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Question text').nth(1).fill('Recursion needs a stopping condition.');
  await page.getByLabel('Question type').nth(1).selectOption('true_false');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('Draft saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Save and activate' }).click();
  await expect(page).toHaveURL(`/surveys/${surveyId}/present`);
  await expect(page.getByText('active', { exact: true })).toBeVisible();

  await page.goto(`/s/${slug}`);
  await page.getByLabel('A base case').check();
  await page.getByLabel('True', { exact: true }).check();
  await page.getByRole('button', { name: 'Submit response' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();

  await page.evaluate((publicSlug) => {
    localStorage.removeItem(`classroom-survey:submitted:${publicSlug}`);
  }, slug);
  await page.goto(`/s/${slug}`);
  await page.getByLabel('A base case').check();
  await page.getByLabel('True', { exact: true }).check();
  await page.getByRole('button', { name: 'Submit response' }).click();
  await expect(page.getByRole('heading', { name: 'Already submitted' })).toBeVisible();

  await page.goto(`/surveys/${surveyId}/results`);
  await expect(page.getByText('1', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'A base case' })).toContainText(
    '1 · 100.0%',
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('phase-14-concept-check-results.csv');

  await page.goto(`/surveys/${surveyId}/present`);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Close survey' }).click();
  await expect(page.getByText('closed', { exact: true })).toBeVisible();

  await page.evaluate((publicSlug) => {
    localStorage.removeItem(`classroom-survey:submitted:${publicSlug}`);
  }, slug);
  await page.goto(`/s/${slug}`);
  await expect(page.getByRole('heading', { name: 'Survey closed' })).toBeVisible();

  await page.goto(`/surveys/${surveyId}/results`);
  await expect(page.getByText('closed', { exact: true })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'A base case' })).toContainText(
    '1 · 100.0%',
  );
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(
    /\/login(?:\?returnTo=%2Fsurveys%2F10000000-0000-4000-8000-000000000140%2Fresults)?$/,
  );
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fdashboard$/);
});
