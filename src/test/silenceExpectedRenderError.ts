import { onTestFinished, vi } from 'vitest';

export function silenceExpectedRenderError() {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const keepJsdomFromReporting = (event: ErrorEvent) => {
    event.preventDefault();
  };
  window.addEventListener('error', keepJsdomFromReporting);
  onTestFinished(() => {
    window.removeEventListener('error', keepJsdomFromReporting);
  });
}
