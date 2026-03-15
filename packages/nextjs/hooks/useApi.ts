// React hooks for AgentBond API
import { useState, useEffect, useCallback } from 'react';
import { agentsApi, tasksApi, vouchApi, healthCheck, Agent, Task, VouchRequest } from '../services/api';

// Generic hook for data fetching
function useFetch<T>(fetcher: () => Promise<{ success: boolean; data?: T; error?: string }>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetcher();
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Failed to fetch data');
    }
    setLoading(false);
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Agents hooks
export function useAgents() {
  return useFetch(() => agentsApi.list());
}

export function useAgent(id: string) {
  return useFetch(() => agentsApi.get(id));
}

export function useCreateAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (agent: Partial<Agent>) => {
    setLoading(true);
    setError(null);
    const result = await agentsApi.create(agent);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to create agent');
      return null;
    }
    return result.data;
  }, []);

  return { create, loading, error };
}

// Tasks hooks
export function useTasks() {
  return useFetch(() => tasksApi.list());
}

export function useTask(id: string) {
  return useFetch(() => tasksApi.get(id));
}

export function useCreateTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (task: Partial<Task>) => {
    setLoading(true);
    setError(null);
    const result = await tasksApi.create(task);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to create task');
      return null;
    }
    return result.data;
  }, []);

  return { create, loading, error };
}

// Vouch hook
export function useVouch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vouch = useCallback(async (request: VouchRequest) => {
    setLoading(true);
    setError(null);
    const result = await vouchApi.create(request);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to vouch');
      return false;
    }
    return true;
  }, []);

  return { vouch, loading, error };
}

// Health check hook
export function useHealthCheck() {
  return useFetch(() => healthCheck());
}
