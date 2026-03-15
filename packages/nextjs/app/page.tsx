"use client";

import { useState, useEffect, useCallback } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "@scaffold-ui/components";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import {
  AgentCard,
  TaskExecutionPanel,
  CompletionCelebration,
  VouchingDrawer,
  type AgentCardProps,
} from "~~/components";
import { api, type Agent, type Task } from "~~/lib/api";

// Convert API Agent to AgentCardProps
const toAgentCardProps = (agent: Agent): (AgentCardProps & { id: string; specialization: string }) => ({
  id: agent.id,
  address: agent.address || agent.id,
  name: agent.name,
  reputation: agent.reputation,
  isVouched: agent.totalVouches > 0,
  status: "online",
  tasksCompleted: agent.completedTasks,
  specialization: agent.specialties?.[0] || "General",
});

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // Real API data state
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
  const [celebrationData, setCelebrationData] = useState({
    taskTitle: "",
    reward: "0",
    reputationGain: 0,
  });

  // State for vouching drawer
  const [showVouchingDrawer, setShowVouchingDrawer] = useState(false);

  // Fetch data from real API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, tasksRes] = await Promise.all([
        api.getAgents(),
        api.getTasks(),
      ]);
      setAgents(agentsRes.agents || []);
      setTasks(tasksRes.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle agent selection
  const handleAgentSelect = (agent: ReturnType<typeof toAgentCardProps>) => {
    setSelectedAgent(agent);
    setShowVouchingDrawer(true);
  };

  // Handle task selection
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setShowTaskPanel(true);
    setTaskComplete(false);
  };

  // Handle task execution
  const handleExecuteTask = async () => {
    if (!selectedTask || !selectedAgent) return;
    
    setIsExecuting(true);
    
    try {
      // Assign task to agent
      await api.assignTask(selectedTask.id, selectedAgent.id);
      
      // Simulate task execution (in real app, agent would execute)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete task
      const result = await api.completeTask(selectedTask.id, "Task completed successfully");
      
      setTaskComplete(true);
      setCelebrationData({
        taskTitle: selectedTask.title,
        reward: selectedTask.reward,
        reputationGain: 5,
      });
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error("Task execution error:", err);
      setError(err instanceof Error ? err.message : "Task execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle celebration close
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setShowTaskPanel(false);
    setSelectedTask(null);
    setTaskComplete(false);
  };

  // Handle vouch submission
  const handleVouch = async (amount: string, reason: string) => {
    if (!selectedAgent) return;
    
    try {
      await api.vouchForAgent(selectedAgent.id, {
        staker: connectedAddress || "",
        amount,
        reason,
      });
      setShowVouchingDrawer(false);
      fetchData();
    } catch (err) {
      console.error("Vouch error:", err);
      setError(err instanceof Error ? err.message : "Vouch failed");
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-content py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">AgentBond</h1>
          <p className="text-lg opacity-90">Reputation-Backed Agent Lending Protocol</p>
          {connectedAddress && (
            <div className="mt-4 text-sm opacity-75">
              Connected: <Address address={connectedAddress} />
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="btn btn-sm" onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="container mx-auto px-4 py-8 text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading agents and tasks from API...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="container mx-auto px-4 py-8">
          {/* Agents Grid */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Available Agents</h2>
            {agents.length === 0 ? (
              <div className="text-center py-8 bg-base-200 rounded-lg">
                <p className="text-lg opacity-70">No agents registered yet</p>
                <p className="text-sm opacity-50 mt-2">Register an agent to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    {...toAgentCardProps(agent)}
                    onClick={() => handleAgentSelect(toAgentCardProps(agent))}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Tasks Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Open Tasks</h2>
            {tasks.filter(t => t.status === 'open').length === 0 ? (
              <div className="text-center py-8 bg-base-200 rounded-lg">
                <p className="text-lg opacity-70">No open tasks available</p>
                <p className="text-sm opacity-50 mt-2">Create a task to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.filter(t => t.status === 'open').map(task => (
                  <div
                    key={task.id}
                    className="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
                    onClick={() => handleTaskSelect(task)}
                  >
                    <div className="card-body">
                      <h3 className="card-title">{task.title}</h3>
                      <p className="text-sm opacity-70">{task.description}</p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="badge badge-primary">{task.reward} CELO</span>
                        <span className="text-xs opacity-50">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Task Execution Panel */
      {showTaskPanel && selectedTask && selectedAgent && (
        <TaskExecutionPanel
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description || "",
            status: taskComplete ? "completed" : isExecuting ? "in_progress" : "pending",
            progress: taskComplete ? 100 : isExecuting ? 50 : 0,
          }}
          agent={{
            name: selectedAgent.name,
            reputation: selectedAgent.reputation,
          }}
          onClose={() => setShowTaskPanel(false)}
          onComplete={handleExecuteTask}
          isExecuting={isExecuting}
        />
      )}

      {/* Celebration Modal */
      {taskComplete && (
        <CompletionCelebration
          isOpen={showCelebration || taskComplete}
          onClose={handleCelebrationClose}
          taskTitle={celebrationData.taskTitle}
          reward={celebrationData.reward}
          reputationGain={celebrationData.reputationGain}
        />
      )}

      {/* Vouching Drawer */
      {showVouchingDrawer && selectedAgent && (
        <VouchingDrawer
          isOpen={showVouchingDrawer}
          onClose={() => setShowVouchingDrawer(false)}
          agentName={selectedAgent.name}
          agentAddress={selectedAgent.address}
          currentReputation={selectedAgent.reputation}
          onVouch={handleVouch}
        />
      )}

      {/* Footer */}
      <div className="bg-base-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm opacity-70">
          <p>AgentBond - Synthesis Hackathon 2026</p>
          <p className="mt-1">Celo + Venice AI Integration</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
