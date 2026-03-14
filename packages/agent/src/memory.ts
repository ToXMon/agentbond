/**
 * Agent Memory - LowDB-based persistence for conversations, tasks, and reputation
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Schema types
export interface StoredMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  toolCalls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  toolCallId?: string;
}

export interface Conversation {
  id: string;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface TaskResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: unknown;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  steps: unknown[];
}

export interface ReputationData {
  agentAddress: string;
  score: number;
  tasksCompleted: number;
  tasksFailed: number;
  totalStaked: string;
  vouchData?: { voucher?: string; amount?: string; isActive?: boolean };
  lastUpdated: number;
}

export interface MemoryStats {
  totalConversations: number;
  totalTasks: number;
  totalReputationEntries: number;
  dbSize: number;
}

interface DatabaseSchema {
  conversations: Conversation[];
  tasks: TaskResult[];
  reputation: ReputationData[];
}

const DEFAULT_SCHEMA: DatabaseSchema = { conversations: [], tasks: [], reputation: [] };

let defaultMemory: AgentMemory | null = null;

export class AgentMemory {
  private db!: Low<DatabaseSchema>;
  private dbPath: string;
  private initialized = false;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(os.homedir(), '.agentbond', 'memory.json');
  }

  async initialize(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const adapter = new JSONFile<DatabaseSchema>(this.dbPath);
    this.db = new Low<DatabaseSchema>(adapter, DEFAULT_SCHEMA);
    await this.db.read();
    if (!this.db.data) { this.db.data = DEFAULT_SCHEMA; await this.db.write(); }
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.db) throw new Error('AgentMemory not initialized. Call initialize() first.');
  }

  async createConversation(id: string, metadata?: Record<string, unknown>): Promise<string> {
    this.ensureInitialized();
    const now = Date.now();
    this.db.data!.conversations.push({ id, messages: [], createdAt: now, updatedAt: now, metadata });
    await this.db.write();
    return id;
  }

  getConversation(id: string): StoredMessage[] {
    this.ensureInitialized();
    return this.db.data!.conversations.find(c => c.id === id)?.messages || [];
  }

  async addMessage(conversationId: string, message: Omit<StoredMessage, 'id' | 'timestamp'>): Promise<string> {
    this.ensureInitialized();
    const conversation = this.db.data!.conversations.find(c => c.id === conversationId);
    if (!conversation) throw new Error(`Conversation ${conversationId} not found`);
    const storedMessage: StoredMessage = { ...message, id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now() };
    conversation.messages.push(storedMessage);
    conversation.updatedAt = Date.now();
    await this.db.write();
    return storedMessage.id;
  }

  async storeTaskResult(task: Omit<TaskResult, 'endTime'>): Promise<string> {
    this.ensureInitialized();
    const existingIndex = this.db.data!.tasks.findIndex(t => t.taskId === task.taskId);
    if (existingIndex >= 0) this.db.data!.tasks[existingIndex] = task as TaskResult;
    else this.db.data!.tasks.push(task as TaskResult);
    await this.db.write();
    return task.taskId;
  }

  async updateTaskResult(taskId: string, updates: Partial<TaskResult>): Promise<void> {
    this.ensureInitialized();
    const index = this.db.data!.tasks.findIndex(t => t.taskId === taskId);
    if (index >= 0) {
      const existing = this.db.data!.tasks[index];
      if (existing) this.db.data!.tasks[index] = { ...existing, ...updates } as TaskResult;
      await this.db.write();
    }
  }

  getTaskResult(taskId: string): TaskResult | undefined {
    this.ensureInitialized();
    return this.db.data!.tasks.find(t => t.taskId === taskId);
  }

  getAllTaskResults(): TaskResult[] {
    this.ensureInitialized();
    return [...this.db.data!.tasks];
  }

  async storeReputationData(data: ReputationData): Promise<void> {
    this.ensureInitialized();
    const index = this.db.data!.reputation.findIndex(r => r.agentAddress === data.agentAddress);
    if (index >= 0) this.db.data!.reputation[index] = data;
    else this.db.data!.reputation.push(data);
    await this.db.write();
  }

  getReputationData(agentAddress: string): ReputationData | undefined {
    this.ensureInitialized();
    return this.db.data!.reputation.find(r => r.agentAddress === agentAddress);
  }

  async updateReputationScore(agentAddress: string, scoreDelta: number): Promise<void> {
    this.ensureInitialized();
    const data = this.db.data!.reputation.find(r => r.agentAddress === agentAddress);
    if (data) { data.score += scoreDelta; data.lastUpdated = Date.now(); await this.db.write(); }
  }

  async incrementTaskCount(agentAddress: string, success: boolean): Promise<void> {
    this.ensureInitialized();
    let data = this.db.data!.reputation.find(r => r.agentAddress === agentAddress);
    if (!data) { data = { agentAddress, score: 0, tasksCompleted: 0, tasksFailed: 0, totalStaked: '0', lastUpdated: Date.now() }; this.db.data!.reputation.push(data); }
    if (success) { data.tasksCompleted++; data.score += 10; }
    else { data.tasksFailed++; data.score = Math.max(0, data.score - 5); }
    data.lastUpdated = Date.now();
    await this.db.write();
  }

  getStats(): MemoryStats {
    this.ensureInitialized();
    let dbSize = 0;
    try { dbSize = fs.statSync(this.dbPath).size; } catch { /* ignore */ }
    return { totalConversations: this.db.data!.conversations.length, totalTasks: this.db.data!.tasks.length, totalReputationEntries: this.db.data!.reputation.length, dbSize };
  }

  async clearAll(): Promise<void> {
    this.ensureInitialized();
    this.db.data = DEFAULT_SCHEMA;
    await this.db.write();
  }
}

export function getDefaultMemory(): AgentMemory {
  if (!defaultMemory) defaultMemory = new AgentMemory();
  return defaultMemory;
}

export default AgentMemory;
