import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('Layout', () => {
  it('logs out from a protected page back to a signed-out home', async () => {
    const { user, router } = renderWithProviders({
      url: '/account',
      signedInAs: { id: 'u1', email: 'ada@example.com' },
    });

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(router.state.location.pathname).toBe('/');
    expect(
      await screen.findByRole('link', { name: 'Register' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Log out' }),
    ).not.toBeInTheDocument();
  });
});
