/**
 * Task Execution Tool - Main task execution logic
 * Stages: Research → Processing → Validation
 * Emits progress events for frontend visualization
 */

import { z } from 'zod';
import { EventEmitter } from 'events';
import { VeniceLLMClient, getDefaultClient } from '../llm.js';
import type { ChatMessage, ToolDefinition, ChatResponse } from '../llm.js';
import { AgentMemory, getDefaultMemory } from '../memory.js';

// Task execution input schema
export const TaskExecutionInputSchema = z.object({
  taskId: z.string(),
  taskType: z.enum(['research', 'processing', 'validation', 'full_pipeline']).default('full_pipeline'),
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()),
  timeout: z.number().optional().default(300000), // 5 minutes default
});

export type TaskExecutionInput = z.infer<typeof TaskExecutionInputSchema>;

// Task execution stages
export type TaskStage = 'research' | 'processing' | 'validation';

// Stage result
export interface StageResult {
  stage: TaskStage;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: unknown;
  timestamp: number;
  error?: string;
}

// Progress event
export interface TaskProgressEvent {
  taskId: string;
  stage: TaskStage;
  status: StageResult['status'];
  progress: number; // 0-100
  message: string;
  output?: unknown;
}

// Task execution result
export interface TaskExecutionResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  stages: StageResult[];
  finalOutput: unknown;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

// Tool definitions for task execution
const taskTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_data',
      description: 'Analyze data and extract insights',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'string', description: 'Data to analyze' },
          analysis_type: { type: 'string', description: 'Type of analysis' },
        },
        required: ['data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_result',
      description: 'Validate a result against criteria',
      parameters: {
        type: 'object',
        properties: {
          result: { type: 'string', description: 'Result to validate' },
          criteria: { type: 'string', description: 'Validation criteria' },
        },
        required: ['result', 'criteria'],
      },
    },
  },
];

/**
 * Task Execution Tool
 */
export class TaskExecutionTool extends EventEmitter {
  private llmClient: VeniceLLMClient;
  private memory: AgentMemory;
  private activeTasks: Map<string, TaskExecutionResult> = new Map();

  constructor(llmClient?: VeniceLLMClient, memory?: AgentMemory) {
    super();
    this.llmClient = llmClient || getDefaultClient();
    this.memory = memory || getDefaultMemory();
  }

  /**
   * Execute a task through the full pipeline or specific stage
   */
  async executeTask(input: TaskExecutionInput): Promise<TaskExecutionResult> {
    const validated = TaskExecutionInputSchema.parse(input);
    
    // Initialize result
    const result: TaskExecutionResult = {
      taskId: validated.taskId,
      status: 'running',
      stages: [],
      finalOutput: null,
      startTime: Date.now(),
    };

    this.activeTasks.set(validated.taskId, result);

    // Store initial task in memory
    await this.memory.storeTaskResult({
      taskId: validated.taskId,
      status: 'running',
      input: validated.parameters,
      startTime: result.startTime,
      steps: [],
    });

    try {
      let currentOutput: unknown = validated.parameters;

      // Execute stages based on task type
      if (validated.taskType === 'full_pipeline' || validated.taskType === 'research') {
        currentOutput = await this.executeStage(
          validated.taskId,
          'research',
          validated.description,
          currentOutput
        );
        result.stages.push(this.activeTasks.get(validated.taskId)!.stages.find(s => s.stage === 'research')!);
      }

      if (validated.taskType === 'full_pipeline' || validated.taskType === 'processing') {
        currentOutput = await this.executeStage(
          validated.taskId,
          'processing',
          validated.description,
          currentOutput
        );
        result.stages.push(this.activeTasks.get(validated.taskId)!.stages.find(s => s.stage === 'processing')!);
      }

      if (validated.taskType === 'full_pipeline' || validated.taskType === 'validation') {
        currentOutput = await this.executeStage(
          validated.taskId,
          'validation',
          validated.description,
          currentOutput
        );
        result.stages.push(this.activeTasks.get(validated.taskId)!.stages.find(s => s.stage === 'validation')!);
      }

      // Mark as completed
      result.status = 'completed';
      result.finalOutput = currentOutput;
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;

    } catch (error: unknown) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
    }

    // Update memory
    await this.memory.updateTaskResult(validated.taskId, {
      status: result.status,
      output: result.finalOutput,
      error: result.error,
      endTime: result.endTime,
      steps: result.stages,
    });

    this.activeTasks.delete(validated.taskId);
    return result;
  }

  /**
   * Execute a single stage
   */
  private async executeStage(
    taskId: string,
    stage: TaskStage,
    description: string,
    input: unknown
  ): Promise<unknown> {
    // Emit progress event
    this.emitProgress({
      taskId,
      stage,
      status: 'running',
      progress: 0,
      message: `Starting ${stage} stage`,
    });

    const stageResult: StageResult = {
      stage,
      status: 'running',
      output: null,
      timestamp: Date.now(),
    };

    try {
      // Build stage-specific prompt
      const prompt = this.buildStagePrompt(stage, description, input);
      
      // Execute with LLM
      const response = await this.llmClient.chat([
        { role: 'system', content: this.getStageSystemPrompt(stage) },
        { role: 'user', content: prompt },
      ]);

      // Process response and any tool calls
      const output = await this.processStageResponse(stage, response, taskId);

      stageResult.status = 'completed';
      stageResult.output = output;
      stageResult.timestamp = Date.now();

      this.emitProgress({
        taskId,
        stage,
        status: 'completed',
        progress: 100,
        message: `Completed ${stage} stage`,
        output,
      });

      return output;

    } catch (error: unknown) {
      stageResult.status = 'failed';
      stageResult.error = error instanceof Error ? error.message : 'Unknown error';
      stageResult.timestamp = Date.now();

      this.emitProgress({
        taskId,
        stage,
        status: 'failed',
        progress: 100,
        message: `Failed ${stage} stage: ${stageResult.error}`,
      });

      throw error;
    }
  }

  /**
   * Get system prompt for each stage
   */
  private getStageSystemPrompt(stage: TaskStage): string {
    const prompts: Record<TaskStage, string> = {
      research: `You are a research agent. Your job is to gather relevant information and context for the task.
Use the search_web tool when needed.
Provide a comprehensive summary of your findings.
Be thorough but focused on information relevant to the task.`,

      processing: `You are a processing agent. Your job is to process the research findings and generate outputs.
Use the analyze_data tool for complex analysis.
Provide clear, actionable results.
Format your output in a structured way.`,

      validation: `You are a validation agent. Your job is to validate the processed results.
Use the validate_result tool to check against criteria.
Confirm the output meets quality standards.
Provide a final validated result with confidence score.`,
    };

    return prompts[stage];
  }

  /**
   * Build stage-specific prompt
   */
  private buildStagePrompt(stage: TaskStage, description: string, input: unknown): string {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input, null, 2);

    const prompts: Record<TaskStage, string> = {
      research: `Task: ${description}

Input data:
${inputStr}

Research and gather relevant information. Focus on:
1. Context and background information
2. Key facts and data points
3. Relevant patterns or trends
4. Potential challenges or considerations

Provide your research findings in a structured format.`,

      processing: `Task: ${description}

Research findings:
${inputStr}

Process this information and generate the required output. Focus on:
1. Extracting key insights
2. Applying transformations or calculations
3. Structuring the output clearly
4. Addressing the original task requirements

Provide your processed results.`,

      validation: `Task: ${description}

Processed results:
${inputStr}

Validate these results against the task requirements. Focus on:
1. Completeness - are all requirements addressed?
2. Accuracy - is the information correct?
3. Quality - does it meet standards?
4. Actionability - can the results be used?

Provide your validation result with a confidence score (0-1).`,
    };

    return prompts[stage];
  }

  /**
   * Process stage response from LLM
   */
  private async processStageResponse(
    stage: TaskStage,
    response: ChatResponse,
    taskId: string
  ): Promise<unknown> {
    // Handle tool calls if present
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        // Simulate tool execution (in production, these would be real implementations)
        const result = await this.executeToolCall(toolCall);
        
        this.emitProgress({
          taskId,
          stage,
          status: 'running',
          progress: 50,
          message: `Executed tool: ${toolCall.function.name}`,
          output: result,
        });
      }
    }

    // Return the content as the output
    return {
      content: response.content,
      toolCallsExecuted: response.toolCalls?.length || 0,
    };
  }

  /**
   * Execute a tool call (simulated for now)
   */
  private async executeToolCall(toolCall: { function: { name: string; arguments: string } }): Promise<unknown> {
    const args = JSON.parse(toolCall.function.arguments);
    
    // Simulated tool implementations
    switch (toolCall.function.name) {
      case 'search_web':
        return { query: args.query, results: ['Simulated search result 1', 'Simulated search result 2'] };
      case 'analyze_data':
        return { analysis_type: args.analysis_type, insights: ['Simulated insight'] };
      case 'validate_result':
        return { valid: true, confidence: 0.85, criteria: args.criteria };
      default:
        return { error: 'Unknown tool' };
    }
  }

  /**
   * Emit progress event
   */
  private emitProgress(event: TaskProgressEvent): void {
    this.emit('progress', event);
  }

  /**
   * Get active task status
   */
  getTaskStatus(taskId: string): TaskExecutionResult | undefined {
    return this.activeTasks.get(taskId);
  }

  /**
   * Cancel an active task
   */
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'running') {
      task.status = 'failed';
      task.error = 'Task cancelled by user';
      task.endTime = Date.now();
      this.activeTasks.delete(taskId);
      return true;
    }
    return false;
  }

  /**
   * Subscribe to progress events
   */
  onProgress(callback: (event: TaskProgressEvent) => void): () => void {
    this.on('progress', callback);
    return () => this.off('progress', callback);
  }
}

// Tool definition for LLM function calling
export const executeTaskToolDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'execute_task',
    description: 'Execute a task through the Research → Processing → Validation pipeline. Emits progress events.',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Unique identifier for the task',
        },
        taskType: {
          type: 'string',
          enum: ['research', 'processing', 'validation', 'full_pipeline'],
          description: 'Type of task execution (default: full_pipeline)',
        },
        description: {
          type: 'string',
          description: 'Description of the task to execute',
        },
        parameters: {
          type: 'object',
          description: 'Input parameters for the task',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 300000)',
        },
      },
      required: ['taskId', 'description', 'parameters'],
    },
  },
};

// Default export
export default TaskExecutionTool;
