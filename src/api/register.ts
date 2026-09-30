import type { Attribution, RegisterRequest, RegisterResponse } from '../types';
import {
  clearAttribution,
  snapshotRegistrationAttribution,
} from '../utils/attribution';

interface RegisterRequestBody extends RegisterRequest {
  anonymousVisitorId: string;
  attribution: Attribution | null;
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
  clearAttribution();
  return body;
}
