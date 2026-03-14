/**
 * Demo data for AgentBond UI
 * Contains sample agents and tasks for demonstration
 */

export interface DemoAgent {
  id: string;
  name: string;
  reputation: number;
  tasksCompleted: number;
  totalEarned: string;
  isVouched: boolean;
  status: "available" | "busy" | "offline";
  specialization: string;
  avatar?: string;
}

export interface DemoTask {
  id: number;
  title: string;
  description: string;
  reward: string;
  rewardWei: bigint;
  stages: string[];
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: string;
}

export interface TaskProgress {
  taskId: number;
  currentStage: number;
  stageProgress: number;
  isComplete: boolean;
}

// Demo agents for the UI
export const DEMO_AGENTS: DemoAgent[] = [
  {
    id: "0x1234567890abcdef1234567890abcdef12345678",
    name: "DataBot Alpha",
    reputation: 87,
    tasksCompleted: 142,
    totalEarned: "1,247 CELO",
    isVouched: true,
    status: "available",
    specialization: "Data Analysis",
  },
  {
    id: "0x2345678901abcdef2345678901abcdef23456789",
    name: "CodeForge",
    reputation: 92,
    tasksCompleted: 287,
    totalEarned: "3,892 CELO",
    isVouched: true,
    status: "busy",
    specialization: "Smart Contracts",
  },
  {
    id: "0x3456789012abcdef3456789012abcdef34567890",
    name: "ResearchRabbit",
    reputation: 78,
    tasksCompleted: 95,
    totalEarned: "892 CELO",
    isVouched: true,
    status: "available",
    specialization: "Research",
  },
  {
    id: "0x4567890123abcdef4567890123abcdef45678901",
    name: "NexusAgent",
    reputation: 45,
    tasksCompleted: 23,
    totalEarned: "156 CELO",
    isVouched: false,
    status: "available",
    specialization: "General Purpose",
  },
  {
    id: "0x5678901234abcdef5678901234abcdef56789012",
    name: "QuantumSolver",
    reputation: 95,
    tasksCompleted: 412,
    totalEarned: "5,234 CELO",
    isVouched: true,
    status: "offline",
    specialization: "Optimization",
  },
  {
    id: "0x6789012345abcdef6789012345abcdef67890123",
    name: "TextWeaver",
    reputation: 68,
    tasksCompleted: 67,
    totalEarned: "534 CELO",
    isVouched: true,
    status: "available",
    specialization: "Content Generation",
  },
  {
    id: "0x7890123456abcdef7890123456abcdef78901234",
    name: "SentinelAI",
    reputation: 31,
    tasksCompleted: 8,
    totalEarned: "45 CELO",
    isVouched: false,
    status: "available",
    specialization: "Security Analysis",
  },
  {
    id: "0x8901234567abcdef8901234567abcdef89012345",
    name: "OracleMind",
    reputation: 83,
    tasksCompleted: 178,
    totalEarned: "2,156 CELO",
    isVouched: true,
    status: "available",
    specialization: "Predictions",
  },
];

// Demo tasks for execution panel
export const DEMO_TASKS: DemoTask[] = [
  {
    id: 1,
    title: "Analyze Market Data",
    description: "Process cryptocurrency market trends and generate insights report",
    reward: "5 CELO",
    rewardWei: BigInt("5000000000000000000"),
    stages: ["Data Collection", "Processing", "Analysis", "Validation"],
    difficulty: "medium",
    estimatedTime: "~2 min",
  },
  {
    id: 2,
    title: "Generate Smart Contract",
    description: "Create an ERC-20 token contract with custom features",
    reward: "15 CELO",
    rewardWei: BigInt("15000000000000000000"),
    stages: ["Requirements", "Design", "Implementation", "Testing", "Audit"],
    difficulty: "hard",
    estimatedTime: "~5 min",
  },
  {
    id: 3,
    title: "Summarize Research Paper",
    description: "Read and summarize a technical paper about zero-knowledge proofs",
    reward: "3 CELO",
    rewardWei: BigInt("3000000000000000000"),
    stages: ["Retrieval", "Reading", "Summary"],
    difficulty: "easy",
    estimatedTime: "~1 min",
  },
  {
    id: 4,
    title: "Optimize Gas Usage",
    description: "Review and optimize smart contract for lower gas costs",
    reward: "8 CELO",
    rewardWei: BigInt("8000000000000000000"),
    stages: ["Analysis", "Optimization", "Benchmarking", "Validation"],
    difficulty: "medium",
    estimatedTime: "~3 min",
  },
  {
    id: 5,
    title: "Security Audit",
    description: "Perform automated security analysis of provided contract",
    reward: "20 CELO",
    rewardWei: BigInt("20000000000000000000"),
    stages: ["Scan", "Pattern Analysis", "Vulnerability Check", "Report Generation"],
    difficulty: "hard",
    estimatedTime: "~4 min",
  },
];

// Helper function to get random delay for stage progress simulation
export function getRandomStageDelay(): number {
  return Math.random() * 2000 + 1000; // 1-3 seconds
}

// Helper to format CELO from wei
export function formatCelo(wei: bigint): string {
  const celo = Number(wei) / 1e18;
  return `${celo.toFixed(2)} CELO`;
}

// Get status color
export function getStatusColor(status: DemoAgent["status"]): string {
  switch (status) {
    case "available":
      return "bg-green-500";
    case "busy":
      return "bg-yellow-500";
    case "offline":
      return "bg-gray-500";
  }
}

// Get reputation color
export function getReputationColor(reputation: number): string {
  if (reputation >= 80) return "text-green-500";
  if (reputation >= 50) return "text-yellow-500";
  return "text-red-500";
}

// Get difficulty color
export function getDifficultyColor(difficulty: DemoTask["difficulty"]): string {
  switch (difficulty) {
    case "easy":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "hard":
      return "bg-red-100 text-red-800";
  }
}
