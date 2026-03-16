import fs from 'fs/promises';
import path from 'path';
import { Agent, Task, Vouch, ReputationEvent } from '../types/schema';
import { akave } from './akave';

const DATA_DIR = process.env.DATA_DIR || './data';

// Akave object key mappings
const AKAVE_KEYS = {
  agents: 'agents/all.json',
  tasks: 'tasks/all.json',
  vouches: 'vouches/all.json',
  reputation_events: 'reputation/events.json',
};

class Database {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private vouches: Map<string, Vouch> = new Map();
  private reputationEvents: Map<string, ReputationEvent> = new Map();
  private loaded = false;

  async init() {
    if (this.loaded) return;
    
    try {
      // Initialize Akave first; falls back gracefully if unconfigured
      await akave.init();

      await fs.mkdir(DATA_DIR, { recursive: true });
      await this.load();
      this.loaded = true;
      console.log('✅ Database initialized');
    } catch (error) {
      console.error('Database init error:', error);
      throw error;
    }
  }

  private async load() {
    const loadCollection = async <T>(name: keyof typeof AKAVE_KEYS): Promise<T[]> => {
      // Prefer Akave when available
      if (akave.isAvailable()) {
        try {
          const data = await akave.getJSON<T[]>(AKAVE_KEYS[name]);
          if (data) return data;
        } catch (err) {
          console.warn(`Akave load failed for ${name}, falling back to local:`, err);
        }
      }

      // Fall back to local file storage
      try {
        const content = await fs.readFile(path.join(DATA_DIR, `${name}.json`), 'utf-8');
        return JSON.parse(content) as T[];
      } catch {
        return [];
      }
    };

    const [agents, tasks, vouches, events] = await Promise.all([
      loadCollection<Agent>('agents'),
      loadCollection<Task>('tasks'),
      loadCollection<Vouch>('vouches'),
      loadCollection<ReputationEvent>('reputation_events'),
    ]);

    agents.forEach((a) => this.agents.set(a.id, a));
    tasks.forEach((t) => this.tasks.set(t.id, t));
    vouches.forEach((v) => this.vouches.set(v.id, v));
    events.forEach((e) => this.reputationEvents.set(e.id, e));
    
    console.log(`📊 Loaded: ${this.agents.size} agents, ${this.tasks.size} tasks, ${this.vouches.size} vouches, ${this.reputationEvents.size} events`);
  }

  private async save(name: keyof typeof AKAVE_KEYS, data: any[]) {
    // Persist to Akave when available
    if (akave.isAvailable()) {
      try {
        await akave.putJSON(AKAVE_KEYS[name], data);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Akave save failed for "${name}" (${message}) — local copy written`);
      }
    }

    // Always keep a local copy as backup
    await fs.writeFile(
      path.join(DATA_DIR, `${name}.json`),
      JSON.stringify(data, null, 2)
    );
  }

  // Stats
  getStats() {
    return {
      totalAgents: this.agents.size,
      totalTasks: this.tasks.size,
      totalVouches: this.vouches.size,
      openTasks: this.getTasksByStatus('open').length,
      completedTasks: this.getTasksByStatus('completed').length,
    };
  }

  // Agent operations
  getAgent(id: string) { return this.agents.get(id); }
  getAgents() { return Array.from(this.agents.values()); }
  getAgentByAddress(address: string) {
    return Array.from(this.agents.values()).find(a => a.address.toLowerCase() === address.toLowerCase());
  }
  getTopAgents(limit: number = 10) {
    return Array.from(this.agents.values())
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit);
  }
  async createAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
    await this.save('agents', this.getAgents());
    return agent;
  }
  async updateAgent(id: string, updates: Partial<Agent>) {
    const agent = this.agents.get(id);
    if (!agent) return null;
    
    // Calculate new reputation from vouches if not explicitly set
    if (updates.totalVouches !== undefined || updates.totalStake !== undefined) {
      const vouches = this.getVouchesForAgent(id);
      const totalStake = vouches.reduce((sum, v) => sum + BigInt(v.amount), BigInt(0));
      updates.totalStake = totalStake.toString();
      updates.totalVouches = vouches.length;
      
      // Simple reputation formula: min(100, vouches * 2 + stake_in_celo / 10)
      const stakeInCelo = Number(totalStake) / 1e18;
      updates.reputation = Math.min(100, Math.floor(vouches.length * 2 + stakeInCelo / 10));
    }
    
    const updated = { ...agent, ...updates, updatedAt: new Date().toISOString() };
    this.agents.set(id, updated);
    await this.save('agents', this.getAgents());
    return updated;
  }

  // Task operations
  getTask(id: string) { return this.tasks.get(id); }
  getTasks() { return Array.from(this.tasks.values()); }
  getTasksByStatus(status: Task['status']) {
    return this.getTasks().filter(t => t.status === status);
  }
  getTasksByCreator(creator: string) {
    return this.getTasks().filter(t => t.creator.toLowerCase() === creator.toLowerCase());
  }
  getTasksByAgent(agentId: string) {
    return this.getTasks().filter(t => t.assignedAgent === agentId);
  }
  async createTask(task: Task) {
    this.tasks.set(task.id, task);
    await this.save('tasks', this.getTasks());
    return task;
  }
  async updateTask(id: string, updates: Partial<Task>) {
    const task = this.tasks.get(id);
    if (!task) return null;
    const updated = { ...task, ...updates, updatedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    await this.save('tasks', this.getTasks());
    return updated;
  }
  async deleteTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) return false;
    this.tasks.delete(id);
    await this.save('tasks', this.getTasks());
    return true;
  }

  // Vouch operations
  getVouchesForAgent(agentId: string) {
    return Array.from(this.vouches.values()).filter(v => v.agentId === agentId);
  }
  async createVouch(vouch: Vouch) {
    this.vouches.set(vouch.id, vouch);
    await this.save('vouches', Array.from(this.vouches.values()));
    
    // Update agent's vouch stats
    const agent = this.getAgent(vouch.agentId);
    if (agent) {
      const vouches = this.getVouchesForAgent(vouch.agentId);
      const totalStake = vouches.reduce((sum, v) => sum + BigInt(v.amount), BigInt(0));
      const stakeInCelo = Number(totalStake) / 1e18;
      
      await this.updateAgent(vouch.agentId, {
        totalVouches: vouches.length,
        totalStake: totalStake.toString(),
        reputation: Math.min(100, Math.floor(vouches.length * 2 + stakeInCelo / 10)),
      });
    }
    
    return vouch;
  }

  // Reputation events
  getReputationEventsForAgent(agentId: string) {
    return Array.from(this.reputationEvents.values())
      .filter(e => e.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  async addReputationEvent(event: ReputationEvent) {
    this.reputationEvents.set(event.id, event);
    await this.save('reputation_events', Array.from(this.reputationEvents.values()));
    
    // Update agent reputation
    const agent = this.getAgent(event.agentId);
    if (agent && event.change !== 0) {
      const newReputation = Math.max(0, Math.min(100, agent.reputation + event.change));
      await this.updateAgent(event.agentId, { reputation: newReputation });
    }
    
    return event;
  }
}

export const db = new Database();
