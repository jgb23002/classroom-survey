import { expect, test } from '@playwright/test';

test('home supports keyboard access and navigation to login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'A clearer picture of your classroom.',
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('link', { name: 'Instructor login', exact: true }).first().click();
  await expect(page).toHaveURL('/login');
  await expect(page).toHaveTitle('Instructor login | Classroom Survey');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page.getByLabel('Email', { exact: true })).toBeEnabled();
  await expect(page.getByLabel('Password', { exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeEnabled();
  await expect(page.getByText('Instructor sign-in is being prepared')).toHaveCount(0);
});

function authResponse(role: string) {
  return {
    access_token: 'synthetic-browser-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'synthetic-browser-refresh-token',
    user: {
      id: '90000000-0000-4000-8000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: `${role}@example.test`,
      email_confirmed_at: '2026-11-03T00:00:00.000Z',
      app_metadata: { provider: 'email', providers: ['email'], role },
      user_metadata: {},
      identities: [],
      created_at: '2026-11-03T00:00:00.000Z',
      updated_at: '2026-11-03T00:00:00.000Z',
    },
  };
}

test('authorized instructor login reaches the protected dashboard', async ({ page }) => {
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authResponse('instructor')),
    });
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('instructor@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Signed in as instructor@example.test')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Signed in as instructor@example.test')).toBeVisible();

  await page.route('**/auth/v1/logout*', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login(?:\?returnTo=%2Fdashboard)?$/);
});

test('password reset requests use the application callback', async ({ page }) => {
  let redirectTarget = '';
  await page.route('**/auth/v1/recover*', async (route) => {
    redirectTarget = new URL(route.request().url()).searchParams.get('redirect_to') ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('instructor@example.test');
  await page.getByRole('button', { name: 'Forgot your password?' }).click();
  await expect(page.getByRole('status')).toContainText('password reset link has been sent');
  expect(redirectTarget).toBe('http://127.0.0.1:4173/auth/callback?next=/reset-password');
});

test('ordinary authenticated user cannot enter instructor routes', async ({ page }) => {
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authResponse('student')),
    });
  });
  await page.route('**/auth/v1/logout*', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('alert')).toContainText('not authorized as an instructor');
});

const dashboardRows = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: 'Recursion Concept Check',
    description: 'A quick check before class ends',
    status: 'draft',
    public_slug: null,
    created_at: '2026-11-03T14:00:00.000Z',
    updated_at: '2026-11-03T14:00:00.000Z',
    responses: [{ count: 0 }],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    title: 'Active Pointer Poll',
    description: null,
    status: 'active',
    public_slug: 'active-pointer-poll',
    created_at: '2026-11-02T14:00:00.000Z',
    updated_at: '2026-11-02T14:00:00.000Z',
    responses: [{ count: 3 }],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    title: 'Closed Arrays Review',
    description: 'Historical results',
    status: 'closed',
    public_slug: 'closed-arrays-review',
    created_at: '2026-11-01T14:00:00.000Z',
    updated_at: '2026-11-01T14:00:00.000Z',
    responses: [{ count: 12 }],
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    title: 'Archived Graphs Check',
    description: 'Stored for reference',
    status: 'archived',
    public_slug: 'archived-graphs-check',
    created_at: '2026-10-31T14:00:00.000Z',
    updated_at: '2026-10-31T14:00:00.000Z',
    responses: [{ count: 7 }],
  },
];

async function openAuthenticatedDashboard(page: import('@playwright/test').Page) {
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authResponse('instructor')),
    });
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('instructor@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
}

test('dashboard renders real response shapes and filters by title and status', async ({ page }) => {
  await page.route('**/rest/v1/surveys*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dashboardRows),
    });
  });
  await openAuthenticatedDashboard(page);

  await expect(page.getByRole('heading', { name: 'Recursion Concept Check' })).toBeVisible();
  await expect(page.getByText('draft', { exact: true })).toBeVisible();
  await expect(page.getByText('active', { exact: true })).toBeVisible();
  await expect(page.getByText('closed', { exact: true })).toBeVisible();
  await expect(page.getByText('archived', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'New survey' }).first()).toBeVisible();

  await page.getByLabel('Search by title').fill('ARRAYS');
  await expect(page.getByRole('heading', { name: 'Closed Arrays Review' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recursion Concept Check' })).toHaveCount(0);
  await page.getByLabel('Status').selectOption('draft');
  await expect(page.getByRole('heading', { name: 'No matching surveys' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(page.getByRole('heading', { name: 'Recursion Concept Check' })).toBeVisible();

  const activeActions = page.getByLabel('Actions for Active Pointer Poll');
  await expect(activeActions.getByRole('button', { name: 'Close' })).toBeVisible();
  await expect(activeActions.getByRole('link', { name: 'Present QR' })).toBeVisible();
  await expect(activeActions.getByRole('link', { name: 'View results' })).toBeVisible();
  await expect(activeActions.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  const closedActions = page.getByLabel('Actions for Closed Arrays Review');
  await expect(closedActions.getByRole('link', { name: 'Edit' })).toHaveCount(0);
  await expect(closedActions.getByRole('button', { name: 'Archive' })).toBeVisible();
});

test('dashboard confirms close and refreshes after the RPC mutation', async ({ page }) => {
  let listRequests = 0;
  let closeRequests = 0;
  await page.route('**/rest/v1/surveys*', async (route) => {
    listRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dashboardRows),
    });
  });
  await page.route('**/rest/v1/rpc/close_survey', async (route) => {
    closeRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Students will no longer be able to submit');
    await dialog.accept();
  });
  await openAuthenticatedDashboard(page);
  await page
    .getByLabel('Actions for Active Pointer Poll')
    .getByRole('button', { name: 'Close' })
    .click();
  await expect.poll(() => closeRequests).toBe(1);
  await expect.poll(() => listRequests).toBeGreaterThan(1);
});

test('dashboard shows loading, error retry, and empty states', async ({ page }) => {
  let requests = 0;
  await page.route('**/rest/v1/surveys*', async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (requests === 1) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"message":"synthetic"}',
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
  });
  await openAuthenticatedDashboard(page);
  await expect(page.getByRole('alert')).toContainText('Dashboard unavailable');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'No surveys yet' })).toBeVisible();
});

async function signInThenOpen(page: import('@playwright/test').Page, path: string) {
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authResponse('instructor')),
    });
  });
  await page.route('**/rest/v1/surveys*', async (route) => {
    if (route.request().url().includes('public_slug')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      await route.fallback();
    }
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('instructor@example.test');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.goto(path);
}

test('survey editor validates activation and maintains true/false choices', async ({ page }) => {
  await signInThenOpen(page, '/surveys/new');
  await page.getByRole('button', { name: 'Save and activate' }).click();
  await expect(page.getByText('Enter a survey title.')).toBeVisible();
  await expect(page.getByText('Add at least one question before activation.')).toBeVisible();

  await page.getByLabel('Survey title').fill('Recursion check');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Question text').fill('Is a base case required?');
  await page.getByLabel('Question type').selectOption('true_false');
  await expect(page.getByLabel('Choice 1')).toHaveValue('True');
  await expect(page.getByLabel('Choice 2')).toHaveValue('False');
  await expect(page.getByLabel('Choice 1')).toHaveAttribute('readonly', '');
});

test('survey editor sends one ordered atomic save payload and reloads the draft', async ({
  page,
}) => {
  const surveyId = '10000000-0000-4000-8000-000000000050';
  let saveBody: Record<string, unknown> | undefined;
  await page.route('**/rest/v1/rpc/save_survey', async (route) => {
    saveBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: surveyId,
        status: 'draft',
        updated_at: '2026-11-03T20:00:00.000Z',
      }),
    });
  });
  await page.route(
    '**/rest/v1/surveys?select=id%2Ctitle%2Cdescription%2Cstatus%2Cupdated_at*',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.pgrst.object+json',
        body: JSON.stringify({
          id: surveyId,
          title: 'Ordered choices',
          description: null,
          status: 'draft',
          updated_at: '2026-11-03T20:00:00.000Z',
          responses: [{ count: 0 }],
          questions: [],
        }),
      });
    },
  );
  await signInThenOpen(page, '/surveys/new');
  await page.getByLabel('Survey title').fill('  Ordered choices  ');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Question text').fill('Pick one');
  await page.getByLabel('Choice 1').fill('First');
  await page.getByLabel('Choice 2').fill('Second');
  await page.getByRole('button', { name: 'Down', exact: true }).first().click();
  await page.getByRole('button', { name: 'Save draft' }).click();

  await expect(page).toHaveURL(`/surveys/${surveyId}/edit`);
  expect(saveBody?.p_title).toBe('Ordered choices');
  const questions = saveBody?.p_questions as Array<{
    position: number;
    choices: Array<{ choice_text: string; position: number }>;
  }>;
  expect(questions[0]?.position).toBe(1);
  expect(questions[0]?.choices).toEqual([
    expect.objectContaining({ choice_text: 'Second', position: 1 }),
    expect.objectContaining({ choice_text: 'First', position: 2 }),
  ]);
});

test('survey editor warns before discarding edits and locks active surveys', async ({ page }) => {
  await signInThenOpen(page, '/surveys/new');
  await page.getByLabel('Survey title').fill('Unsaved title');
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Discard your unsaved');
    await dialog.dismiss();
  });
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL('/surveys/new');

  await page.route(
    '**/rest/v1/surveys?select=id%2Ctitle%2Cdescription%2Cstatus%2Cupdated_at*',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.pgrst.object+json',
        body: JSON.stringify({
          id: '10000000-0000-4000-8000-000000000060',
          title: 'Active locked survey',
          description: null,
          status: 'active',
          updated_at: '2026-11-03T20:00:00.000Z',
          responses: [{ count: 0 }],
          questions: [],
        }),
      });
    },
  );
  await page.goto('/surveys/10000000-0000-4000-8000-000000000060/edit');
  await expect(page.getByRole('heading', { name: 'Survey editing is locked' })).toBeVisible();
  await expect(page.getByText('Close this active survey before editing it.')).toBeVisible();
});

test('presentation generates the production URL QR, copies, downloads PNG, and closes', async ({
  page,
  context,
}) => {
  const surveyId = '10000000-0000-4000-8000-000000000070';
  let status = 'active';
  let closeRequests = 0;
  await page.route('**/rest/v1/surveys*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: route.request().url().includes('select=id%2Ctitle%2Cstatus')
        ? 'application/vnd.pgrst.object+json'
        : 'application/json',
      body: route.request().url().includes('select=id%2Ctitle%2Cstatus')
        ? JSON.stringify({
            id: surveyId,
            title: 'Recursion Concept Check',
            status,
            public_slug: '8f3ab241be99f212f4ac9870',
            responses: [{ count: 42 }],
          })
        : JSON.stringify(dashboardRows),
    });
  });
  await page.route('**/rest/v1/rpc/close_survey', async (route) => {
    closeRequests += 1;
    status = 'closed';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: surveyId, status: 'closed' }),
    });
  });
  await openAuthenticatedDashboard(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4173',
  });
  await page.goto(`/surveys/${surveyId}/present`);

  await expect(page.getByRole('heading', { name: 'Recursion Concept Check' })).toBeVisible();
  await expect(page.getByText('42', { exact: true })).toBeVisible();
  const expectedUrl = `http://127.0.0.1:4173/s/8f3ab241be99f212f4ac9870`;
  await expect(page.getByRole('link', { name: expectedUrl })).toHaveAttribute('href', expectedUrl);
  const qr = page.getByRole('img', { name: 'QR code for Recursion Concept Check' });
  await expect(qr).toHaveAttribute('src', /^data:image\/png;base64,/);
  await expect(page.getByText('local URL is for development only')).toBeVisible();

  await page.getByRole('button', { name: 'Copy URL' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedUrl);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download QR PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('recursion-concept-check-qr.png');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('New student submissions will be rejected immediately');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Close survey' }).click();
  await expect.poll(() => closeRequests).toBe(1);
  await expect(page.getByText('closed', { exact: true })).toBeVisible();
  await expect(page.getByText('New submissions are no longer accepted.')).toBeVisible();
});

const routes = [
  ['/dashboard', 'Dashboard'],
  ['/surveys/new', 'New survey'],
  ['/surveys/test-id/edit', 'Edit survey'],
  ['/surveys/test-id/present', 'Present survey'],
  ['/surveys/test-id/results', 'Survey results'],
] as const;

for (const [path] of routes) {
  test(`direct load of protected route ${path} redirects to login`, async ({ page }) => {
    const errors: string[] = [];
    const backendRequests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4173')
        backendRequests.push(request.url());
    });
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?returnTo=${encodeURIComponent(path)}`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Instructor login');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Instructor login');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
    expect(backendRequests).toEqual([]);
  });
}

test('student route has no instructor navigation or pretend submission controls', async ({
  page,
}) => {
  await page.goto('/s/test-slug');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Survey access is being prepared',
  );
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /login|dashboard/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /submit/i })).toHaveCount(0);
  await expect(page.getByRole('main')).toContainText('You won’t need an account');
});

test('landing styles compile, respect the viewport, and unknown routes show a 404 page', async ({
  page,
}) => {
  await page.goto('/');
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(247, 248, 245)');
  expect(
    await page
      .locator('body')
      .evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  const login = page.getByRole('link', { name: 'Instructor login', exact: true }).first();
  expect((await login.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page isn’t here.');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL('/');
});
