import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('RequireSession', () => {
  it('redirects a signed-out visit to registration', () => {
    const { router } = renderWithProviders({
      url: '/account?tab=profile#details',
    });

    expect(
      screen.getByRole('heading', { name: 'Create an account' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/register');
  });
});
