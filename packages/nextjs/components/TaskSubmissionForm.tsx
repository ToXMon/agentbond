'use client';

import { useState } from 'react';
import { api } from '../lib/api';

interface TaskSubmissionFormProps {
  onSubmit: (task: any) => void;
  onClose: () => void;
}

export function TaskSubmissionForm({ onSubmit, onClose }: TaskSubmissionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('1.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.createTask({
        title,
        description,
        reward,
        creator: '0xUser', // Will be replaced with wallet address
        status: 'open',
      });
      
      onSubmit(result.task);
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
        
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Task Title</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., Code Review for Smart Contract"
              required
            />
          </div>
          
          <div>
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered w-full"
              placeholder="Describe the task in detail..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="label">
              <span className="label-text">Reward (CELO)</span>
            </label>
            <input
              type="number"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="input input-bordered w-full"
              step="0.1"
              min="0.1"
              required
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
