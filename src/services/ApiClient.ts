import type { IpoApplication, IpoApplicationInput, Applicant, ApplicantInput, Ipo, ApiResponse } from '../types';
import { DEBUG } from '../config';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

class ApiClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;

  constructor(baseUrl: string, retryConfig: Partial<RetryConfig> = {}) {
    this.baseUrl = baseUrl;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private log(...args: unknown[]) {
    if (DEBUG) {
      console.log('[ApiClient]', ...args);
    }
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    return delay + Math.random() * 1000;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 0
  ): Promise<Response> {
    try {
      this.log(`Attempt ${attempt + 1}: ${options.method || 'GET'} ${url}`);
      const optionsWithAuth = {
        ...options,
        headers: {
          ...options.headers,
          ...this.getAuthHeaders(),
        },
      };
      const response = await fetch(url, optionsWithAuth);

      if (response.ok) {
        return response;
      }

      if (response.status >= 500 && attempt < this.retryConfig.maxRetries) {
        const delay = this.calculateBackoff(attempt);
        this.log(`Server error (${response.status}), retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      if (attempt < this.retryConfig.maxRetries) {
        const delay = this.calculateBackoff(attempt);
        this.log(`Network error, retrying in ${delay}ms...`, error);
        await this.sleep(delay);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private async postJson(payload: Record<string, unknown>): Promise<Response> {
    return this.fetchWithRetry(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  // ==================== Applications ====================

  async listRows(): Promise<ApiResponse<IpoApplication[]>> {
    try {
      const url = `${this.baseUrl}?action=list`;
      const response = await this.fetchWithRetry(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      this.log('Error in listRows:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch applications',
      };
    }
  }

  async updateRow(id: string, rowData: Partial<IpoApplicationInput>): Promise<ApiResponse<IpoApplication>> {
    try {
      const payload = { action: 'updateRow', id, data: rowData };
      const response = await this.postJson(payload);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      this.log('Error in updateRow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update application',
      };
    }
  }

  async deleteRow(id: string): Promise<ApiResponse<void>> {
    try {
      const payload = { action: 'deleteRow', id };
      const response = await this.postJson(payload);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      this.log('Error in deleteRow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete application',
      };
    }
  }

  // ==================== IPOs ====================

  async listIpos(): Promise<ApiResponse<Ipo[]>> {
    try {
      const url = `${this.baseUrl}?action=listIpos`;
      const response = await this.fetchWithRetry(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      this.log('Error in listIpos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch IPO list',
      };
    }
  }

  async addIpo(ipoName: string, amount: number): Promise<ApiResponse<Ipo>> {
    try {
      const payload = { action: 'addIpo', ipoName, amount };
      const response = await this.postJson(payload);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      this.log('Error in addIpo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add IPO',
      };
    }
  }

  async getAppliedUsers(ipoName: string): Promise<ApiResponse<string[]>> {
    try {
      const url = `${this.baseUrl}?action=getAppliedUsers&ipoName=${encodeURIComponent(ipoName)}`;
      const response = await this.fetchWithRetry(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      this.log('Error in getAppliedUsers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get applied users',
      };
    }
  }

  async addBulkApplications(ipoName: string, userIds: string[]): Promise<ApiResponse<{ created: number }>> {
    try {
      const payload = { action: 'addBulkApplications', ipoName, userIds };
      const response = await this.postJson(payload);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      this.log('Error in addBulkApplications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add applications',
      };
    }
  }

  // ==================== Users/Applicants ====================

  async listUsers(): Promise<ApiResponse<Applicant[]>> {
    try {
      const url = `${this.baseUrl}?action=listUsers`;
      const response = await this.fetchWithRetry(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      this.log('Error in listUsers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  }

  async addUser(userData: ApplicantInput): Promise<ApiResponse<Applicant>> {
    try {
      const payload = { action: 'addUser', data: userData };
      const response = await this.postJson(payload);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      this.log('Error in addUser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add user',
      };
    }
  }

  async updateUser(id: string, userData: Partial<ApplicantInput>): Promise<ApiResponse<Applicant>> {
    try {
      const payload = { action: 'updateUser', id, data: userData };
      const response = await this.postJson(payload);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      this.log('Error in updateUser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      const payload = { action: 'deleteUser', id };
      const response = await this.postJson(payload);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      this.log('Error in deleteUser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  }
}

export default ApiClient;
