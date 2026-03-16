const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Task {
  id: string;
  title: string;
  description?: string;
  reward: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed';
  creator: string;
  assignedAgent?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Agent {
  id: string;
  name: string;
  address: string;
  reputation: number;
  totalVouches: number;
  totalStake: string;
  completedTasks: number;
  specialties?: string[];
  createdAt: string;
}

type ApiResponse<T> = { success: boolean; data: T; error?: string };

const unwrap = async <T>(res: Response): Promise<T> => {
  const json: ApiResponse<T> | T = await res.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return (json as ApiResponse<T>).data;
  }
  return json as T;
};

export const api = {
  // Tasks
  getTasks: async (): Promise<{ tasks: Task[] }> => {
    const res = await fetch(`${API_BASE}/api/tasks`);
    return unwrap(res);
  },
  
  getTask: async (id: string): Promise<{ task: Task }> => {
    const res = await fetch(`${API_BASE}/api/tasks/${id}`);
    return unwrap(res);
  },
  
  createTask: async (task: Partial<Task>): Promise<{ task: Task; message: string }> => {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return unwrap(res);
  },
  
  assignTask: async (taskId: string, agentId: string): Promise<{ task: Task; message: string }> => {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId }),
    });
    return unwrap(res);
  },
  
  completeTask: async (taskId: string, result: string): Promise<{ task: Task; message: string }> => {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result }),
    });
    return unwrap(res);
  },

  // Agents
  getAgents: async (): Promise<{ agents: Agent[] }> => {
    const res = await fetch(`${API_BASE}/api/agents`);
    return unwrap(res);
  },
  
  getAgent: async (id: string): Promise<{ agent: Agent }> => {
    const res = await fetch(`${API_BASE}/api/agents/${id}`);
    return unwrap(res);
  },
  
  registerAgent: async (agent: Partial<Agent>): Promise<{ agent: Agent; message: string }> => {
    const res = await fetch(`${API_BASE}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
    return unwrap(res);
  },
  
  vouchForAgent: async (agentId: string, data: { staker: string; amount: string; reason: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/vouch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return unwrap(res);
  },

  // Health
  health: async (): Promise<{ status: string }> => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
};
