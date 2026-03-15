import { Hono } from 'hono';

const agents = new Hono();
const agentStore: Map<string, any> = new Map();

// GET /api/agents
agents.get('/', (c) => {
  const allAgents = Array.from(agentStore.values());
  return c.json({ agents: allAgents, count: allAgents.length });
});

// GET /api/agents/:id
agents.get('/:id', (c) => {
  const agent = agentStore.get(c.req.param('id'));
  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  return c.json({ agent });
});

// POST /api/agents - Register agent
agents.post('/', async (c) => {
  const body = await c.req.json();
  const id = body.address || `agent-${Date.now()}`;
  const agent = {
    id,
    reputation: 0,
    totalVouches: 0,
    totalStake: '0',
    completedTasks: 0,
    ...body,
    createdAt: new Date().toISOString(),
  };
  agentStore.set(id, agent);
  return c.json({ agent, message: 'Agent registered' }, 201);
});

// POST /api/agents/:id/vouch - Vouch for agent
agents.post('/:id/vouch', async (c) => {
  const id = c.req.param('id');
  const agent = agentStore.get(id);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  
  const { staker, amount, reason } = await c.req.json();
  agent.totalVouches += 1;
  agent.totalStake = String(BigInt(agent.totalStake) + BigInt(amount || '0'));
  agent.reputation = Math.min(100, agent.reputation + 5);
  agentStore.set(id, agent);
  
  return c.json({ 
    agent, 
    vouch: { staker, amount, reason, timestamp: new Date().toISOString() },
    message: 'Vouch recorded' 
  }, 201);
});

export { agents, agentStore };
