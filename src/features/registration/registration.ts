import {
  clearAttribution,
  snapshotRegistrationAttribution,
  type Attribution,
} from '../attribution/attribution';
import type { RegisteredUser } from '../session/session';

export interface RegisterRequest {
  email: string;
  password: string;
}

// The wire body: the form fields plus a fresh-record snapshot for this request.
interface RegisterRequestBody extends RegisterRequest {
  anonymousVisitorId: string;
  attribution: Attribution | null;
}

export interface RegisterResponse {
  user: RegisteredUser;
  token: string;
}

export const MIN_PASSWORD_LENGTH = 8;

export type RegistrationErrors = Partial<Record<keyof RegisterRequest, string>>;

// Format only, not ownership. The form and the mock server share this rule.
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRegisterResponse(value: unknown): value is RegisterResponse {
  return (
    isObject(value) &&
    typeof value['token'] === 'string' &&
    isObject(value['user']) &&
    typeof value['user']['id'] === 'string' &&
    typeof value['user']['email'] === 'string'
  );
}

export async function registerUser(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  const requestBody: RegisterRequestBody = {
    ...request,
    ...snapshotRegistrationAttribution(),
  };
  let response: Response;
  try {
    response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new Error(
      'Could not reach the server. Check your connection and try again.',
    );
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isObject(body) ? body['message'] : undefined;
    throw new Error(
      typeof message === 'string'
        ? message
        : 'Registration failed. Please try again.',
    );
  }
  if (!isRegisterResponse(body))
    throw new Error(
      'The server sent an unexpected response. Please try again.',
    );
  // Submitted: the attribution is spent. Failures above keep it for a retry.
  clearAttribution();
  return body;
}
