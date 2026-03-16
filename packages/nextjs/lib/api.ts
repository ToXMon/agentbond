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

export const api = {
  // Tasks
  getTasks: async (): Promise<{ tasks: Task[] }> => {
    const res = await fetch(`${API_BASE}/api/tasks`);
    const json = await res.json();
    // Backend wraps response in { success, data: { tasks } }
    return json.data ?? json;
  },
  
  getTask: async (id: string): Promise<{ task: Task }> => {
    const res = await fetch(`${API_BASE}/api/tasks/${id}`);
    const json = await res.json();
    return json.data ?? json;
  },
  
  createTask: async (task: Partial<Task>): Promise<{ task: Task; message: string }> => {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },
  
  assignTask: async (taskId: string, agentId: string): Promise<{ task: Task; message: string }> => {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId }),
    });
    return res.json();
  },
  
  completeTask: async (taskId: string, result: string): Promise<{ task: Task; message: string }> => {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result }),
    });
    return res.json();
  },

  // Agents
  getAgents: async (): Promise<{ agents: Agent[] }> => {
    const res = await fetch(`${API_BASE}/api/agents`);
    const json = await res.json();
    // Backend wraps response in { success, data: { agents } }
    return json.data ?? json;
  },
  
  getAgent: async (id: string): Promise<{ agent: Agent }> => {
    const res = await fetch(`${API_BASE}/api/agents/${id}`);
    const json = await res.json();
    return json.data ?? json;
  },
  
  registerAgent: async (agent: Partial<Agent>): Promise<{ agent: Agent; message: string }> => {
    const res = await fetch(`${API_BASE}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
    return res.json();
  },
  
  vouchForAgent: async (agentId: string, data: { staker: string; amount: string; reason: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/vouch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Health
  health: async (): Promise<{ status: string }> => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
};
