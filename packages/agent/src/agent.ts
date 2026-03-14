/**
 * Main Agent Loop - Scott Morris pattern: observe → orient → decide → act
 * Integrates all tools for autonomous agent operation
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import { VeniceLLMClient, getDefaultClient } from './llm.js';
import type { ChatMessage, ToolDefinition } from './llm.js';
import { AgentMemory, getDefaultMemory } from './memory.js';
import { VouchTool } from './tools/vouch.js';
import { vouchToolDefinition } from './tools/vouch.js';
import { RiskAssessmentTool } from './tools/assessRisk.js';
import { assessRiskToolDefinition } from './tools/assessRisk.js';
import { PaymentTool } from './tools/payment.js';
import { paymentToolDefinition } from './tools/payment.js';
import { TaskExecutionTool } from './tools/executeTask.js';
import type { TaskProgressEvent } from './tools/executeTask.js';
import { executeTaskToolDefinition } from './tools/executeTask.js';

// Agent configuration schema
export const AgentConfigSchema = z.object({
  agentId: z.string(),
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  maxIterations: z.number().positive().default(10),
  timeout: z.number().positive().default(300000), // 5 minutes
  verbose: z.boolean().default(false),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Agent state types
export type AgentState = 'idle' | 'observing' | 'orienting' | 'deciding' | 'acting' | 'error';

// Agent loop context
export interface AgentLoopContext {
  iteration: number;
  state: AgentState;
  input: unknown;
  observations: unknown[];
  orientation: string | null;
  decision: string | null;
  action: string | null;
  result: unknown;
  startTime: number;
}

// All tool definitions for LLM function calling
export const allToolDefinitions: ToolDefinition[] = [
  vouchToolDefinition,
  assessRiskToolDefinition,
  paymentToolDefinition,
  executeTaskToolDefinition,
];

/**
 * AgentBond Autonomous Agent
 * Implements the OODA loop pattern for intelligent task execution
 */
export class AgentBondAgent extends EventEmitter {
  private config: AgentConfig;
  private llmClient: VeniceLLMClient;
  private memory: AgentMemory;
  private vouchTool: VouchTool;
  private riskTool: RiskAssessmentTool;
  private paymentTool: PaymentTool;
  private taskTool: TaskExecutionTool;
  private conversationId: string | null = null;
  private currentState: AgentState = 'idle';

  constructor(config: Partial<AgentConfig> & { agentId: string }) {
    super();
    this.config = AgentConfigSchema.parse(config);
    
    // Initialize components
    this.llmClient = getDefaultClient();
    this.memory = getDefaultMemory();
    this.vouchTool = new VouchTool(
      '0x0000000000000000000000000000000000000000' as `0x${string}` // Will be set properly
    );
    this.riskTool = new RiskAssessmentTool(this.llmClient, this.memory);
    this.paymentTool = new PaymentTool();
    this.taskTool = new TaskExecutionTool(this.llmClient, this.memory);

    // Forward task progress events
    this.taskTool.onProgress((event: TaskProgressEvent) => {
      this.emit('taskProgress', event);
    });
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    await this.llmClient.initialize();
    await this.memory.initialize();
    
    // Create conversation for this session
    this.conversationId = `conv-${this.config.agentId}-${Date.now()}`;
    await this.memory.createConversation(this.conversationId, {
      agentId: this.config.agentId,
    });

    this.emit('initialized', { agentId: this.config.agentId });
  }

  /**
   * Set wallet for contract interactions
   */
  setWallet(privateKey: `0x${string}`): void {
    this.vouchTool.setWallet(privateKey);
    this.paymentTool.setWallet(privateKey);
  }

  /**
   * Set staking contract address
   */
  setStakingContract(address: `0x${string}`): void {
    this.vouchTool = new VouchTool(address);
  }

  /**
   * Run the main agent loop (OODA pattern)
   */
  async run(input: string): Promise<unknown> {
    const context: AgentLoopContext = {
      iteration: 0,
      state: 'idle',
      input,
      observations: [],
      orientation: null,
      decision: null,
      action: null,
      result: null,
      startTime: Date.now(),
    };

    try {
      while (context.iteration < this.config.maxIterations) {
        context.iteration++;
        
        // OBSERVE - Gather information
        context.state = 'observing';
        this.emit('stateChange', { state: 'observing', iteration: context.iteration });
        await this.observe(context);

        // ORIENT - Analyze and understand
        context.state = 'orienting';
        this.emit('stateChange', { state: 'orienting', iteration: context.iteration });
        await this.orient(context);

        // DECIDE - Choose action
        context.state = 'deciding';
        this.emit('stateChange', { state: 'deciding', iteration: context.iteration });
        await this.decide(context);

        // Check if we should stop
        if (context.decision === 'COMPLETE' || context.decision === 'DONE') {
          context.state = 'idle';
          break;
        }

        // ACT - Execute action
        context.state = 'acting';
        this.emit('stateChange', { state: 'acting', iteration: context.iteration });
        await this.act(context);

        // Check for completion
        if (context.result && typeof context.result === 'object' && 'complete' in context.result) {
          break;
        }
      }

      return context.result;

    } catch (error: unknown) {
      context.state = 'error';
      this.emit('error', { error, context });
      throw error;
    }
  }

  /**
   * OBSERVE - Gather information about the environment and task
   */
  private async observe(context: AgentLoopContext): Promise<void> {
    const systemPrompt = `You are the OBSERVE phase of an autonomous agent.
Your job is to gather information and observe the current state.
Be thorough but focused. List your observations clearly.`;

    const userPrompt = `Input: ${JSON.stringify(context.input)}
Previous observations: ${JSON.stringify(context.observations.slice(-3))}

Observe and gather relevant information. What do you see? What data is available?`;

    const response = await this.llmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    context.observations.push({
      iteration: context.iteration,
      content: response.content,
      timestamp: Date.now(),
    });

    await this.memory.addMessage(this.conversationId!, {
      role: 'assistant',
      content: `[OBSERVE] ${response.content}`,
    });

    this.emit('observe', { observations: context.observations });
  }

  /**
   * ORIENT - Analyze observations and form understanding
   */
  private async orient(context: AgentLoopContext): Promise<void> {
    const systemPrompt = `You are the ORIENT phase of an autonomous agent.
Your job is to analyze observations and form a coherent understanding.
Identify patterns, assess risks, and determine priorities.`;

    const userPrompt = `Latest observations: ${JSON.stringify(context.observations.slice(-2))}
Previous orientation: ${context.orientation || 'None'}

Analyze the observations. What patterns do you see? What is the current situation?`;

    const response = await this.llmClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    context.orientation = response.content;

    await this.memory.addMessage(this.conversationId!, {
      role: 'assistant',
      content: `[ORIENT] ${response.content}`,
    });

    this.emit('orient', { orientation: context.orientation });
  }

  /**
   * DECIDE - Choose the next action
   */
  private async decide(context: AgentLoopContext): Promise<void> {
    const systemPrompt = `You are the DECIDE phase of an autonomous agent.
Your job is to decide what action to take next.
You can use tools or decide to complete the task.

Available tools:
- vouch_for_agent: Vouch for an agent by staking CELO
- assess_risk: Assess risk level of an agent
- handle_payment: Create payment authorization
- execute_task: Execute a task through the pipeline

If the task is complete, respond with exactly: COMPLETE
Otherwise, specify which tool to use and why.`;

    const userPrompt = `Current orientation: ${context.orientation}
Previous actions: ${context.action || 'None'}

Decide: What action should we take? Which tool should we use? Or should we COMPLETE?`;

    const response = await this.llmClient.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      allToolDefinitions,
      'auto'
    );

    context.decision = response.content;

    // Check for tool calls
    if (response.toolCalls && response.toolCalls.length > 0) {
      context.decision = JSON.stringify(response.toolCalls.map(tc => ({
        name: tc.function.name,
        args: tc.function.arguments,
      })));
    }

    await this.memory.addMessage(this.conversationId!, {
      role: 'assistant',
      content: `[DECIDE] ${context.decision}`,
      toolCalls: response.toolCalls,
    });

    this.emit('decide', { decision: context.decision, toolCalls: response.toolCalls });
  }

  /**
   * ACT - Execute the decided action
   */
  private async act(context: AgentLoopContext): Promise<void> {
    // Get the last assistant message with tool calls
    const conversation = this.memory.getConversation(this.conversationId!);
    const lastMessage = conversation[conversation.length - 1];

    if (!lastMessage?.toolCalls?.length) {
      // No tool calls, just record the action
      context.action = context.decision;
      context.result = { message: context.decision };
      return;
    }

    // Execute each tool call
    const results: unknown[] = [];

    for (const toolCall of lastMessage.toolCalls) {
      const result = await this.executeToolCall(toolCall);
      results.push(result);

      // Add tool result to conversation
      await this.memory.addMessage(this.conversationId!, {
        role: 'tool',
        content: JSON.stringify(result),
        toolCallId: toolCall.id,
      });
    }

    context.action = `Executed ${results.length} tool(s)`;
    context.result = results.length === 1 ? results[0] : results;

    this.emit('act', { action: context.action, result: context.result });
  }

  /**
   * Execute a tool call
   */
  private async executeToolCall(toolCall: { id: string; function: { name: string; arguments: string } }): Promise<unknown> {
    const args = JSON.parse(toolCall.function.arguments);

    switch (toolCall.function.name) {
      case 'vouch_for_agent':
        return this.vouchTool.vouchForAgent({
          targetAgent: args.targetAgent,
          stakeAmount: args.stakeAmount,
          cooldownPeriod: args.cooldownPeriod,
        });

      case 'assess_risk':
        return this.riskTool.assessRisk({
          agentAddress: args.agentAddress,
          taskContext: args.taskContext,
          stakeAmount: args.stakeAmount,
          includeHistory: args.includeHistory ?? true,
        });

      case 'handle_payment':
        return this.paymentTool.createAuthorization({
          recipient: args.recipient,
          amount: args.amount,
          description: args.description,
          validAfter: args.validAfter,
          validBefore: args.validBefore,
        });

      case 'execute_task':
        return this.taskTool.executeTask({
          taskId: args.taskId,
          taskType: args.taskType || 'full_pipeline',
          description: args.description,
          parameters: args.parameters,
          timeout: args.timeout ?? 300000,
        });

      default:
        return { error: `Unknown tool: ${toolCall.function.name}` };
    }
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return this.currentState;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): ReturnType<AgentMemory['getStats']> {
    return this.memory.getStats();
  }

  /**
   * Quick task execution (simplified interface)
   */
  async executeQuickTask(description: string, parameters: Record<string, unknown>): Promise<unknown> {
    return this.taskTool.executeTask({
      taskId: `quick-${Date.now()}`,
      taskType: 'full_pipeline',
      description,
      parameters,
      timeout: 300000,
    });
  }

  /**
   * Assess agent risk (simplified interface)
   */
  async quickRiskAssessment(agentAddress: string): Promise<number> {
    return this.riskTool.quickRiskCheck(agentAddress);
  }
}

// Default export
export default AgentBondAgent;

// Factory function for creating agents
export function createAgent(config: Partial<AgentConfig> & { agentId: string }): AgentBondAgent {
  return new AgentBondAgent(config);
}
