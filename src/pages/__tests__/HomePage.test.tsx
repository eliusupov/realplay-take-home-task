import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('HomePage', () => {
  it('lets a signed-out visitor go to registration', async () => {
    const { user } = renderWithProviders();

    await user.click(screen.getByRole('link', { name: 'Register' }));

    expect(
      await screen.findByRole('heading', { name: 'Create an account' }),
    ).toBeInTheDocument();
  });

  it('hides the Register button once signed in', () => {
    renderWithProviders({
      signedInAs: { id: 'u1', email: 'ada@example.com' },
    });

    expect(
      screen.getByRole('heading', {
        name: 'Registration with attribution and redirect',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Register' }),
    ).not.toBeInTheDocument();
  });
});
