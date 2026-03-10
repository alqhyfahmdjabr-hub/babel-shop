import { useState, useCallback, useRef, useEffect } from 'react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseApiReturn<T, P extends unknown[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
  retry: () => void;
}

/**
 * Hook for API calls with loading, error states and retry logic
 */
export function useApi<T, P extends unknown[] = unknown[]>(
  apiFunction: (...params: P) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const { onSuccess, onError, retryCount = 3, retryDelay = 1000 } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const lastParams = useRef<P | null>(null);
  const retryAttempt = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async (...params: P): Promise<T | null> => {
    lastParams.current = params;
    retryAttempt.current = 0;
    
    setLoading(true);
    setError(null);

    const attemptRequest = async (): Promise<T | null> => {
      try {
        const result = await apiFunction(...params);
        
        if (isMounted.current) {
          setData(result);
          setLoading(false);
          onSuccess?.(result);
        }
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        if (retryAttempt.current < retryCount) {
          retryAttempt.current++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryAttempt.current));
          return attemptRequest();
        }
        
        if (isMounted.current) {
          setError(error);
          setLoading(false);
          onError?.(error);
        }
        
        return null;
      }
    };

    return attemptRequest();
  }, [apiFunction, onSuccess, onError, retryCount, retryDelay]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    lastParams.current = null;
    retryAttempt.current = 0;
  }, []);

  const retry = useCallback(() => {
    if (lastParams.current) {
      retryAttempt.current = 0;
      execute(...lastParams.current);
    }
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry
  };
}

/**
 * Hook for debounced API calls
 */
export function useDebouncedApi<T, P extends unknown[] = unknown[]>(
  apiFunction: (...params: P) => Promise<T>,
  delay: number = 500,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> & { debouncedExecute: (...params: P) => void } {
  const api = useApi(apiFunction, options);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedExecute = useCallback((...params: P) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      api.execute(...params);
    }, delay);
  }, [api, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...api,
    debouncedExecute
  };
}

/**
 * Hook for polling API calls
 */
export function usePolling<T>(
  apiFunction: () => Promise<T>,
  interval: number = 5000,
  options: { onSuccess?: (data: T) => void; onError?: (error: Error) => void; enabled?: boolean } = {}
) {
  const { onSuccess, onError, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFunction();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval, enabled]);

  return { data, loading, refetch: fetchData };
}

export default useApi;
