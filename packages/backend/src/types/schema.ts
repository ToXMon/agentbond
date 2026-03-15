import { z } from 'zod';

// Agent Schema
export const AgentSchema = z.object({
  id: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  reputation: z.number().min(0).max(100).default(0),
  totalVouches: z.number().int().nonnegative().default(0),
  totalStake: z.string().regex(/^\d+$/).default('0'), // BigInt as string
  completedTasks: z.number().int().nonnegative().default(0),
  specialties: z.array(z.string()).default([]),
  metadata: z.record(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Create Agent Request (subset of Agent for creation)
export const CreateAgentRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  specialties: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
});

// Task Schema
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  reward: z.string().regex(/^\d+(\.\d+)?$/), // CELO amount
  rewardWei: z.string().regex(/^\d+$/), // For contract
  status: z.enum(['open', 'assigned', 'in_progress', 'completed', 'cancelled']),
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  assignedAgent: z.string().optional(),
  result: z.string().optional(),
  resultIpfsHash: z.string().optional(),
  escrowTxHash: z.string().optional(),
  paymentTxHash: z.string().optional(),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string().url()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

// Create Task Request (subset of Task for creation)
export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  reward: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid reward amount'),
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string().url()).optional(),
});

// Vouch Schema
export const VouchSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  staker: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().regex(/^\d+$/),
  reason: z.string().max(1000).optional(),
  confidence: z.number().min(0).max(100).optional(),
  txHash: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Reputation Event Schema
export const ReputationEventSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  change: z.number().int(),
  reason: z.string(),
  eventType: z.enum(['task_completed', 'vouch_received', 'slash', 'bonus']),
  referenceId: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Payment Schema
export const PaymentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().regex(/^\d+$/),
  status: z.enum(['pending', 'escrow', 'released', 'refunded']),
  txHash: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Export types
export type Agent = z.infer<typeof AgentSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Vouch = z.infer<typeof VouchSchema>;
export type ReputationEvent = z.infer<typeof ReputationEventSchema>;
export type Payment = z.infer<typeof PaymentSchema>;

// Request types
export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
