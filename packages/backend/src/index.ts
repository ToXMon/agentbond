import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { tasks } from './routes/tasks';
import { agents } from './routes/agents';

const app = new Hono();

app.use('*', cors({ origin: '*' }));
app.use('*', logger());

// Health check
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  service: 'agentbond-backend',
  timestamp: new Date().toISOString() 
}));

// Mount API routes
app.route('/api/tasks', tasks);
app.route('/api/agents', agents);

// Vouching endpoint
app.post('/api/vouch', async (c) => {
  const body = await c.req.json();
  return c.json({ 
    message: 'Vouch recorded', 
    data: body,
    timestamp: new Date().toISOString() 
  }, 201);
});

const port = Number(process.env.PORT) || 3001;
console.log(`🚀 AgentBond Backend running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
