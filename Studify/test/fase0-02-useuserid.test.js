import { renderHook, act } from '@testing-library/react-native';

jest.mock('../src/services/authDb', () => ({
  getSessionUser: jest.fn(),
}));

import { getSessionUser } from '../src/services/authDb';
import { useUserId } from '../src/hooks/useUserId';

let resolveSession;
let rejectSession;

beforeEach(() => {
  jest.clearAllMocks();
  resolveSession = null;
  rejectSession = null;
  getSessionUser.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        resolveSession = resolve;
        rejectSession = reject;
      })
  );
});

test('monta e desmonta rápido: nenhum setState após unmount', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  const { unmount } = renderHook(() => useUserId());

  unmount();
  await act(async () => {
    resolveSession({ id: 7, email: 'a@b.com' });
  });

  expect(errorSpy).not.toHaveBeenCalled();
  errorSpy.mockRestore();
});

test('resolve após unmount não atualiza estado e não lança erro', async () => {
  const { result, unmount } = renderHook(() => useUserId());

  expect(result.current).toBeNull();
  unmount();

  await act(async () => {
    resolveSession({ id: 99 });
  });

  expect(result.current).toBeNull();
});

test('rejeição da promise não quebra o hook', async () => {
  const { result } = renderHook(() => useUserId());

  await act(async () => {
    rejectSession(new Error('db falhou'));
  });

  expect(result.current).toBeNull();
});

test('retorna userId quando a sessão existe e o hook está montado', async () => {
  const { result } = renderHook(() => useUserId());

  expect(result.current).toBeNull();

  await act(async () => {
    resolveSession({ id: 42 });
  });

  expect(result.current).toBe(42);
});

test('não define userId quando a sessão não tem id', async () => {
  const { result } = renderHook(() => useUserId());

  await act(async () => {
    resolveSession(null);
  });

  expect(result.current).toBeNull();
});
