import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('RequireSessionForModals', () => {
  it.each(['?welcome=1', '?promo=SPRING', '?invite=friend-7', '?signup=1'])(
    'redirects a signed-out visit with %s to registration',
    (search) => {
      const { router } = renderWithProviders({ url: `/${search}` });

      expect(
        screen.getByRole('heading', { name: 'Create an account' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/register');
    },
  );

  it('lets a signed-out visit through when no trigger is valid', () => {
    const { router } = renderWithProviders({
      url: '/?welcome=2&signup=yes&promo=&utm_source=ad',
    });

    expect(router.state.location.pathname).toBe('/');
  });
});
