import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
  it('renders the home page for a signed-out visitor', async () => {
    render(<App />);

    expect(
      await screen.findByRole('heading', {
        name: 'Registration with attribution and redirect',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });
});
