import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { tasks } from './routes/tasks';
import { agents } from './routes/agents';
import { db } from './services/database';

const app = new Hono();

app.use('*', cors({ origin: '*' }));
app.use('*', logger());

// Health check
app.get('/health', async (c) => {
  const stats = db.getStats();
  return c.json({
    status: 'ok',
    service: 'agentbond-backend',
    timestamp: new Date().toISOString(),
    database: {
      initialized: true,
      ...stats
    }
  });
});

// API info endpoint
app.get('/api', (c) => c.json({
  name: 'AgentBond API',
  version: '1.0.0',
  endpoints: {
    agents: {
      list: 'GET /api/agents',
      top: 'GET /api/agents/top',
      get: 'GET /api/agents/:id',
      byAddress: 'GET /api/agents/address/:address',
      register: 'POST /api/agents',
      update: 'PUT /api/agents/:id',
      vouches: 'GET /api/agents/:id/vouches',
      vouch: 'POST /api/agents/:id/vouch',
      reputation: 'GET /api/agents/:id/reputation',
    },
    tasks: {
      list: 'GET /api/tasks',
      get: 'GET /api/tasks/:id',
      create: 'POST /api/tasks',
      update: 'PUT /api/tasks/:id',
      delete: 'DELETE /api/tasks/:id',
      assign: 'POST /api/tasks/:id/assign',
      start: 'POST /api/tasks/:id/start',
      complete: 'POST /api/tasks/:id/complete',
      cancel: 'POST /api/tasks/:id/cancel',
    }
  }
}));

// Mount API routes
app.route('/api/tasks', tasks);
app.route('/api/agents', agents);

// Legacy vouch endpoint (redirects to agents/:id/vouch)
app.post('/api/vouch', async (c) => {
  const body = await c.req.json();
  const { agentId, ...vouchData } = body;
  
  if (!agentId) {
    return c.json({ 
      success: false, 
      error: 'agentId is required. Use POST /api/agents/:id/vouch for the new endpoint.' 
    }, 400);
  }
  
  // Forward to the agent vouch logic
  const agent = db.getAgent(agentId);
  if (!agent) {
    return c.json({ success: false, error: 'Agent not found' }, 404);
  }
  
  return c.json({
    success: true,
    message: 'Use POST /api/agents/:id/vouch for vouching',
    data: { agentId, ...vouchData }
  });
});

// Error handler
app.notFound((c) => c.json({ success: false, error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// Initialize database and start server
async function start() {
  try {
    // Initialize database first
    await db.init();
    
    const port = Number(process.env.PORT) || 3001;
    console.log(`🚀 AgentBond Backend running on http://localhost:${port}`);
    console.log(`📊 API docs available at http://localhost:${port}/api`);
    
    serve({ fetch: app.fetch, port });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
