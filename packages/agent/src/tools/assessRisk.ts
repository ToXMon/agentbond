/**
 * Risk Assessment Tool - Private risk assessment using Venice API
 * Analyzes agent history and reputation without exposing sensitive data
 */

import { z } from 'zod';
import { VeniceLLMClient, getDefaultClient } from '../llm.js';
import { AgentMemory, getDefaultMemory } from '../memory.js';

// Risk assessment input schema
export const RiskAssessmentInputSchema = z.object({
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  taskContext: z.string().optional(),
  stakeAmount: z.string().optional(),
  includeHistory: z.boolean().default(true),
});

export type RiskAssessmentInput = z.infer<typeof RiskAssessmentInputSchema>;

// Risk assessment result
export interface RiskAssessmentResult {
  agentAddress: string;
  riskScore: number;
  confidence: number;
  factors: RiskFactor[];
  recommendation: 'approve' | 'review' | 'reject';
  reasoning: string;
  timestamp: number;
}

export interface RiskFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export const RISK_LEVELS = {
  LOW: { min: 0, max: 30, recommendation: 'approve' as const },
  MEDIUM: { min: 31, max: 60, recommendation: 'review' as const },
  HIGH: { min: 61, max: 100, recommendation: 'reject' as const },
};

export class RiskAssessmentTool {
  private llmClient: VeniceLLMClient;
  private memory: AgentMemory;

  constructor(llmClient?: VeniceLLMClient, memory?: AgentMemory) {
    this.llmClient = llmClient || getDefaultClient();
    this.memory = memory || getDefaultMemory();
  }

  async assessRisk(input: RiskAssessmentInput): Promise<RiskAssessmentResult> {
    const validated = RiskAssessmentInputSchema.parse(input);
    const agentData = await this.gatherAgentData(validated.agentAddress);
    const prompt = this.buildAssessmentPrompt(agentData, validated);
    
    const response = await this.llmClient.chat([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt },
    ]);

    return this.parseAssessmentResponse(validated.agentAddress, response.content);
  }

  private async gatherAgentData(agentAddress: string): Promise<{
    reputation?: { score: number; tasksCompleted: number; tasksFailed: number; totalStaked: string };
    taskHistory: Array<{ status: string; timestamp: number }>;
    vouchData?: { voucher?: string; amount?: string; isActive?: boolean };
  }> {
    const reputationData = this.memory.getReputationData(agentAddress);
    const allTasks = this.memory.getAllTaskResults();
    const agentTasks = allTasks.filter(
      task => task.input && typeof task.input === 'object' && 'agentAddress' in task.input
    );

    return {
      reputation: reputationData ? {
        score: reputationData.score,
        tasksCompleted: reputationData.tasksCompleted,
        tasksFailed: reputationData.tasksFailed,
        totalStaked: reputationData.totalStaked,
      } : undefined,
      taskHistory: agentTasks.map(t => ({ status: t.status, timestamp: t.startTime })),
      vouchData: reputationData?.vouchData,
    };
  }

  private getSystemPrompt(): string {
    return `You are a private risk assessment AI. Your job is to analyze agent data and provide a risk score from 0-100.

You MUST respond in the following JSON format only:
{
  "riskScore": <number 0-100>,
  "confidence": <number 0-1>,
  "factors": [{ "name": "<factor>", "impact": "<positive|negative|neutral>", "weight": <0-1>, "description": "<desc>" }],
  "recommendation": "<approve|review|reject>",
  "reasoning": "<brief explanation>"
}

Risk Score Guidelines:
- 0-30: Low risk (approve)
- 31-60: Medium risk (review recommended)
- 61-100: High risk (reject)`;
  }

  private buildAssessmentPrompt(
    agentData: Awaited<ReturnType<typeof this.gatherAgentData>>,
    input: RiskAssessmentInput
  ): string {
    const parts: string[] = [`Assess the risk for agent: ${input.agentAddress}`];
    if (input.taskContext) parts.push(`Task Context: ${input.taskContext}`);
    if (input.stakeAmount) parts.push(`Proposed Stake: ${input.stakeAmount} CELO`);
    if (agentData.reputation) {
      parts.push('\nReputation Data:');
      parts.push(`- Score: ${agentData.reputation.score}`);
      parts.push(`- Tasks Completed: ${agentData.reputation.tasksCompleted}`);
      parts.push(`- Tasks Failed: ${agentData.reputation.tasksFailed}`);
    } else {
      parts.push('\nNo reputation data available.');
    }
    if (input.includeHistory && agentData.taskHistory.length > 0) {
      parts.push(`\nRecent tasks: ${agentData.taskHistory.length}`);
    }
    return parts.join('\n');
  }

  private parseAssessmentResponse(agentAddress: string, response: string): RiskAssessmentResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      const parsed = JSON.parse(jsonMatch[0]);
      const riskScore = Math.max(0, Math.min(100, Number(parsed.riskScore) || 50));
      const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));
      let recommendation: 'approve' | 'review' | 'reject' = 'review';
      if (riskScore <= 30) recommendation = 'approve';
      else if (riskScore <= 60) recommendation = 'review';
      else recommendation = 'reject';

      return {
        agentAddress, riskScore, confidence,
        factors: (parsed.factors || []).map((f: RiskFactor) => ({
          name: String(f.name || 'Unknown'),
          impact: ['positive', 'negative', 'neutral'].includes(f.impact) ? f.impact : 'neutral',
          weight: Math.max(0, Math.min(1, Number(f.weight) || 0.5)),
          description: String(f.description || ''),
        })),
        recommendation: parsed.recommendation || recommendation,
        reasoning: String(parsed.reasoning || 'No reasoning provided'),
        timestamp: Date.now(),
      };
    } catch {
      return {
        agentAddress, riskScore: 50, confidence: 0.3,
        factors: [{ name: 'Parse Error', impact: 'neutral', weight: 1, description: 'Unable to parse response' }],
        recommendation: 'review', reasoning: 'Risk assessment failed due to parsing error', timestamp: Date.now(),
      };
    }
  }

  async quickRiskCheck(agentAddress: string): Promise<number> {
    const reputationData = this.memory.getReputationData(agentAddress);
    if (!reputationData) return 50;
    const totalTasks = reputationData.tasksCompleted + reputationData.tasksFailed;
    const successRate = totalTasks > 0 ? reputationData.tasksCompleted / totalTasks : 0.5;
    let score = 100 - (successRate * 60);
    if (reputationData.score > 100) score -= 20;
    else if (reputationData.score > 50) score -= 10;
    if (reputationData.vouchData?.isActive) score -= 15;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

export default RiskAssessmentTool;

export const assessRiskToolDefinition = {
  type: 'function' as const,
  function: {
    name: 'assess_risk',
    description: 'Assess the risk level of an agent based on reputation and history.',
    parameters: {
      type: 'object',
      properties: {
        agentAddress: { type: 'string', description: 'The Ethereum address of the agent to assess (0x...)' },
        taskContext: { type: 'string', description: 'Optional context about the task being considered' },
        stakeAmount: { type: 'string', description: 'Optional stake amount being considered (in CELO)' },
        includeHistory: { type: 'boolean', description: 'Whether to include task history (default: true)' },
      },
      required: ['agentAddress'],
    },
  },
};
