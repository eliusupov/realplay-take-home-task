import { act, screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ModalRenderer } from '../../components/ModalRenderer';
import { useModals } from '../../hooks/useModals';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ModalProvider } from '../ModalProvider';

function OpenPromo() {
  const { openModal } = useModals();
  return (
    <button
      onClick={() => {
        openModal({ type: 'promo', params: { code: 'SPRING' } });
      }}
    >
      Open promo
    </button>
  );
}

function renderModalProvider(url: string) {
  return renderWithProviders({
    url,
    signedInAs: { id: 'u1', email: 'ada@example.com' },
    routes: (
      <Route
        path="/"
        element={
          <ModalProvider>
            <OpenPromo />
            <ModalRenderer />
          </ModalProvider>
        }
      />
    ),
  });
}

describe('ModalProvider', () => {
  it('openModal adds its trigger to the URL, keeping other params and the hash', async () => {
    const { user, router } = renderModalProvider('/?utm_source=x#top');

    await user.click(screen.getByRole('button', { name: 'Open promo' }));

    expect(
      await screen.findByRole('dialog', { name: 'Promo code' }),
    ).toHaveTextContent('SPRING');
    expect(router.state.location.search).toBe('?utm_source=x&promo=SPRING');
    expect(router.state.location.hash).toBe('#top');
  });

  it('closing a modal removes only its query key, keeping other params and the hash', async () => {
    const { user, router } = renderModalProvider(
      '/?promo=A&welcome=1&utm_source=x#top',
    );

    await screen.findByRole('dialog', { name: 'Promo code' });
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(
      await screen.findByRole('dialog', { name: 'Welcome' }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('?welcome=1&utm_source=x');
    expect(router.state.location.hash).toBe('#top');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('follows the URL when a trigger is added, changed or removed', async () => {
    const { router } = renderModalProvider('/?promo=SPRING');
    await screen.findByRole('dialog', { name: 'Promo code' });

    await act(() => router.navigate('/?promo=SUMMER'));
    const promo = screen.getByRole('dialog', { name: 'Promo code' });
    expect(promo).toHaveTextContent('SUMMER');
    expect(promo).not.toHaveTextContent('SPRING');

    await act(() => router.navigate('/'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
