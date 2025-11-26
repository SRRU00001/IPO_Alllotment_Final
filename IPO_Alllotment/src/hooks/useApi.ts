import { useMemo } from 'react';
import ApiClient from '../services/ApiClient';
import MockApiClient from '../services/MockApiClient';
import { API_BASE_URL, USE_MOCK } from '../config';

export function useApi() {
  const api = useMemo(() => {
    if (USE_MOCK) {
      return new MockApiClient();
    }
    return new ApiClient(API_BASE_URL);
  }, []);

  return api;
}
