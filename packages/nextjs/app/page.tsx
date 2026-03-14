"use client";

import { useState, useEffect } from "react";
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
import {
  DEMO_AGENTS,
  DEMO_TASKS,
  type DemoAgent,
  type DemoTask,
  getStatusColor,
  getReputationColor,
  getDifficultyColor,
} from "~~/lib/demoData";

// Convert DemoAgent to AgentCardProps
const toAgentCardProps = (agent: DemoAgent): (AgentCardProps & { id: string; specialization: string }) => ({
  id: agent.id,
  address: agent.id,
  name: agent.name,
  reputation: agent.reputation,
  isVouched: agent.isVouched,
  status: agent.status === "available" ? "online" : agent.status === "busy" ? "busy" : "offline",
  tasksCompleted: agent.tasksCompleted,
  specialization: agent.specialization,
});

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // State for selected agent and task
  const [selectedAgent, setSelectedAgent] = useState<ReturnType<typeof toAgentCardProps> | null>(null);
  const [selectedTask, setSelectedTask] = useState<DemoTask | null>(null);

  // State for task execution panel
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [taskComplete, setTaskComplete] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // State for celebration modal
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTask, setCompletedTask] = useState<DemoTask | null>(null);

  // State for vouching drawer
  const [showVouchingDrawer, setShowVouchingDrawer] = useState(false);
  const [agentToVouch, setAgentToVouch] = useState<ReturnType<typeof toAgentCardProps> | null>(null);

  // State for agents list (allow updates when vouching)
  const [agents, setAgents] = useState(DEMO_AGENTS);

  // Handle agent selection for task
  const handleAgentSelect = (agent: ReturnType<typeof toAgentCardProps>) => {
    setSelectedAgent(agent);
    setShowTaskPanel(true);
    setTaskComplete(false);
    setSelectedTask(null);
  };

  // Handle task selection
  const handleTaskSelect = (task: DemoTask) => {
    setSelectedTask(task);
    setIsExecuting(true);
  };

  // Handle task completion
  const handleTaskComplete = () => {
    setTaskComplete(true);
    setIsExecuting(false);
    if (selectedTask) {
      setCompletedTask(selectedTask);
    }
    setTimeout(() => {
      setShowCelebration(true);
    }, 500);
  };

  // Handle vouch action
  const handleVouch = (agent: ReturnType<typeof toAgentCardProps>) => {
    setAgentToVouch(agent);
    setShowVouchingDrawer(true);
  };

  // Handle vouch confirmation
  const handleVouchConfirm = (stakeAmount: string) => {
    console.log("Vouching", stakeAmount, "CELO for", agentToVouch?.name);
    
    // Update agent to be vouched
    if (agentToVouch) {
      setAgents(prev => 
        prev.map(a => 
          a.id === agentToVouch.id 
            ? { ...a, isVouched: true, reputation: Math.min(100, a.reputation + 5) }
            : a
        )
      );
    }
    
    setShowVouchingDrawer(false);
    setAgentToVouch(null);
  };

  // Calculate stats from agents
  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const availableAgents = agents.filter(a => a.status === "available").length;
  const vouchedAgents = agents.filter(a => a.isVouched).length;

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-base-content">AgentBond</h1>
              <p className="text-base-content/60">Decentralized Agent Reputation Network</p>
            </div>
            {connectedAddress && (
              <div className="text-right">
                <p className="text-sm text-base-content/60">Connected</p>
                <Address address={connectedAddress} chain={targetNetwork} />
              </div>
            )}
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
            <p className="text-2xl font-bold text-secondary">{vouchedAgents}/{agents.length}</p>
            <p className="text-sm text-base-content/60">Vouched Agents</p>
          </div>
          <div className="bg-base-200 rounded-xl p-4 text-center hover:bg-base-300 transition-colors">
            <p className="text-2xl font-bold text-warning">{availableAgents}</p>
            <p className="text-sm text-base-content/60">Available Now</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Agent Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-base-content">Agent Network</h2>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {availableAgents} Available
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  {agents.filter(a => a.status === "busy").length} Busy
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const cardProps = toAgentCardProps(agent);
                return (
                  <div key={agent.id} className="relative">
                    <AgentCard
n                      {...cardProps}
                      onSelect={() => handleAgentSelect(cardProps)}
                    />
                    {/* Vouch Button for unvouched agents */}
                    {!agent.isVouched && (
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
                    {/* Status indicator */}
                    <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Task Execution */
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
                      <p className={`text-sm ${getReputationColor(selectedAgent.reputation)}`}>
                        Rep: {selectedAgent.reputation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Task Selection */}
                {!selectedTask && !isExecuting && (
                  <div className="bg-base-200 rounded-xl p-4">
                    <h3 className="font-bold text-base-content mb-3">Select a Task</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {DEMO_TASKS.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleTaskSelect(task)}
                          className="w-full text-left p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-base-content">{task.title}</p>
                              <p className="text-xs text-base-content/60">{task.estimatedTime}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(task.difficulty)}`}>
                              {task.difficulty}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-primary mt-1">{task.reward}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Execution Panel */}
                {selectedTask && (
                  <>
                    <TaskExecutionPanel
                      taskId={`0xtask${selectedTask.id}${Date.now().toString(16)}`}
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
                  Click on any agent card to start a demo task execution
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-base-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-base-content mb-4">🎯 Demo Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-base-content/80">
            <div>
              <p className="font-medium mb-2">1. Select an Agent</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click any agent card from the grid</n                <li>View agent details and reputation</li>
                <li>Green dot = available, Yellow = busy</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">2. Run a Task</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Choose from available demo tasks</li>
                <li>Watch the storyboard animation</li>
                <li>See stages progress in real-time</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">3. Vouch for Agents</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click "Vouch" on unvouched agents</li>
                <li>Adjust stake amount with slider</li>
                <li>Watch reputation increase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
