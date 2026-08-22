import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../types';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Generic data-fetching hook. `fetcher` should be a stable arrow wrapping an api call,
 * e.g. `useApi(() => api.coworkers(id), [id])`.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ data: s.data, loading: true, error: null }));
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: e instanceof ApiError ? e : new ApiError('UNKNOWN', String(e?.message ?? e)),
          });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
