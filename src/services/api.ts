import { getAuthToken } from '@/utils/auth';
import { env, envUtils } from '@/config/env';

const API_BASE_URL = env.API_BASE_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const token = getAuthToken();
    const url = envUtils.getApiUrl(endpoint);

    try {
      envUtils.log('debug', `Making API request to: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.API_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        envUtils.log('debug', `API request successful: ${url}`, data);
        return { success: true, data };
      } else {
        envUtils.log('warn', `API request failed: ${url}`, data);
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error: any) {
      envUtils.log('error', `API request error: ${url}`, error);

      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }

      if (error.message === 'Failed to fetch' && retryCount < env.RETRY_ATTEMPTS) {
        envUtils.log('info', `Retrying request (${retryCount + 1}/${env.RETRY_ATTEMPTS}): ${url}`);
        await new Promise(resolve => setTimeout(resolve, env.RETRY_DELAY));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      return { success: false, error: 'Network error' };
    }
  }

  async getTasks(filters?: { status?: string; priority?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.priority) queryParams.append('priority', filters.priority);
    if (filters?.search) queryParams.append('search', filters.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  async getTaskStats() {
    return this.makeRequest('/tasks/stats');
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
  }) {
    return this.makeRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId: number, taskData: any) {
    return this.makeRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async updateTaskStatus(taskId: number, status: string) {
    return this.makeRequest(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteTask(taskId: number) {
    return this.makeRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async getUserProfile() {
    return this.makeRequest('/auth/profile');
  }
}

export const apiService = new ApiService();
export default apiService;