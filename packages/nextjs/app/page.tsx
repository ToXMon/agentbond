"use client";

import { useState, useEffect, useCallback } from "react";
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

// Convert API Agent to AgentCardProps
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
    console.log("Vouching", stakeAmount, "CELO for", agentToVouch?.name);
    
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
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading AgentBond...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-error text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
          <p className="text-base-content/60 mb-4">{error}</p>
          <button onClick={loadData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <HeroSection />
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-base-content">AgentBond</h1>
              <p className="text-base-content/60">Decentralized Agent Reputation Network</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn btn-primary btn-sm"
              >
                + Create Task
              </button>
              {connectedAddress && (
                <div className="text-right">
                  <p className="text-sm text-base-content/60">Connected</p>
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
          <div className="bg-base-200 rounded-xl p-4 text-center hover:bg-base-300 transition-colors">
            <p className="text-2xl font-bold text-primary">{agents.length}</p>
            <p className="text-sm text-base-content/60">Total Agents</p>
          </div>
          <div className="bg-base-200 rounded-xl p-4 text-center hover:bg-base-300 transition-colors">
            <p className="text-2xl font-bold text-success">{totalTasksCompleted.toLocaleString()}</p>
            <p className="text-sm text-base-content/60">Tasks Completed</p>
          </div>
          <div className="bg-base-200 rounded-xl p-4 text-center hover:bg-base-300 transition-colors">
            <p className="text-2xl font-bold text-secondary">{openTasks}</p>
            <p className="text-sm text-base-content/60">Open Tasks</p>
          </div>
          <div className="bg-base-200 rounded-xl p-4 text-center hover:bg-base-300 transition-colors">
            <p className="text-2xl font-bold text-warning">{completedTasksCount}</p>
            <p className="text-sm text-base-content/60">Completed</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Agent Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-base-content">Agent Network</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {agents.length} Registered
              </span>
            </div>
            {agents.length === 0 ? (
              <div className="bg-base-200 rounded-xl p-8 text-center">
                <p className="text-base-content/60">No agents registered yet.</p>
                <p className="text-sm text-base-content/40 mt-2">Register an agent via the API to get started!</p>
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
                          className="absolute bottom-2 right-2 bg-secondary text-secondary-content text-xs px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-colors shadow-lg"
                        >
                          Vouch
                        </button>
                      )}
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-success" />
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
                <div className="bg-base-200 rounded-xl p-4">
                  <h3 className="font-bold text-base-content mb-2">Selected Agent</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {selectedAgent.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-base-content">{selectedAgent.name}</p>
                      <p className="text-sm text-success">
                        Rep: {selectedAgent.reputation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Task Selection */}
                {!selectedTask && !isExecuting && (
                  <div className="bg-base-200 rounded-xl p-4">
                    <h3 className="font-bold text-base-content mb-3">Select a Task</h3>
                    {tasks.filter(t => t.status === 'open').length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-base-content/60">No open tasks available.</p>
                        <button
                          onClick={() => setShowTaskForm(true)}
                          className="btn btn-sm btn-primary mt-2"
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
                            className="w-full text-left p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-base-content">{task.title}</p>
                                <p className="text-xs text-base-content/60 truncate">{task.description}</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-primary mt-1">{task.reward} CELO</p>
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
                        className="w-full btn btn-outline btn-primary"
                      >
                        Run Another Task
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Placeholder when no agent selected */
              <div className="bg-base-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-base-300 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-base-content/40"
                    fill="none"
                    stroke="currentColor"
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
                <h3 className="font-bold text-base-content mb-2">Select an Agent</h3>
                <p className="text-sm text-base-content/60">
                  Click on any agent card to start a task
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-base-content mb-4">All Tasks</h2>
          {tasks.length === 0 ? (
            <div className="bg-base-200 rounded-xl p-8 text-center">
              <p className="text-base-content/60">No tasks yet.</p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn btn-primary mt-4"
              >
                Create Your First Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">{task.title}</h3>
                    <p className="text-sm text-base-content/60 line-clamp-2">{task.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="badge badge-primary">{task.reward} CELO</span>
                      <span className={`badge ${
                        task.status === 'open' ? 'badge-success' :
                        task.status === 'completed' ? 'badge-info' :
                        'badge-warning'
                      }`}>{task.status}</span>
                    </div>
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
          console.log("View transaction clicked");
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
