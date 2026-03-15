// AgentBond API Service Layer
// Connects frontend to real backend endpoints

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Agent {
  id: string;
  name: string;
  specialization: string;
  reputation: number;
  stakedAmount: string;
  tasksCompleted: number;
  successRate: number;
  status: 'available' | 'busy' | 'offline';
  lastActive: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assignee?: string;
  createdAt: string;
}

export interface VouchRequest {
  agentId: string;
  amount: string;
  reason?: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Agents API
export const agentsApi = {
  list: () => apiCall<Agent[]>('/api/agents'),
  get: (id: string) => apiCall<Agent>(`/api/agents/${id}`),
  create: (agent: Partial<Agent>) =>
    apiCall<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    }),
  update: (id: string, agent: Partial<Agent>) =>
    apiCall<Agent>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    }),
  delete: (id: string) =>
    apiCall<void>(`/api/agents/${id}`, { method: 'DELETE' }),
};

// Tasks API
export const tasksApi = {
  list: () => apiCall<Task[]>('/api/tasks'),
  get: (id: string) => apiCall<Task>(`/api/tasks/${id}`),
  create: (task: Partial<Task>) =>
    apiCall<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  update: (id: string, task: Partial<Task>) =>
    apiCall<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),
  delete: (id: string) =>
    apiCall<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
};

// Vouch API
export const vouchApi = {
  create: (vouch: VouchRequest) =>
    apiCall<{ message: string; data: VouchRequest }>('/api/vouch', {
      method: 'POST',
      body: JSON.stringify(vouch),
    }),
};

// Health check
export const healthCheck = () =>
  apiCall<{ status: string; service: string; timestamp: string }>('/health');
