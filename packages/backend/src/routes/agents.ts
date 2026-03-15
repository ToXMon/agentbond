import { Hono } from 'hono';
import { db } from '../services/database';
import { CreateAgentRequestSchema, AgentSchema, Agent } from '../types/schema';
import { nanoid } from 'nanoid';

const agents = new Hono();

// GET /api/agents - List all agents
agents.get('/', (c) => {
  const allAgents = db.getAgents();
  return c.json({ 
    success: true, 
    data: { 
      agents: allAgents, 
      count: allAgents.length,
      stats: db.getStats()
    } 
  });
});

// GET /api/agents/top - Get top agents by reputation
agents.get('/top', (c) => {
  const limit = parseInt(c.req.query('limit') || '10');
  const topAgents = db.getTopAgents(limit);
  return c.json({ 
    success: true, 
    data: { 
      agents: topAgents,
      count: topAgents.length 
    } 
  });
});

// GET /api/agents/:id - Get single agent
agents.get('/:id', (c) => {
  const agent = db.getAgent(c.req.param('id'));
  if (!agent) {
    return c.json({ success: false, error: 'Agent not found' }, 404);
  }
  
  // Get additional context
  const vouches = db.getVouchesForAgent(agent.id);
  const tasks = db.getTasksByAgent(agent.id);
  const reputationEvents = db.getReputationEventsForAgent(agent.id);
  
  return c.json({ 
    success: true, 
    data: {
      ...agent,
      vouches,
      recentTasks: tasks.slice(-10),
      reputationHistory: reputationEvents.slice(-20),
    }
  });
});

// GET /api/agents/address/:address - Get agent by address
agents.get('/address/:address', (c) => {
  const address = c.req.param('address');
  const agent = db.getAgentByAddress(address);
  
  if (!agent) {
    return c.json({ success: false, error: 'Agent not found' }, 404);
  }
  
  return c.json({ success: true, data: agent });
});

// POST /api/agents - Register new agent
agents.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request
    const parsed = CreateAgentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ 
        success: false, 
        error: 'Validation error', 
        details: parsed.error.issues 
      }, 400);
    }
    
    const data = parsed.data;
    
    // Check if agent with this address already exists
    const existing = db.getAgentByAddress(data.address);
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Agent with this address already exists' 
      }, 400);
    }
    
    const now = new Date().toISOString();
    const id = `agent_${nanoid(12)}`;
    
    const agent: Agent = {
      id,
      address: data.address,
      name: data.name,
      description: data.description,
      reputation: 0,
      totalVouches: 0,
      totalStake: '0',
      completedTasks: 0,
      specialties: data.specialties || [],
      createdAt: now,
      updatedAt: now,
    };
    
    // Validate with full schema
    const validated = AgentSchema.safeParse(agent);
    if (!validated.success) {
      return c.json({ 
        success: false, 
        error: 'Schema validation failed',
        details: validated.error.issues 
      }, 400);
    }
    
    const created = await db.createAgent(agent);
    
    return c.json({ 
      success: true, 
      data: created,
      message: 'Agent registered successfully'
    }, 201);
    
  } catch (error) {
    console.error('Register agent error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to register agent' 
    }, 500);
  }
});

// PUT /api/agents/:id - Update agent
agents.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const existing = db.getAgent(id);
    
    if (!existing) {
      return c.json({ success: false, error: 'Agent not found' }, 404);
    }
    
    const body = await c.req.json();
    
    // Don't allow changing id, address, createdAt
    delete body.id;
    delete body.address;
    delete body.createdAt;
    delete body.totalStake; // Managed by vouches
    delete body.totalVouches; // Managed by vouches
    delete body.completedTasks; // Managed by task completion
    
    const updated = await db.updateAgent(id, body);
    
    return c.json({ success: true, data: updated });
    
  } catch (error) {
    console.error('Update agent error:', error);
    return c.json({ success: false, error: 'Failed to update agent' }, 500);
  }
});

// GET /api/agents/:id/vouches - Get vouches for agent
agents.get('/:id/vouches', (c) => {
  const agent = db.getAgent(c.req.param('id'));
  if (!agent) {
    return c.json({ success: false, error: 'Agent not found' }, 404);
  }
  
  const vouches = db.getVouchesForAgent(agent.id);
  return c.json({ 
    success: true, 
    data: { 
      vouches,
      count: vouches.length,
      totalStake: agent.totalStake
    } 
  });
});

export { agents };
