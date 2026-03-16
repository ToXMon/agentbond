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
      <div className="deepspace-bg grid-overlay min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-400">Loading AgentBond...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="deepspace-bg grid-overlay min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md mx-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-white">Connection Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button onClick={loadData} className="btn-glow px-6 py-2 rounded-xl text-white font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deepspace-bg grid-overlay relative">
      {/* Full-page Vanta background layer */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 opacity-20" id="vanta-page-bg" />
      </div>

      <HeroSection />

      {/* Dashboard Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-shimmer">AgentBond</h1>
              <p className="text-slate-400 text-sm m-0">Decentralized Agent Reputation Network</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn-glow px-4 py-2 rounded-xl text-white text-sm font-medium"
              >
                + Create Task
              </button>
              {connectedAddress && (
                <div className="text-right">
                  <p className="text-xs text-slate-400 m-0">Connected</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: agents.length, label: "Total Agents", color: "text-purple-400" },
            { value: totalTasksCompleted, label: "Tasks Completed", color: "text-green-400" },
            { value: openTasks, label: "Open Tasks", color: "text-blue-400" },
            { value: completedTasksCount, label: "Completed", color: "text-pink-400" },
          ].map(({ value, label, color }) => (
            <div
              key={label}
              className="glass-card p-4 text-center transition-all duration-300"
            >
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 m-0">{label}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Agent Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Agent Network</h2>
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-full">
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
                          className="absolute bottom-3 right-3 btn-ghost-space text-slate-300 text-xs px-3 py-1.5 rounded-full shadow-lg"
                        >
                          Vouch
                        </button>
                      )}
                      <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
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
                  <h3 className="font-bold text-white mb-3">Selected Agent</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <span className="text-lg font-bold text-white">
                        {selectedAgent.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{selectedAgent.name}</p>
                      <p className="text-sm text-green-400">
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
                          className="btn-glow px-4 py-1.5 rounded-lg text-white text-sm mt-2"
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
                            className="w-full text-left p-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-purple-500/40 rounded-xl transition-all duration-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-white text-sm">{task.title}</p>
                                <p className="text-xs text-slate-400 truncate">{task.description}</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-purple-400 mt-1">{task.reward} CELO</p>
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
                        className="w-full btn-ghost-space text-slate-300 py-2 px-4 rounded-xl font-medium"
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/60 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-slate-500"
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
          <h2 className="text-lg font-bold text-white mb-4">All Tasks</h2>
          {tasks.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-slate-400">No tasks yet.</p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn-glow px-6 py-2 rounded-xl text-white font-medium mt-4"
              >
                Create Your First Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="glass-card p-5 transition-all duration-300 hover:scale-[1.01]"
                >
                  <h3 className="font-semibold text-white mb-1">{task.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{task.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                      {task.reward} CELO
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                      task.status === 'open'
                        ? 'text-green-400 bg-green-500/10 border-green-500/25'
                        : task.status === 'completed'
                        ? 'text-blue-400 bg-blue-500/10 border-blue-500/25'
                        : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25'
                    }`}>{task.status}</span>
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
