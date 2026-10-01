import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { RegisteredUser } from '../../types';
import { Header } from '../Header';

function renderHeader(signedInAs?: RegisteredUser, url = '/') {
  const onLogOut = vi.fn<() => void>();
  const rendered = renderWithProviders({
    url,
    routes: <Route path="/" element={<Header onLogOut={onLogOut} />} />,
    signedInAs,
  });
  return { ...rendered, onLogOut };
}

describe('Header', () => {
  it('links the avatar initial to the account page when signed in', () => {
    renderHeader({ id: 'u1', email: 'ada@example.com' });

    const accountLink = screen.getByRole('link', {
      name: 'Account (ada@example.com)',
    });
    expect(accountLink).toHaveTextContent('A');
    expect(accountLink).toHaveAttribute('href', '/account');
  });

  it('keeps the current query string on every header link', () => {
    renderHeader(
      { id: 'u1', email: 'ada@example.com' },
      '/?utm_source=google&x=1#top',
    );

    for (const [name, href] of [
      ['Realplay', '/?utm_source=google&x=1'],
      ['Home', '/?utm_source=google&x=1'],
      ['Account (ada@example.com)', '/account?utm_source=google&x=1'],
    ]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('hides the way home while signed out with a pop-up pending in the URL', () => {
    renderHeader(undefined, '/?promo=SPRING');

    expect(
      screen.queryByRole('link', { name: 'Home' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Realplay' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Realplay')).toBeInTheDocument();
  });
});
