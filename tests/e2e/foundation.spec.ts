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
