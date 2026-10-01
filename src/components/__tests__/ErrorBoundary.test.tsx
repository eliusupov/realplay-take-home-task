import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { silenceExpectedRenderError } from '../../test/silenceExpectedRenderError';
import { ErrorBoundary } from '../ErrorBoundary';

function Broken(): never {
  throw new Error('Broken page');
}

describe('ErrorBoundary', () => {
  it('offers a reload when a page throws', () => {
    silenceExpectedRenderError();

    renderWithProviders({
      routes: (
        <Route path="/" element={<Broken />} errorElement={<ErrorBoundary />} />
      ),
    });

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });
});
