import { useState, useEffect, useCallback } from 'react';
import type { IpoApplication } from '../types';
import { useApi } from './useApi';

export function useFetchRows() {
  const [rows, setRows] = useState<IpoApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const api = useApi();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await api.listRows();

    if (response.success && response.data) {
      setRows(response.data);
      setLastSync(new Date());
    } else {
      setError(response.error || 'Failed to fetch rows');
    }

    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const refresh = useCallback(() => {
    fetchRows();
  }, [fetchRows]);

  return { rows, loading, error, lastSync, refresh, setRows };
}
