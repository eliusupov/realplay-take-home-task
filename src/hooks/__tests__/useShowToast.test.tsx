import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { silenceExpectedRenderError } from '../../test/silenceExpectedRenderError';
import { useShowToast } from '../useShowToast';

describe('useShowToast', () => {
  it('throws a clear error outside the toast provider', () => {
    silenceExpectedRenderError();

    expect(() => renderHook(() => useShowToast())).toThrow(
      'useShowToast must be used inside ToastContext',
    );
  });
});
