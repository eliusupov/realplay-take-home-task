import type { RegisterRequest } from '../types';

export const MIN_PASSWORD_LENGTH = 8;

export type RegistrationErrors = Partial<Record<keyof RegisterRequest, string>>;

export function validateRegistration({
  email,
  password,
}: RegisterRequest): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!email) errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Enter an email address like name@example.com.';
  if (password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Use at least ${String(MIN_PASSWORD_LENGTH)} characters.`;
  return errors;
}
