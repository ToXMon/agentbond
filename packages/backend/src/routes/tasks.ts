import { Hono } from 'hono';

const tasks = new Hono();

// In-memory store (will be replaced with Akave)
const taskStore: Map<string, any> = new Map();

// GET /api/tasks - List all tasks
tasks.get('/', (c) => {
  const allTasks = Array.from(taskStore.values());
  return c.json({ tasks: allTasks, count: allTasks.length });
});

// GET /api/tasks/:id - Get single task
tasks.get('/:id', (c) => {
  const task = taskStore.get(c.req.param('id'));
  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json({ task });
});

// POST /api/tasks - Create task
tasks.post('/', async (c) => {
  const body = await c.req.json();
  const id = `task-${Date.now()}`;
  const task = {
    id,
    ...body,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  taskStore.set(id, task);
  return c.json({ task, message: 'Task created' }, 201);
});

// PUT /api/tasks/:id - Update task
tasks.put('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = taskStore.get(id);
  if (!existing) return c.json({ error: 'Task not found' }, 404);
  
  const body = await c.req.json();
  const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
  taskStore.set(id, updated);
  return c.json({ task: updated });
});

// DELETE /api/tasks/:id - Delete task
tasks.delete('/:id', (c) => {
  const id = c.req.param('id');
  if (!taskStore.has(id)) return c.json({ error: 'Task not found' }, 404);
  taskStore.delete(id);
  return c.json({ message: 'Task deleted' });
});

// POST /api/tasks/:id/assign - Assign task to agent
tasks.post('/:id/assign', async (c) => {
  const id = c.req.param('id');
  const task = taskStore.get(id);
  if (!task) return c.json({ error: 'Task not found' }, 404);
  
  const { agentId } = await c.req.json();
  task.assignedAgent = agentId;
  task.status = 'assigned';
  task.updatedAt = new Date().toISOString();
  taskStore.set(id, task);
  return c.json({ task, message: 'Task assigned' });
});

// POST /api/tasks/:id/complete - Complete task
tasks.post('/:id/complete', async (c) => {
  const id = c.req.param('id');
  const task = taskStore.get(id);
  if (!task) return c.json({ error: 'Task not found' }, 404);
  
  const { result } = await c.req.json();
  task.status = 'completed';
  task.result = result;
  task.completedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();
  taskStore.set(id, task);
  return c.json({ task, message: 'Task completed' });
});

export { tasks, taskStore };
