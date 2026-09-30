import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { RegisterResponse } from '../../types';
import { RegistrationForm } from '../RegistrationForm';

function renderForm() {
  const onRegistered = vi.fn<(response: RegisterResponse) => void>();
  const rendered = renderWithProviders({
    routes: (
      <Route
        path="/"
        element={<RegistrationForm onRegistered={onRegistered} />}
      />
    ),
  });
  return { ...rendered, onRegistered };
}

describe('RegistrationForm', () => {
  it('shows field errors and focuses the email field for an invalid email and short password', async () => {
    const { user, onRegistered } = renderForm();

    await user.type(screen.getByLabelText(/Email/), 'ada');
    await user.type(screen.getByLabelText(/Password/), 'short');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByLabelText(/Email/)).toHaveAccessibleDescription(
      'Enter an email address like name@example.com.',
    );
    expect(screen.getByLabelText(/Password/)).toHaveAccessibleDescription(
      'Use at least 8 characters.',
    );
    expect(screen.getByLabelText(/Email/)).toHaveFocus();
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it('disables submit while the request is pending and reports the registered user', async () => {
    const { user, onRegistered } = renderForm();

    await user.type(screen.getByLabelText(/Email/), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/), 'correct horse');
    await user.click(screen.getByRole('button', { name: /Register/ }));

    expect(screen.getByRole('button', { name: /Register/ })).toBeDisabled();
    await waitFor(() => {
      expect(onRegistered.mock.lastCall?.[0].user.email).toBe(
        'ada@example.com',
      );
    });
    expect(screen.getByRole('button', { name: /Register/ })).toBeEnabled();
  });

  it('shows the server error when registration fails', async () => {
    const { user, onRegistered } = renderForm();

    await user.type(screen.getByLabelText(/Email/), 'fail@example.com');
    await user.type(screen.getByLabelText(/Password/), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server could not create your account. Try again with a different email.',
    );
    expect(onRegistered).not.toHaveBeenCalled();
  });
});
