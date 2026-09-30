import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { silenceExpectedRenderError } from '../../test/silenceExpectedRenderError';
import { useSession } from '../useSession';

describe('useSession', () => {
  it('throws a clear error outside SessionProvider', () => {
    silenceExpectedRenderError();

    expect(() => renderHook(() => useSession())).toThrow(
      'useSession must be used inside SessionProvider',
    );
  });
});
