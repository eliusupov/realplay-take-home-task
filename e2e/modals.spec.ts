import { expect, test } from '@playwright/test';
import {
  registerAndReadAttribution,
  signInWithSessionCookie,
  submitRegistration,
  trackRegisterRequests,
} from './helpers';

test('a modal link survives registration: attribution is sent, then modals open in link order', async ({
  page,
}) => {
  await page.goto('/account?utm_source=x&promo=SPRING&welcome=1#h');
  await expect(page).toHaveURL('/register?utm_source=x&promo=SPRING&welcome=1');
  await expect(page.getByRole('dialog')).toBeHidden();

  expect(await registerAndReadAttribution(page)).toMatchObject({
    params: { utm_source: 'x' },
  });
  await expect(page).toHaveURL(
    '/account?utm_source=x&promo=SPRING&welcome=1#h',
  );
  const promo = page.getByRole('dialog', { name: 'Promo code' });
  await expect(promo).toContainText('SPRING');
  await promo.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL('/account?utm_source=x&welcome=1#h');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/account?utm_source=x#h');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('signup=1 shows the Registration modal when signed in and redirects to registration when signed out', async ({
  page,
  context,
  baseURL,
}) => {
  const requests = trackRegisterRequests(page);
  await page.goto('/?signup=1');
  await expect(page).toHaveURL('/register?signup=1');
  await expect(page.getByRole('dialog')).toBeHidden();

  await signInWithSessionCookie(context, baseURL);
  await page.goto('/?signup=1');
  const registration = page.getByRole('dialog', { name: 'Registration' });
  await expect(registration).toContainText('registered and signed in');
  await expect(registration.getByRole('button')).toHaveText(['Close']);
  await expect(registration.getByRole('textbox')).toHaveCount(0);
  expect(requests).toHaveLength(0);
});

test('refresh, history and in-app navigation follow the current URL', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithSessionCookie(context, baseURL);
  await page.goto('/?promo=A&welcome=1');
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/?welcome=1');
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();

  await page
    .getByRole('link', { name: /Account/, includeHidden: true })
    .dispatchEvent('click');
  await expect(page).toHaveURL('/account?welcome=1');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.goBack();
  await expect(page).toHaveURL('/?welcome=1');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('logout closes every modal; the link keeps them pending until signing up again', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithSessionCookie(context, baseURL);
  await page.goto('/account?promo=A&welcome=1');
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toBeVisible();

  await page
    .getByRole('button', { name: 'Log out', includeHidden: true })
    .dispatchEvent('click');

  await expect(page).toHaveURL('/register?promo=A&welcome=1');
  await expect(page.getByRole('dialog')).toBeHidden();
  await submitRegistration(page, 'grace@example.com', 'correct horse');
  await expect(page).toHaveURL('/?promo=A&welcome=1');
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: /Account/ })).toBeVisible();
});
