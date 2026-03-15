import { Hono } from 'hono';
import { db } from '../services/database';
import { CreateTaskRequestSchema, TaskSchema, Task } from '../types/schema';
import { nanoid } from 'nanoid';

const tasks = new Hono();

// Helper to convert CELO to Wei
function celoToWei(celo: string): string {
  const [whole = '0', fraction = ''] = celo.split('.');
  const paddedFraction = (fraction + '000000000000000000').slice(0, 18);
  return BigInt(whole + paddedFraction).toString();
}

// GET /api/tasks - List all tasks
tasks.get('/', async (c) => {
  const status = c.req.query('status') as Task['status'] | undefined;
  const creator = c.req.query('creator');
  
  let allTasks;
  if (status) {
    allTasks = db.getTasksByStatus(status);
  } else if (creator) {
    allTasks = db.getTasksByCreator(creator);
  } else {
    allTasks = db.getTasks();
  }
  
  return c.json({ 
    success: true, 
    data: { 
      tasks: allTasks, 
      count: allTasks.length,
      stats: db.getStats()
    } 
  });
});

// GET /api/tasks/:id - Get single task
tasks.get('/:id', (c) => {
  const task = db.getTask(c.req.param('id'));
  if (!task) {
    return c.json({ success: false, error: 'Task not found' }, 404);
  }
  return c.json({ success: true, data: task });
});

// POST /api/tasks - Create task
tasks.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request
    const parsed = CreateTaskRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ 
        success: false, 
        error: 'Validation error', 
        details: parsed.error.issues 
      }, 400);
    }
    
    const data = parsed.data;
    const now = new Date().toISOString();
    const id = `task_${nanoid(12)}`;
    
    const task: Task = {
      id,
      title: data.title,
      description: data.description,
      reward: data.reward,
      rewardWei: celoToWei(data.reward),
      status: 'open',
      creator: data.creator,
      deadline: data.deadline,
      tags: data.tags || [],
      attachments: data.attachments || [],
      createdAt: now,
      updatedAt: now,
    };
    
    // Validate with full schema
    const validated = TaskSchema.safeParse(task);
    if (!validated.success) {
      return c.json({ 
        success: false, 
        error: 'Schema validation failed',
        details: validated.error.issues 
      }, 400);
    }
    
    const created = await db.createTask(task);
    
    return c.json({ 
      success: true, 
      data: created,
      message: 'Task created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Create task error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to create task' 
    }, 500);
  }
});

// PUT /api/tasks/:id - Update task
tasks.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const existing = db.getTask(id);
    
    if (!existing) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }
    
    const body = await c.req.json();
    
    // Don't allow changing id or createdAt
    delete body.id;
    delete body.createdAt;
    
    const updated = await db.updateTask(id, body);
    
    return c.json({ success: true, data: updated });
    
  } catch (error) {
    console.error('Update task error:', error);
    return c.json({ success: false, error: 'Failed to update task' }, 500);
  }
});

// DELETE /api/tasks/:id - Delete task
tasks.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const deleted = await db.deleteTask(id);
  
  if (!deleted) {
    return c.json({ success: false, error: 'Task not found' }, 404);
  }
  
  return c.json({ success: true, message: 'Task deleted' });
});

// POST /api/tasks/:id/assign - Assign task to agent
tasks.post('/:id/assign', async (c) => {
  try {
    const id = c.req.param('id');
    const task = db.getTask(id);
    
    if (!task) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }
    
    if (task.status !== 'open') {
      return c.json({ 
        success: false, 
        error: `Task is ${task.status}, cannot assign` 
      }, 400);
    }
    
    const { agentId } = await c.req.json();
    
    if (!agentId) {
      return c.json({ success: false, error: 'agentId is required' }, 400);
    }
    
    // Verify agent exists
    const agent = db.getAgent(agentId);
    if (!agent) {
      return c.json({ success: false, error: 'Agent not found' }, 404);
    }
    
    const updated = await db.updateTask(id, {
      assignedAgent: agentId,
      status: 'assigned',
    });
    
    return c.json({ 
      success: true, 
      data: updated,
      message: 'Task assigned successfully' 
    });
    
  } catch (error) {
    console.error('Assign task error:', error);
    return c.json({ success: false, error: 'Failed to assign task' }, 500);
  }
});

// POST /api/tasks/:id/start - Start working on task
tasks.post('/:id/start', async (c) => {
  try {
    const id = c.req.param('id');
    const task = db.getTask(id);
    
    if (!task) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }
    
    if (task.status !== 'assigned') {
      return c.json({ 
        success: false, 
        error: `Task is ${task.status}, cannot start` 
      }, 400);
    }
    
    const updated = await db.updateTask(id, { status: 'in_progress' });
    
    return c.json({ 
      success: true, 
      data: updated,
      message: 'Task started' 
    });
    
  } catch (error) {
    console.error('Start task error:', error);
    return c.json({ success: false, error: 'Failed to start task' }, 500);
  }
});

// POST /api/tasks/:id/complete - Complete task
tasks.post('/:id/complete', async (c) => {
  try {
    const id = c.req.param('id');
    const task = db.getTask(id);
    
    if (!task) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }
    
    if (task.status !== 'in_progress' && task.status !== 'assigned') {
      return c.json({ 
        success: false, 
        error: `Task is ${task.status}, cannot complete` 
      }, 400);
    }
    
    const { result, resultIpfsHash, paymentTxHash } = await c.req.json();
    const now = new Date().toISOString();
    
    const updated = await db.updateTask(id, {
      status: 'completed',
      result,
      resultIpfsHash,
      paymentTxHash,
      completedAt: now,
    });
    
    // Update agent's completed tasks count
    if (task.assignedAgent) {
      const agent = db.getAgent(task.assignedAgent);
      if (agent) {
        await db.updateAgent(task.assignedAgent, {
          completedTasks: agent.completedTasks + 1,
        });
        
        // Add reputation event
        await db.addReputationEvent({
          id: `rep_${nanoid(12)}`,
          agentId: task.assignedAgent,
          change: 5,
          reason: `Completed task: ${task.title}`,
          eventType: 'task_completed',
          referenceId: id,
          timestamp: now,
        });
      }
    }
    
    return c.json({ 
      success: true, 
      data: updated,
      message: 'Task completed successfully' 
    });
    
  } catch (error) {
    console.error('Complete task error:', error);
    return c.json({ success: false, error: 'Failed to complete task' }, 500);
  }
});

// POST /api/tasks/:id/cancel - Cancel task
tasks.post('/:id/cancel', async (c) => {
  try {
    const id = c.req.param('id');
    const task = db.getTask(id);
    
    if (!task) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }
    
    if (task.status === 'completed') {
      return c.json({ 
        success: false, 
        error: 'Cannot cancel completed task' 
      }, 400);
    }
    
    const updated = await db.updateTask(id, { status: 'cancelled' });
    
    return c.json({ 
      success: true, 
      data: updated,
      message: 'Task cancelled' 
    });
    
  } catch (error) {
    console.error('Cancel task error:', error);
    return c.json({ success: false, error: 'Failed to cancel task' }, 500);
  }
});

export { tasks };
