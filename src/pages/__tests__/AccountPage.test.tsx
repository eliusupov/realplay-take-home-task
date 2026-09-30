import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('AccountPage', () => {
  it('shows the signed-in user email and id', () => {
    renderWithProviders({
      url: '/account',
      signedInAs: { id: 'user-42', email: 'ada@example.com' },
    });

    expect(
      screen.getByRole('heading', { name: 'Your account' }),
    ).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('user-42')).toBeInTheDocument();
  });
});
