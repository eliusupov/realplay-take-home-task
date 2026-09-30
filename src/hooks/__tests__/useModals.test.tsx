import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { silenceExpectedRenderError } from '../../test/silenceExpectedRenderError';
import { useModals } from '../useModals';

describe('useModals', () => {
  it('throws a clear error outside ModalProvider', () => {
    silenceExpectedRenderError();

    expect(() => renderHook(() => useModals())).toThrow(
      'useModals must be used inside ModalProvider',
    );
  });
});
