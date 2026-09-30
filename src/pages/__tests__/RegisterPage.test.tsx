import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('RegisterPage', () => {
  it('returns a newly registered visitor to the page they came from', async () => {
    const { user, router } = renderWithProviders({
      url: '/account?tab=profile#details',
    });

    await user.type(screen.getByLabelText(/Email/), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(
      await screen.findByRole('heading', { name: 'Your account' }),
    ).toBeInTheDocument();
    expect(router.state.location).toMatchObject({
      pathname: '/account',
      search: '?tab=profile',
      hash: '#details',
    });
  });

  it('sends a signed-in visitor without a return location home, keeping the query and hash', () => {
    const { router } = renderWithProviders({
      url: '/register?utm_source=newsletter#top',
      signedInAs: { id: 'u1', email: 'ada@example.com' },
    });

    expect(router.state.location).toMatchObject({
      pathname: '/',
      search: '?utm_source=newsletter',
      hash: '#top',
    });
  });
});
