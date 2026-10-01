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

test('modals follow link order, and closing one removes only its key', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithSessionCookie(context, baseURL);
  await page.goto(
    '/?other=1&welcome=1&utm_medium=m&invite=friend%207&promo=SPRING24#top',
  );

  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
  await expect(page).toHaveURL(
    '/?other=1&welcome=1&utm_medium=m&invite=friend%207&promo=SPRING24#top',
  );
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page).toHaveURL(
    '/?other=1&utm_medium=m&invite=friend+7&promo=SPRING24#top',
  );
  await expect(page.getByRole('dialog', { name: 'Invitation' })).toContainText(
    'friend 7',
  );
  const backdropCorner = { x: 5, y: 5 };
  await page.mouse.click(backdropCorner.x, backdropCorner.y);

  await expect(page).toHaveURL('/?other=1&utm_medium=m&promo=SPRING24#top');
  await expect(page.getByRole('dialog', { name: 'Promo code' })).toContainText(
    'SPRING24',
  );
  await page.keyboard.press('Escape');

  await expect(page).toHaveURL('/?other=1&utm_medium=m#top');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a repeated key opens one modal with its first value, and closing removes every occurrence', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithSessionCookie(context, baseURL);
  await page.goto('/?promo=FIRSTVAL&welcome=1&promo=SECONDVAL');

  const promo = page.getByRole('dialog', { name: 'Promo code' });
  await expect(promo).toContainText('FIRSTVAL');
  await expect(promo).not.toContainText('SECONDVAL');
  await page.keyboard.press('Escape');

  await expect(page).toHaveURL('/?welcome=1');
  await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
});

test('invalid modal values are ignored and stay in the URL', async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto('/?welcome=2&promo=&Welcome=1&invite=');
  await expect(page).toHaveURL('/?welcome=2&promo=&Welcome=1&invite=');

  await signInWithSessionCookie(context, baseURL);
  await page.goto('/?welcome=2&promo=&signup=1&Welcome=1');
  await expect(
    page.getByRole('dialog', { name: 'Registration' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(page).toHaveURL('/?welcome=2&promo=&Welcome=1');
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

test('modals are labelled by their title and keep keyboard focus through the sequence', async ({
  page,
  context,
  baseURL,
}) => {
  await signInWithSessionCookie(context, baseURL);
  await page.goto('/?welcome=1&invite=F7');

  const welcome = page.getByRole('dialog', { name: 'Welcome' });
  await expect(welcome).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(welcome.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(welcome.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Enter');

  const invite = page.getByRole('dialog', { name: 'Invitation' });
  await expect(invite).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Realplay' })).toBeFocused();
});
