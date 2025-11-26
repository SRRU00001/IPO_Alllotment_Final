import { useMemo } from 'react';
import ApiClient from '../services/ApiClient';
import MockApiClient from '../services/MockApiClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useApi() {
  const api = useMemo(() => {
    if (USE_MOCK) {
      return new MockApiClient();
    }
    return new ApiClient(API_BASE_URL);
  }, []);

  return api;
}
