import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import type { Ipo } from '../types';

export function useIpoList() {
  const [ipos, setIpos] = useState<Ipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const fetchIpos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await api.listIpos();

    if (response.success && response.data) {
      setIpos(response.data);
    } else {
      setError(response.error || 'Failed to fetch IPO list');
    }

    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchIpos();
  }, [fetchIpos]);

  const addIpo = useCallback(
    async (ipoName: string, amount: number) => {
      const response = await api.addIpo(ipoName, amount);
      if (response.success) {
        await fetchIpos();
      }
      return response;
    },
    [api, fetchIpos]
  );

  // Helper to get IPO names only (for backwards compatibility)
  const ipoNames = ipos.map(ipo => ipo.name);

  return { ipos, ipoNames, loading, error, refresh: fetchIpos, addIpo };
}
