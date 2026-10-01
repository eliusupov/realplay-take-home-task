import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('NotFoundPage', () => {
  it('shows Page not found inside the app layout with a link home', async () => {
    renderWithProviders({ url: '/no-such-page?utm_source=typo&x=1' });

    expect(
      await screen.findByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute(
      'href',
      '/?utm_source=typo&x=1',
    );
  });
});
