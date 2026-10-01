import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ModalProvider } from '../../context/ModalProvider';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { RegisteredUser } from '../../types';
import { ModalRenderer } from '../ModalRenderer';

const ada = { id: 'u1', email: 'ada@example.com' };

function renderModals(url: string, signedInAs?: RegisteredUser) {
  return renderWithProviders({
    url,
    signedInAs,
    routes: (
      <Route
        path="/"
        element={
          <ModalProvider>
            <ModalRenderer />
          </ModalProvider>
        }
      />
    ),
  });
}

describe('ModalRenderer', () => {
  it('shows the first modal in link order', async () => {
    renderModals('/?promo=SPRING&welcome=1', ada);

    expect(
      await screen.findByRole('dialog', { name: 'Promo code' }),
    ).toHaveTextContent('SPRING');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('renders nothing when signed out', () => {
    renderModals('/?welcome=1');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
