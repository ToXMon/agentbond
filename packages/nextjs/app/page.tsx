"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "@scaffold-ui/components";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { api, type Agent, type Task } from "~~/lib/api";
import { AgentCardEnhanced, type AgentCardProps } from "../components/AgentCardEnhanced";
import { HeroSection } from "../components/HeroSection";
import {
  TaskExecutionPanel,
  CompletionCelebration,
  VouchingDrawer,
  TaskSubmissionForm,
} from "~~/components";

// Helper: returns style object for task status badge
const taskStatusStyle = (status: string): React.CSSProperties => {
  const map: Record<string, { bg: string; border: string; color: string }> = {
    open:      { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  color: '#34d399' },
    completed: { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)',  color: '#60a5fa' },
  };
  const s = map[status] ?? { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' };
  return { background: s.bg, border: `1px solid ${s.border}`, color: s.color };
};


const toAgentCardProps = (agent: Agent): (AgentCardProps & { id: string }) => ({
  id: agent.id,
  address: agent.address || agent.id,
  name: agent.name,
  reputation: agent.reputation,
  isVouched: agent.totalVouches > 0,
  status: "online",
  tasksCompleted: agent.completedTasks,
  specialty: agent.specialties?.[0] || "General",
  tags: agent.specialties || [],
  isActive: true,
});

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // API data state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for selected agent and task
  const [selectedAgent, setSelectedAgent] = useState<ReturnType<typeof toAgentCardProps> | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // State for task execution panel
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [taskComplete, setTaskComplete] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // State for celebration modal
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);

  // State for vouching drawer
  const [showVouchingDrawer, setShowVouchingDrawer] = useState(false);
  const [agentToVouch, setAgentToVouch] = useState<ReturnType<typeof toAgentCardProps> | null>(null);

  // State for task submission form
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentsRes, tasksRes] = await Promise.all([
        api.getAgents(),
        api.getTasks(),
      ]);
      setAgents(agentsRes.agents || []);
      setTasks(tasksRes.tasks || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle agent selection for task
  const handleAgentSelect = (agent: ReturnType<typeof toAgentCardProps>) => {
    setSelectedAgent(agent);
    setShowTaskPanel(true);
    setTaskComplete(false);
    setSelectedTask(null);
  };

  // Handle task selection
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsExecuting(true);
  };

  // Handle task completion
  const handleTaskComplete = async () => {
    if (!selectedTask) return;
    
    try {
      await api.completeTask(selectedTask.id, 'Task completed successfully');
      setTaskComplete(true);
      setIsExecuting(false);
      setCompletedTask(selectedTask);
      // Refresh tasks
      const tasksRes = await api.getTasks();
      setTasks(tasksRes.tasks || []);
      setTimeout(() => {
        setShowCelebration(true);
      }, 500);
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  // Handle vouch action
  const handleVouch = (agent: ReturnType<typeof toAgentCardProps>) => {
    setAgentToVouch(agent);
    setShowVouchingDrawer(true);
  };

  // Handle vouch confirmation
  const handleVouchConfirm = async (stakeAmount: string) => {
    
    if (agentToVouch) {
      try {
        await api.vouchForAgent(agentToVouch.id, {
          staker: connectedAddress || '0xUser',
          amount: stakeAmount,
          reason: 'Trust this agent',
        });
        // Refresh agents
        const agentsRes = await api.getAgents();
        setAgents(agentsRes.agents || []);
      } catch (err) {
        console.error('Failed to vouch:', err);
      }
    }
    
    setShowVouchingDrawer(false);
    setAgentToVouch(null);
  };

  // Handle create task
  const handleCreateTask = async (task: Partial<Task>) => {
    try {
      const result = await api.createTask(task);
      setTasks(prev => [...prev, result.task]);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Calculate stats from agents
  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.completedTasks, 0);
  const openTasks = tasks.filter(t => t.status === 'open').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen deepspace-bg flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg" style={{ color: '#8b5cf6' }}></span>
          <p className="mt-4 text-slate-400">Loading AgentBond...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen deepspace-bg flex items-center justify-center">
        <div className="text-center glass-card p-8 max-w-sm mx-4">
          <div className="text-error text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-white">Connection Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button onClick={loadData} className="btn-glow px-6 py-2 rounded-xl">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen deepspace-bg grid-overlay">
      <HeroSection />
      {/* Header */}
      <div
        className="border-b"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(10px)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wide">AgentBond</h1>
              <p className="text-slate-400 tracking-wide">Decentralized Agent Reputation Network</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn-glow px-4 py-2 text-sm"
              >
                + Create Task
              </button>
              {connectedAddress && (
                <div className="text-right">
                  <p className="text-sm text-slate-400">Connected</p>
                  <Address address={connectedAddress} chain={targetNetwork} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: agents.length, label: 'Total Agents', color: '#a78bfa' },
            { value: totalTasksCompleted.toLocaleString(), label: 'Tasks Completed', color: '#34d399' },
            { value: openTasks, label: 'Open Tasks', color: '#f472b6' },
            { value: completedTasksCount, label: 'Completed', color: '#fbbf24' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card p-4 text-center transition-all duration-300"
              style={{ borderTop: `2px solid ${stat.color}33` }}
            >
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Agent Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white tracking-wide">Agent Network</h2>
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  color: '#34d399',
                }}
              >
                {agents.length} Registered
              </span>
            </div>
            {agents.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-slate-400">No agents registered yet.</p>
                <p className="text-sm text-slate-500 mt-2">Register an agent via the API to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => {
                  const cardProps = toAgentCardProps(agent);
                  return (
                    <div key={agent.id} className="relative">
                      <AgentCardEnhanced
                        {...cardProps}
                        onSelect={() => handleAgentSelect(cardProps)}
                      />
                      {!agent.totalVouches && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVouch(cardProps);
                          }}
                          className="absolute bottom-2 right-2 text-xs px-3 py-1.5 rounded-full transition-all shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                            color: 'white',
                            boxShadow: '0 0 12px rgba(139,92,246,0.4)',
                          }}
                        >
                          Vouch
                        </button>
                      )}
                      <div
                        className="absolute top-2 right-2 w-3 h-3 rounded-full"
                        style={{ background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.8)' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel - Task Execution */}
          <div className="lg:w-96">
            {showTaskPanel && selectedAgent ? (
              <div className="space-y-4">
                {/* Selected Agent Info */}
                <div className="glass-card p-4">
                  <h3 className="font-bold text-white mb-2">Selected Agent</h3>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}
                    >
                      <span className="text-lg font-bold" style={{ color: '#a78bfa' }}>
                        {selectedAgent.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{selectedAgent.name}</p>
                      <p className="text-sm" style={{ color: '#34d399' }}>
                        Rep: {selectedAgent.reputation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Task Selection */}
                {!selectedTask && !isExecuting && (
                  <div className="glass-card p-4">
                    <h3 className="font-bold text-white mb-3">Select a Task</h3>
                    {tasks.filter(t => t.status === 'open').length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-slate-400">No open tasks available.</p>
                        <button
                          onClick={() => setShowTaskForm(true)}
                          className="btn-glow px-4 py-2 text-sm mt-2"
                        >
                          Create a Task
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {tasks.filter(t => t.status === 'open').map((task) => (
                          <button
                            key={task.id}
                            onClick={() => handleTaskSelect(task)}
                            className="w-full p-3 rounded-lg glass-task-btn"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-white">{task.title}</p>
                                <p className="text-xs text-slate-400 truncate">{task.description}</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium mt-1" style={{ color: '#a78bfa' }}>{task.reward} CELO</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Task Execution Panel */}
                {selectedTask && (
                  <>
                    <TaskExecutionPanel
                      taskId={selectedTask.id}
                      taskTitle={selectedTask.title}
                      reward={selectedTask.reward}
                      agentName={selectedAgent.name}
                      agentAddress={selectedAgent.address}
                      onComplete={handleTaskComplete}
                      autoStart={true}
                    />
                    {taskComplete && (
                      <button
                        onClick={() => {
                          setSelectedTask(null);
                          setTaskComplete(false);
                          setIsExecuting(false);
                        }}
                        className="w-full btn-ghost-space py-2 rounded-xl"
                      >
                        Run Another Task
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Placeholder when no agent selected */
              <div className="glass-card p-6 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="rgba(139,92,246,0.7)"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-2">Select an Agent</h3>
                <p className="text-sm text-slate-400">
                  Click on any agent card to start a task
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4 tracking-wide">All Tasks</h2>
          {tasks.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-slate-400">No tasks yet.</p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn-glow px-6 py-2 mt-4 inline-block"
              >
                Create Your First Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="glass-card p-5">
                  <h3 className="font-bold text-white mb-1">{task.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        color: '#a78bfa',
                      }}
                    >
                      {task.reward} CELO
                    </span>
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={taskStatusStyle(task.status)}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Submission Form Modal */}
      {showTaskForm && (
        <TaskSubmissionForm
          onSubmit={handleCreateTask}
          onClose={() => setShowTaskForm(false)}
        />
      )}

      {/* Completion Celebration Modal */}
      <CompletionCelebration
        isVisible={showCelebration}
        reputationGain={5}
        earningsAmount={completedTask?.reward || "5.0 CELO"}
        transactionHash={`0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`}
        onViewTransaction={() => {
          setShowCelebration(false);
        }}
        onDismiss={() => setShowCelebration(false)}
      />

      {/* Vouching Drawer */}
      {agentToVouch && (
        <VouchingDrawer
          isOpen={showVouchingDrawer}
          agentAddress={agentToVouch.address}
          agentName={agentToVouch.name}
          agentReputation={agentToVouch.reputation}
          minStake="1.0"
          maxStake="100.0"
          onConfirm={handleVouchConfirm}
          onClose={() => {
            setShowVouchingDrawer(false);
            setAgentToVouch(null);
          }}
        />
      )}
    </div>
  );
};

export default Home;
