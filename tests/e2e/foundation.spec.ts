import { expect, test } from '@playwright/test';

test('home supports keyboard access and navigation to the disabled login shell', async ({
  page,
}) => {
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
  await expect(page.getByLabel('Email', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('Password', { exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('Instructor sign-in is being prepared');
});

const routes = [
  ['/dashboard', 'Dashboard'],
  ['/surveys/new', 'New survey'],
  ['/surveys/test-id/edit', 'Edit survey'],
  ['/surveys/test-id/present', 'Present survey'],
  ['/surveys/test-id/results', 'Survey results'],
] as const;

for (const [path, title] of routes) {
  test(`direct load and refresh of ${path} render an honest placeholder without backend calls`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const backendRequests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4173')
        backendRequests.push(request.url());
    });
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByText('Survey actions are not available yet.')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
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
