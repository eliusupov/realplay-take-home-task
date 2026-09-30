import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ModalRenderer } from '../../components/ModalRenderer';
import { useModals } from '../../hooks/useModals';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ModalProvider } from '../ModalProvider';

function OpenPromoTwice() {
  const { openModal } = useModals();
  return (
    <button
      onClick={() => {
        openModal({ type: 'promo', params: { code: 'A' } });
        openModal({ type: 'promo', params: { code: 'B' } });
      }}
    >
      Open promo A then B
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
            <OpenPromoTwice />
            <ModalRenderer />
          </ModalProvider>
        }
      />
    ),
  });
}

describe('ModalProvider', () => {
  it('keeps one modal per type, replaced by the latest open, without changing the URL', async () => {
    const { user, router } = renderModalProvider('/?utm_source=x');

    await user.click(
      screen.getByRole('button', { name: 'Open promo A then B' }),
    );

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(
      screen.getByRole('dialog', { name: 'Promo code' }),
    ).toHaveTextContent('B');
    expect(router.state.location.search).toBe('?utm_source=x');
  });

  it('closing a modal removes only its query key and keeps other params and the hash', async () => {
    const { user, router } = renderModalProvider(
      '/?promo=A&welcome=1&utm_source=x#top',
    );

    await user.click(
      screen.getByRole('button', { name: 'Open promo A then B' }),
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.search).toBe('?welcome=1&utm_source=x');
    expect(router.state.location.hash).toBe('#top');
  });
});
