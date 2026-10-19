import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Default seguro: telas que usam useTimer sem <TimerProvider> (ex.: testes
// antigos que renderizam a Detail isolada) continuam funcionando sem crash.
const noop = () => {};
const defaultContext = {
  session: null,
  start: noop,
  pause: noop,
  resume: noop,
  stop: () => null,
  reset: noop,
};

export const TimerContext = createContext(defaultContext);

export function TimerProvider({ children }) {
  const [session, setSession] = useState(null);

  // Um único interval global. Roda só com sessão ativa, não pausada e não
  // finalizada; as deps abaixo reiniciam o interval quando o modo muda.
  useEffect(() => {
    if (!session || session.paused || session.finished) return undefined;
    const interval = setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.paused || prev.finished) return prev;
        const next = prev.elapsed + 1;
        if (prev.mode === 'pomodoro' && next >= prev.duration * 60) {
          return { ...prev, elapsed: prev.duration * 60, paused: true, finished: true };
        }
        return { ...prev, elapsed: next };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [!!session, session?.paused, session?.finished, session?.mode, session?.duration]);

  const start = useCallback(({ materiaId, materiaNome, mode = 'free', duration = 25, focus = false }) => {
    setSession({
      materiaId,
      materiaNome: materiaNome || 'Matéria',
      mode,
      duration,
      // Modo foco: bloqueia a saída da tela da matéria (via beforeRemove).
      focus: !!focus,
      elapsed: 0,
      paused: false,
      finished: false,
      startedAt: Date.now(),
    });
  }, []);

  const pause = useCallback(() => {
    setSession((prev) => (prev && !prev.paused && !prev.finished ? { ...prev, paused: true } : prev));
  }, []);

  const resume = useCallback(() => {
    setSession((prev) => (prev && prev.paused && !prev.finished ? { ...prev, paused: false } : prev));
  }, []);

  // Snapshot por closure: quem chama stop() recebe os segundos finais para salvar.
  const stop = useCallback(() => {
    const snapshot = session;
    setSession(null);
    return snapshot;
  }, [session]);

  const reset = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({ session, start, pause, resume, stop, reset }),
    [session, start, pause, resume, stop, reset]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  return useContext(TimerContext);
}
