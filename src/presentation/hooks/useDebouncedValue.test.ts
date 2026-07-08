import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('propaga o valor inicial imediatamente', async () => {
    const { result } = await renderHook(() => useDebouncedValue('a', 400));

    expect(result.current).toBe('a');
  });

  it('só propaga mudança após o atraso', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 400),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    expect(result.current).toBe('a');

    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(result.current).toBe('ab');
  });

  it('mudanças rápidas cancelam o timer anterior', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 400),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await rerender({ value: 'abc' });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('a'); // nenhum atingiu 400 ms

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('abc');
  });

  it('atraso zero propaga sem timer (modo de teste de fluxo)', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 0),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });

    expect(result.current).toBe('ab');
  });
});
