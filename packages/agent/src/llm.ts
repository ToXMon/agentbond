/**
 * Venice SDK LLM Client - Private inference for AgentBond
 * Provides chat completions with streaming support
 */

// @ts-ignore - Venice SDK types may not resolve correctly
import VeniceAI from '@venice-dev-tools/core';
import { z } from 'zod';

// Configuration schema
export const VeniceConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  timeout: z.number().optional().default(30000),
  model: z.string().optional().default('llama-3.3-70b'),
});

export type VeniceConfig = z.infer<typeof VeniceConfigSchema>;

// Chat message types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

// Chat response
export interface ChatResponse {
  content: string;
  role: string;
  toolCalls?: ChatMessage['toolCalls'];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Tool definition for function calling
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// Stream callback type
export type StreamCallback = (chunk: string) => void;

// Default configuration
const DEFAULT_CONFIG: Partial<VeniceConfig> = {
  baseUrl: 'https://api.venice.ai/api/v1',
  timeout: 30000,
  model: 'llama-3.3-70b',
};

// Singleton instance
let defaultClient: VeniceLLMClient | null = null;

/**
 * Venice LLM Client for private inference
 */
export class VeniceLLMClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private config: VeniceConfig;
  private initialized = false;

  constructor(config: Partial<VeniceConfig> = {}) {
    this.config = VeniceConfigSchema.parse({
      ...DEFAULT_CONFIG,
      ...config,
    });
  }

  /**
   * Initialize the Venice client
   */
  async initialize(): Promise<void> {
    const apiKey = this.config.apiKey || process.env.VENICE_API_KEY;
    
    if (!apiKey) {
      console.warn('Venice API key not provided. Set VENICE_API_KEY env var or pass in config.');
    }
    
    // Create Venice client
    this.client = new VeniceAI({
      apiKey: apiKey || undefined,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
    });
    
    this.initialized = true;
  }

  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.client) {
      throw new Error('VeniceLLMClient not initialized. Call initialize() first.');
    }
  }

  /**
   * Send a chat completion request
   */
  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    toolChoice?: 'auto' | 'none' | 'required'
  ): Promise<ChatResponse> {
    this.ensureInitialized();

    try {
      // Convert messages to Venice format
      const veniceMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
        ...(msg.toolCallId && { tool_call_id: msg.toolCallId }),
        ...(msg.toolCalls && { tool_calls: msg.toolCalls }),
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestParams: any = {
        model: this.config.model!,
        messages: veniceMessages,
        temperature: 0.7,
      };

      if (tools && tools.length > 0) {
        requestParams.tools = tools;
      }
      if (toolChoice) {
        requestParams.tool_choice = toolChoice;
      }

      const response = await this.client.chat.completions.create(requestParams);

      // Extract response content
      const choice = response.choices[0];
      const message = choice.message;

      return {
        content: message.content || '',
        role: message.role,
        toolCalls: message.tool_calls?.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: typeof tc.function.arguments === 'string' 
              ? tc.function.arguments 
              : JSON.stringify(tc.function.arguments),
          },
        })),
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Venice API Error: ${errorMessage}`);
    }
  }

  /**
   * Stream a chat completion request
   */
  async *chatStream(
    messages: ChatMessage[],
    onChunk?: StreamCallback
  ): AsyncGenerator<string, void, unknown> {
    this.ensureInitialized();

    // Convert messages to Venice format
    const veniceMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model!,
        messages: veniceMessages,
        stream: true,
        temperature: 0.7,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of stream as AsyncIterable<any>) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          if (onChunk) {
            onChunk(content);
          }
          yield content;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Venice API Error: ${errorMessage}`);
    }
  }

  /**
   * Get available models
   */
  async listModels(): Promise<string[]> {
    this.ensureInitialized();

    try {
      const response = await this.client.models.list();
      return response.data.map((model: { id: string }) => model.id);
    } catch (error: unknown) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  /**
   * Set the model to use
   */
  setModel(model: string): void {
    this.config.model = model;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.config.model!;
  }
}

/**
 * Get or create the default client instance
 */
export function getDefaultClient(): VeniceLLMClient {
  if (!defaultClient) {
    defaultClient = new VeniceLLMClient();
  }
  return defaultClient;
}

/**
 * Create a new client with custom config
 */
export function createClient(config: Partial<VeniceConfig> = {}): VeniceLLMClient {
  return new VeniceLLMClient(config);
}

// Default export
export default VeniceLLMClient;
