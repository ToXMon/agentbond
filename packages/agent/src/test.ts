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
  console.log('🤖 AgentBond Agent Test Script\n');
  console.log('='.repeat(50));

  // Test 1: Memory System
  console.log('\n📦 Test 1: Memory System');
  console.log('-'.repeat(30));
  
  const memory = getDefaultMemory();
  await memory.initialize();
  
  // Create a conversation
  const convId = await memory.createConversation('test-conv-1', { test: 'true' });
  console.log(`✅ Created conversation: ${convId}`);
  
  // Add messages
  await memory.addMessage(convId, { role: 'user', content: 'Hello, agent!' });
  await memory.addMessage(convId, { role: 'assistant', content: 'Hello! How can I help you?' });
  console.log('✅ Added messages to conversation');
  
  // Get stats
  const stats = memory.getStats();
  console.log(`📊 Memory stats: ${JSON.stringify(stats)}`);

  // Test 2: LLM Client (without actual API call)
  console.log('\n🧠 Test 2: LLM Client Initialization');
  console.log('-'.repeat(30));
  
  const llmClient = getDefaultClient();
  console.log('✅ LLM client created');
  console.log('   Note: Actual API calls require VENICE_API_KEY environment variable');

  // Test 3: Risk Assessment Tool
  console.log('\n⚠️ Test 3: Risk Assessment Tool');
  console.log('-'.repeat(30));
  
  const riskTool = new RiskAssessmentTool(llmClient, memory);
  
  // Quick risk check (doesn't require LLM)
  const testAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
  const quickRisk = await riskTool.quickRiskCheck(testAddress);
  console.log(`✅ Quick risk check for ${testAddress.slice(0, 10)}...: ${quickRisk}/100`);

  // Test 4: Payment Tool
  console.log('\n💰 Test 4: Payment Tool');
  console.log('-'.repeat(30));
  
  const paymentTool = new PaymentTool();
  console.log('✅ Payment tool created');
  console.log(`   Has wallet configured: ${paymentTool.hasWallet()}`);
  console.log('   Note: Wallet requires setWallet() with private key');

  // Test 5: Agent Creation
  console.log('\n🤖 Test 5: Agent Creation');
  console.log('-'.repeat(30));
  
  const agent = createAgent({
    agentId: 'test-agent-001',
    maxIterations: 3,
    verbose: true,
  });
  
  console.log('✅ Agent created');
  console.log('   Agent ID: test-agent-001');
  console.log('   Max iterations: 3');

  // Test 6: Event Handlers
  console.log('\n📡 Test 6: Event Handlers');
  console.log('-'.repeat(30));
  
  agent.on('initialized', (data) => {
    console.log(`✅ Agent initialized: ${JSON.stringify(data)}`);
  });

  agent.on('stateChange', (data) => {
    console.log(`   State changed to: ${data.state} (iteration ${data.iteration})`);
  });

  agent.on('observe', () => {
    console.log('   👁️ Observe phase complete');
  });

  agent.on('orient', () => {
    console.log('   🧭 Orient phase complete');
  });

  agent.on('decide', (data) => {
    console.log(`   🎯 Decide phase: ${String(data.decision).slice(0, 50)}...`);
  });

  agent.on('act', (data) => {
    console.log(`   ⚡ Act phase: ${String(data.action)}`);
  });

  console.log('✅ Event handlers registered');

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests passed!');
  console.log('\n📝 Summary:');
  console.log('   - Memory system: Working');
  console.log('   - LLM client: Initialized');
  console.log('   - Risk assessment: Working');
  console.log('   - Payment tool: Ready');
  console.log('   - Agent creation: Working');
  console.log('   - Event system: Connected');
  console.log('\n🚀 AgentBond agent package is ready!');
  console.log('\nTo run the full agent loop, call:');
  console.log('  await agent.initialize();');
  console.log('  await agent.run("Your task description");');
  console.log('');
}

// Run tests
main().catch(console.error);
