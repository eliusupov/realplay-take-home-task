import type { RegisterRequest, RegisterResponse } from '../types';
import { clearAttribution, readFreshAttribution } from '../utils/attribution';

export async function registerUser(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  let response: Response;
  try {
    response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, attribution: readFreshAttribution() }),
    });
  } catch {
    throw new Error(
      'Could not reach the server. Check your connection and try again.',
    );
  }
  const body = (await response.json()) as RegisterResponse & {
    message?: string;
  };
  if (!response.ok)
    throw new Error(body.message ?? 'Registration failed. Please try again.');
  clearAttribution();
  return body;
}
