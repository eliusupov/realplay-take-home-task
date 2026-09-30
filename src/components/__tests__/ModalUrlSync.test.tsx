import { act, screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ModalProvider } from '../../context/ModalProvider';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ModalRenderer } from '../ModalRenderer';
import { ModalUrlSync } from '../ModalUrlSync';

function renderModals(url: string) {
  return renderWithProviders({
    url,
    signedInAs: { id: 'u1', email: 'ada@example.com' },
    routes: (
      <Route
        path="/"
        element={
          <ModalProvider>
            <ModalUrlSync />
            <ModalRenderer />
          </ModalProvider>
        }
      />
    ),
  });
}

describe('ModalUrlSync', () => {
  it('opens a modal when its trigger is added to the URL', async () => {
    const { router } = renderModals('/');

    await act(() => router.navigate('/?invite=friend-7'));

    expect(
      await screen.findByRole('dialog', { name: 'Invitation' }),
    ).toHaveTextContent('friend-7');
  });

  it('closes a modal when its trigger leaves the URL', async () => {
    const { router } = renderModals('/?welcome=1');
    await screen.findByRole('dialog', { name: 'Welcome' });

    await act(() => router.navigate('/'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
