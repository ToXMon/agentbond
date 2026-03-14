/**
 * AgentBond Agent Package
 * Main exports for the autonomous agent loop with Venice SDK integration
 */

// LLM Client
export { VeniceLLMClient, getDefaultClient } from './llm.js';
export type { ChatMessage, ChatResponse, ToolDefinition, StreamCallback } from './llm.js';

// Memory
export { AgentMemory, getDefaultMemory } from './memory.js';
export type { 
  Conversation, 
  TaskResult, 
  ReputationData, 
  MemoryStats,
  StoredMessage
} from './memory.js';

// Tools
export { VouchTool } from './tools/vouch.js';
export type { VouchInput, VouchResult } from './tools/vouch.js';
export { vouchToolDefinition } from './tools/vouch.js';

export { RiskAssessmentTool, RISK_LEVELS } from './tools/assessRisk.js';
export type { 
  RiskAssessmentInput, 
  RiskAssessmentResult, 
  RiskFactor 
} from './tools/assessRisk.js';
export { assessRiskToolDefinition } from './tools/assessRisk.js';

export { PaymentTool } from './tools/payment.js';
export type { 
  PaymentInput, 
  PaymentResult, 
  X402Response 
} from './tools/payment.js';
export { paymentToolDefinition } from './tools/payment.js';

export { TaskExecutionTool } from './tools/executeTask.js';
export type { 
  TaskExecutionInput, 
  TaskExecutionResult, 
  TaskStage, 
  StageResult, 
  TaskProgressEvent 
} from './tools/executeTask.js';
export { executeTaskToolDefinition } from './tools/executeTask.js';

// Main Agent
export { AgentBondAgent, createAgent } from './agent.js';
export type { AgentConfig, AgentState, AgentLoopContext } from './agent.js';
export { allToolDefinitions } from './agent.js';

// Default export
import { AgentBondAgent } from './agent.js';
export default AgentBondAgent;
