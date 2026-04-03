/**
 * Test script for AgentBond Agent
 * Demonstrates the agent loop and tool functionality
 */

import { createAgent } from './agent.js';
import { getDefaultMemory } from './memory.js';
import { getDefaultClient } from './llm.js';
import { RiskAssessmentTool } from './tools/assessRisk.js';
import { PaymentTool } from './tools/payment.js';

async function main() {

  // Test 1: Memory System
  
  const memory = getDefaultMemory();
  await memory.initialize();
  
  // Create a conversation
  const convId = await memory.createConversation('test-conv-1', { test: 'true' });
  
  // Add messages
  await memory.addMessage(convId, { role: 'user', content: 'Hello, agent!' });
  await memory.addMessage(convId, { role: 'assistant', content: 'Hello! How can I help you?' });
  
  // Get stats
  const stats = memory.getStats();

  // Test 2: LLM Client (without actual API call)
  
  const llmClient = getDefaultClient();

  // Test 3: Risk Assessment Tool
  
  const riskTool = new RiskAssessmentTool(llmClient, memory);
  
  // Quick risk check (doesn't require LLM)
  const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
  const quickRisk = await riskTool.quickRiskCheck(testAddress);

  // Test 4: Payment Tool
  
  const paymentTool = new PaymentTool();

  // Test 5: Agent Creation
  
  const agent = createAgent({
    agentId: 'test-agent-001',
    maxIterations: 3,
    verbose: true,
  });
  

  // Test 6: Event Handlers
  
  agent.on('initialized', (data) => {
  });

  agent.on('stateChange', (data) => {
  });

  agent.on('observe', () => {
  });

  agent.on('orient', () => {
  });

  agent.on('decide', (data) => {
  });

  agent.on('act', (data) => {
  });


  // Summary
}

// Run tests
main().catch(console.error);
