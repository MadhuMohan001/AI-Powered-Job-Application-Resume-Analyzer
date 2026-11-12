import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../api/client";

/**
 * Run an async loader on mount (and whenever `deps` change) and expose { data, loading, error, reload }.
 * The loader is kept in a ref so reload() always uses the latest version of it.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return loaderRef.current()
      .then(setData)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void reload(); }, [reload, ...deps]);
  return { data, setData, loading, error, reload };
}
