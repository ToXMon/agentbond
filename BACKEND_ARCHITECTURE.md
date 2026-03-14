# AgentBond Backend Architecture

> Decentralized Backend for Reputation-Backed Agent Lending Protocol
> Target: Celo Track ($10K) + Venice Track ($10K) | Synthesis Hackathon 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend Service Architecture](#2-backend-service-architecture)
3. [Akave Storage Schema](#3-akave-storage-schema)
4. [Akash SDL Configuration](#4-akash-sdl-configuration)
5. [Ralph Loop Implementation Plan](#5-ralph-loop-implementation-plan)
6. [Frontend Integration](#6-frontend-integration)
7. [Integration Test Plan](#7-integration-test-plan)

---

## 1. Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AGENTBOND DECENTRALIZED ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐            │
│  │   NEXT.JS       │     │   AKASH         │     │   AKAVE O3      │            │
│  │   FRONTEND      │────▶│   BACKEND       │────▶│   STORAGE       │            │
│  │   (Vercel)      │     │   (Decentralized)│    │   (Filecoin)    │            │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘            │
│           │                       │                       │                      │
│           │                       │                       │                      │
│           ▼                       ▼                       ▼                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        CELO L2 BLOCKCHAIN                                 │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │    │
│  │  │ IdentityRegistry │  │ ReputationReg    │  │ TaskEscrow       │       │    │
│  │  │ (ERC-8004)       │  │ (ERC-8004)       │  │ (x402 payments)  │       │    │
│  │  │ 0x8004A169...    │  │ 0x8004BAa1...    │  │ Custom Contract  │       │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        EXTERNAL SERVICES                                  │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │    │
│  │  │ Venice API       │  │ x402 Facilitator │  │ Price Oracle     │       │    │
│  │  │ (Private Risk)   │  │ (Coinbase)       │  │ (Chainlink)      │       │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         TASK EXECUTION FLOW                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. TASK CREATION                                                             │
│     User ──▶ POST /api/tasks ──▶ Backend ──▶ Akave (store task.json)         │
│                                        └──▶ Celo (create escrow)             │
│                                                                               │
│  2. TASK DISCOVERY                                                            │
│     Agent ──▶ GET /api/tasks ──▶ Backend ──▶ Akave (list tasks)              │
│                                  └──▶ Celo (check reputation)                │
│                                                                               │
│  3. TASK ACCEPTANCE                                                           │
│     Agent ──▶ POST /api/tasks/{id}/accept ──▶ Backend ──▶ Venice (risk)      │
│                                               └──▶ Celo (lock stake)         │
│                                                                               │
│  4. TASK EXECUTION                                                            │
│     Agent ──▶ WebSocket /ws/task/{id} ──▶ Backend ──▶ Progress updates       │
│                                     └──▶ Akave (stage outputs)               │
│                                                                               │
│  5. TASK COMPLETION                                                           │
│     Agent ──▶ POST /api/tasks/{id}/complete ──▶ Backend ──▶ Akave (result)   │
│                                                  └──▶ Celo (release + rep)   │
│                                                                               │
│  6. PAYMENT SETTLEMENT                                                        │
│     x402 ──▶ EIP-3009 transfer ──▶ Celo ──▶ Agent wallet                     │
│                                     └──▶ Voucher reputation update           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Bun 1.2+ | Fast JavaScript runtime, native TypeScript |
| **Framework** | Hono | Lightweight, edge-compatible web framework |
| **Blockchain** | viem + wagmi | Ethereum interactions, typed contracts |
| **Storage** | Akave O3 | S3-compatible decentralized storage |
| **Compute** | Akash Network | Decentralized container orchestration |
| **Database** | lowdb (local) + Akave (persistent) | Task metadata + large files |
| **WebSocket** | @hono/node-ws | Real-time task updates |
| **AI/ML** | Venice SDK | Private risk assessment |
| **Payments** | x402 SDK | HTTP 402 payment protocol |

---

## 2. Backend Service Architecture

### Directory Structure

```
packages/backend/
├── src/
│   ├── index.ts                 # Entry point, Hono app setup
│   ├── config/
│   │   ├── env.ts               # Environment configuration
│   │   ├── chains.ts            # Celo chain config
│   │   └── contracts.ts         # Contract addresses & ABIs
│   ├── routes/
│   │   ├── tasks.ts             # Task CRUD endpoints
│   │   ├── agents.ts            # Agent registration/query
│   │   ├── vouch.ts             # Vouching endpoints
│   │   ├── reputation.ts        # Reputation queries
│   │   └── payments.ts          # x402 payment handling
│   ├── services/
│   │   ├── akave.ts             # Akave S3 client wrapper
│   │   ├── blockchain.ts        # Contract interactions
│   │   ├── venice.ts            # Venice API client
│   │   ├── x402.ts              # Payment protocol handler
│   │   └── websocket.ts         # WebSocket manager
│   ├── middleware/
│   │   ├── auth.ts              # Wallet signature auth
│   │   ├── rateLimit.ts         # Request rate limiting
│   │   └── errorHandler.ts      # Global error handling
│   ├── types/
│   │   ├── task.ts              # Task type definitions
│   │   ├── agent.ts             # Agent type definitions
│   │   └── api.ts               # API request/response types
│   └── utils/
│       ├── crypto.ts            # Hashing, signatures
│       ├── validation.ts        # Zod schemas
│       └── logger.ts            # Structured logging
├── tests/
│   ├── routes/                  # Route tests
│   ├── services/                # Service tests
│   └── integration/             # E2E tests
├── package.json
├── tsconfig.json
├── Dockerfile
└── deploy.yaml                  # Akash SDL
```

### REST API Specification

#### Base URL
```
Production: https://agentbond.akash.network/api/v1
Local:      http://localhost:3000/api/v1
```

#### Authentication
All protected endpoints require wallet signature authentication:
```
Authorization: Bearer <EIP-191 signed message>
X-Address: 0x...
X-Timestamp: 1700000000000
```

---

#### Task Endpoints

##### POST /tasks
Create a new task

**Request:**
```json
{
  "title": "Analyze smart contract for security vulnerabilities",
  "description": "Review the attached Solidity contract...",
  "requirements": {
    "minReputation": 50,
    "skills": ["solidity", "security"],
    "deadline": "2026-03-15T18:00:00Z"
  },
  "reward": {
    "amount": "5000000",
    "token": "0x471EcE3750Da237f93B8E339c536989b8978a438"
  },
  "attachments": [
    {
      "name": "contract.sol",
      "cid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_0xABC123...",
    "escrowAddress": "0x1234...",
    "txHash": "0xabcd...",
    "akaveUri": "akave://agentbond-tasks/task_0xABC123.json",
    "createdAt": "2026-03-14T10:30:00Z"
  }
}
```

---

##### GET /tasks
List available tasks

**Query Parameters:**
- `status`: `open` | `assigned` | `in_progress` | `completed` | `disputed`
- `minReward`: Minimum reward in wei
- `skills`: Comma-separated skill tags
- `minReputation`: Minimum reputation score required
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "taskId": "task_0xABC123",
        "title": "Analyze smart contract...",
        "status": "open",
        "reward": { "amount": "5000000", "token": "0x471..." },
        "requirements": { "minReputation": 50 },
        "createdAt": "2026-03-14T10:30:00Z",
        "requester": {
          "address": "0x123...",
          "reputation": 87
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

---

##### POST /tasks/:taskId/accept
Accept a task (Agent only)

**Request:**
```json
{
  "agentId": "12345",
  "voucherAddress": "0x456...",
  "proposedTimeline": "2026-03-15T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_0xABC123",
    "status": "assigned",
    "riskAssessment": {
      "score": 23,
      "confidence": 0.85,
      "timestamp": "2026-03-14T10:35:00Z"
    },
    "escrowLocked": true,
    "assignedAt": "2026-03-14T10:35:00Z"
  }
}
```

---

##### POST /tasks/:taskId/progress
Update task progress (via WebSocket or HTTP)

**Request:**
```json
{
  "stage": "research",
  "progress": 75,
  "message": "Completed initial code review",
  "artifacts": [
    {
      "name": "analysis_notes.md",
      "cid": "bafy..."
    }
  ]
}
```

---

##### POST /tasks/:taskId/complete
Mark task as complete

**Request:**
```json
{
  "result": {
    "summary": "Found 3 medium severity vulnerabilities",
    "report": {
      "vulnerabilities": [...],
      "recommendations": [...]
    },
    "artifacts": [
      {
        "name": "security_report.pdf",
        "cid": "bafy..."
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_0xABC123",
    "status": "completed",
    "payment": {
      "amount": "5000000",
      "txHash": "0x789...",
      "settledAt": "2026-03-14T14:00:00Z"
    },
    "reputationChange": {
      "agent": +5,
      "voucher": +2
    }
  }
}
```

---

#### Agent Endpoints

##### GET /agents/:agentId
Get agent details with reputation

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "12345",
    "owner": "0x123...",
    "metadata": {
      "name": "SecurityAuditBot",
      "description": "Expert smart contract auditor",
      "services": [{ "name": "A2A", "endpoint": "https://..." }]
    },
    "reputation": {
      "score": 87,
      "dimensions": {
        "quality": 92,
        "uptime": 99,
        "successRate": 95
      },
      "vouchCount": 3,
      "totalTasks": 45
    },
    "vouchers": [
      {
        "address": "0x456...",
        "stake": "1000000000000000000",
        "stakedAt": "2026-03-01T00:00:00Z"
      }
    ]
  }
}
```

---

#### Vouching Endpoints

##### POST /vouch
Vouch for an agent

**Request:**
```json
{
  "agentId": "12345",
  "stakeAmount": "5000000000000000000",
  "lockPeriod": 604800
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vouchId": "vouch_0xDEF456",
    "voucher": "0x789...",
    "agentId": "12345",
    "stake": "5000000000000000000",
    "txHash": "0xabc...",
    "unlocksAt": "2026-03-21T00:00:00Z"
  }
}
```

---

### WebSocket Events

**Connection:**
```
ws://localhost:3000/ws/task/:taskId
```

**Client → Server Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `progress` | `{ stage, progress, message }` | Update task progress |
| `artifact` | `{ name, cid, type }` | Upload artifact reference |

**Server → Client Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `stage:complete` | `{ stage, duration }` | Stage finished |
| `stage:start` | `{ stage, timestamp }` | Stage started |
| `task:complete` | `{ result, payment }` | Task completed |
| `error` | `{ code, message }` | Error occurred |

---

### Core Services

#### AkaveService (services/akave.ts)

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface AkaveConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export interface TaskData {
  taskId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface Artifact {
  name: string;
  content: Buffer;
  type: string;
}

export interface ArtifactMeta {
  key?: string;
  size?: number;
  lastModified?: Date;
}

export class AkaveService {
  private client: S3Client;
  private bucket: string;

  constructor(config: AkaveConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: 'default',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,  // Required for Akave
    });
    this.bucket = config.bucket;
  }

  async uploadTask(taskId: string, data: TaskData): Promise<string> {
    const key = `tasks/${taskId}/task.json`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    }));
    return `akave://${this.bucket}/${key}`;
  }

  async uploadArtifact(taskId: string, artifact: Artifact): Promise<string> {
    const key = `tasks/${taskId}/artifacts/${artifact.name}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: artifact.content,
      ContentType: artifact.type,
    }));
    return `akave://${this.bucket}/${key}`;
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async listArtifacts(taskId: string): Promise<ArtifactMeta[]> {
    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: `tasks/${taskId}/artifacts/`,
    }));
    return (response.Contents || []).map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
    }));
  }
}
```

#### BlockchainService (services/blockchain.ts)

```typescript
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const IDENTITY_REGISTRY_ABI = parseAbi([
  'function register(string agentURI, bytes metadata) returns (uint256)',
  'function ownerOf(uint256 agentId) view returns (address)',
  'function tokenURI(uint256 agentId) view returns (string)',
]);

const REPUTATION_REGISTRY_ABI = parseAbi([
  'function giveFeedback(uint256 agentId, int128 value, uint8 decimals, string tag1, string tag2, string endpoint, string ipfsHash, bytes32 dataHash)',
  'function getSummary(uint256 agentId, address[] clients, string tag1, string tag2) view returns (uint64 count, int128 value, uint8 decimals)',
]);

const TASK_ESCROW_ABI = parseAbi([
  'function createTask(bytes32 taskId, address agent, uint256 amount, address token) returns (bool)',
  'function releasePayment(bytes32 taskId, bytes calldata result) returns (bool)',
  'function slashStake(bytes32 taskId, address voucher, uint256 amount) returns (bool)',
]);

export class BlockchainService {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient>;
  private account: ReturnType<typeof privateKeyToAccount>;
  
  private addresses = {
    identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const,
    reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as const,
    taskEscrow: process.env.TASK_ESCROW_ADDRESS as `0x${string}`,
  };

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey);
    
    this.publicClient = createPublicClient({
      chain: celoAlfajores,
      transport: http(),
    });
    
    this.walletClient = createWalletClient({
      chain: celoAlfajores,
      transport: http(),
      account: this.account,
    });
  }

  async registerAgent(agentURI: string, metadata: `0x${string}` = '0x'): Promise<{ agentId: bigint; txHash: `0x${string}` }> {
    const hash = await this.walletClient.writeContract({
      address: this.addresses.identityRegistry,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'register',
      args: [agentURI, metadata],
    });
    
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    const agentId = this.parseAgentIdFromLogs(receipt.logs);
    
    return { agentId, txHash: hash };
  }

  private parseAgentIdFromLogs(logs: any[]): bigint {
    // Parse Transfer event from ERC-721
    return BigInt(1); // Simplified - implement actual parsing
  }

  async submitFeedback(
    agentId: bigint,
    value: number,
    tag1: string,
    tag2: string,
    endpoint: string
  ): Promise<`0x${string}`> {
    return this.walletClient.writeContract({
      address: this.addresses.reputationRegistry,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: 'giveFeedback',
      args: [agentId, BigInt(value), 0, tag1, tag2, endpoint, '', '0x0000000000000000000000000000000000000000000000000000000000000000'],
    });
  }

  async getReputation(agentId: bigint): Promise<{ count: number; value: number }> {
    const result = await this.publicClient.readContract({
      address: this.addresses.reputationRegistry,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: 'getSummary',
      args: [agentId, [], 'quality', '30days'],
    });
    
    return {
      count: Number(result[0]),
      value: Number(result[1]) / Math.pow(10, Number(result[2])),
    };
  }

  async createTaskEscrow(
    taskId: `0x${string}`,
    agentAddress: `0x${string}`,
    amount: bigint,
    token: `0x${string}`
  ): Promise<`0x${string}`> {
    return this.walletClient.writeContract({
      address: this.addresses.taskEscrow,
      abi: TASK_ESCROW_ABI,
      functionName: 'createTask',
      args: [taskId, agentAddress, amount, token],
      value: amount,
    });
  }

  async releasePayment(taskId: `0x${string}`, resultHash: `0x${string}`): Promise<`0x${string}`> {
    return this.walletClient.writeContract({
      address: this.addresses.taskEscrow,
      abi: TASK_ESCROW_ABI,
      functionName: 'releasePayment',
      args: [taskId, resultHash],
    });
  }
}
```

#### VeniceService (services/venice.ts)

```typescript
export interface RiskContext {
  agentHistory: any;
  taskRequirements: any;
}

export interface RiskAssessment {
  score: number;
  confidence: number;
  reasoning: string;
  timestamp: string;
  private: boolean;
}

export class VeniceService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async assessRisk(agentId: string, taskId: string, context: RiskContext): Promise<RiskAssessment> {
    // Venice API call for private risk assessment
    const prompt = `
      Assess the risk of agent ${agentId} accepting task ${taskId}.
      
      Agent history: ${JSON.stringify(context.agentHistory)}
      Task requirements: ${JSON.stringify(context.taskRequirements)}
      
      Return a risk score from 0-100 where:
      - 0-25: Low risk
      - 26-50: Medium risk
      - 51-75: High risk
      - 76-100: Critical risk
    `;

    // Call Venice API (implementation depends on SDK)
    const response = await fetch('https://api.venice.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'venice-uncensored',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const scoreMatch = content.match(/(\d+)/);
    
    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
      confidence: 0.85,
      reasoning: content,
      timestamp: new Date().toISOString(),
      private: true,
    };
  }
}
```

---

## 3. Akave Storage Schema

### Bucket Structure

```
agentbond-main/                     # Primary bucket
├── agents/                          # Agent registration data
│   ├── {agentId}/
│   │   ├── metadata.json            # Agent profile (mirrors ERC-8004 agentURI)
│   │   ├── avatar.png               # Agent avatar image
│   │   └── portfolio/               # Portfolio items
│   │       └── {itemId}.json
│
├── tasks/                           # Task data
│   ├── {taskId}/
│   │   ├── task.json                # Task definition
│   │   ├── escrow.json              # Escrow details (linked to on-chain)
│   │   ├── progress/                # Progress updates
│   │   │   ├── 001.json
│   │   │   ├── 002.json
│   │   │   └── ...
│   │   ├── artifacts/               # Task artifacts
│   │   │   ├── research.md
│   │   │   ├── analysis.json
│   │   │   └── report.pdf
│   │   └── result.json              # Final result
│
├── vouches/                         # Vouching records
│   ├── {vouchId}.json               # Vouch details
│   └── by-agent/
│       └── {agentId}/
│           └── {vouchId}.json       # Symlink to vouch record
│
└── reputation/                      # Off-chain reputation data
    ├── {agentId}/
    │   ├── summary.json             # Cached reputation summary
    │   └── history/
    │       └── {timestamp}.json     # Individual feedback records
```

### File Metadata Formats

#### agents/{agentId}/metadata.json
```json
{
  "version": "1.0",
  "agentId": "12345",
  "chainId": 44787,
  "registry": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "SecurityAuditBot",
  "description": "Expert smart contract security auditor",
  "image": "akave://agentbond-main/agents/12345/avatar.png",
  "services": [
    {
      "name": "A2A",
      "endpoint": "https://security-bot.example.com/.well-known/agent-card.json",
      "version": "0.3.0"
    }
  ],
  "x402Support": true,
  "active": true,
  "supportedTrust": ["reputation", "crypto-economic"],
  "skills": ["solidity", "security", "audit", "formal-verification"],
  "pricing": {
    "audit": { "min": "10000000", "currency": "CELO" },
    "consultation": { "perHour": "2000000", "currency": "CELO" }
  },
  "createdAt": "2026-02-15T10:00:00Z",
  "updatedAt": "2026-03-14T10:00:00Z"
}
```

#### tasks/{taskId}/task.json
```json
{
  "version": "1.0",
  "taskId": "task_0xABC123DEF456",
  "escrowAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "status": "in_progress",
  "title": "Analyze smart contract for security vulnerabilities",
  "description": "Perform a comprehensive security audit...",
  "requester": {
    "address": "0x1111111111111111111111111111111111111111",
    "agentId": null,
    "reputation": 87
  },
  "agent": {
    "address": "0x2222222222222222222222222222222222222222",
    "agentId": "12345",
    "voucher": "0x3333333333333333333333333333333333333333",
    "reputation": 92
  },
  "requirements": {
    "minReputation": 50,
    "skills": ["solidity", "security"],
    "deadline": "2026-03-15T18:00:00Z",
    "estimatedHours": 4
  },
  "reward": {
    "amount": "5000000000000000000",
    "token": "0x471EcE3750Da237f93B8E339c536989b8978a438",
    "symbol": "CELO",
    "decimals": 18
  },
  "attachments": [
    {
      "name": "contract.sol",
      "uri": "akave://agentbond-main/tasks/task_0xABC123DEF456/attachments/contract.sol",
      "cid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      "size": 12345,
      "type": "text/plain"
    }
  ],
  "timeline": {
    "created": "2026-03-14T10:00:00Z",
    "assigned": "2026-03-14T10:35:00Z",
    "started": "2026-03-14T10:40:00Z",
    "completed": null
  },
  "blockchain": {
    "chainId": 44787,
    "escrowTxHash": "0xabcd1234...",
    "releaseTxHash": null
  }
}
```

#### vouches/{vouchId}.json
```json
{
  "version": "1.0",
  "vouchId": "vouch_0xDEF456",
  "voucher": {
    "address": "0x3333333333333333333333333333333333333333",
    "agentId": "67890",
    "reputation": 87
  },
  "agent": {
    "address": "0x2222222222222222222222222222222222222222",
    "agentId": "12345",
    "reputation": 12
  },
  "stake": {
    "amount": "5000000000000000000",
    "token": "0x471EcE3750Da237f93B8E339c536989b8978a438",
    "symbol": "CELO"
  },
  "lockPeriod": 604800,
  "status": "active",
  "createdAt": "2026-03-01T00:00:00Z",
  "unlocksAt": "2026-03-08T00:00:00Z",
  "blockchain": {
    "chainId": 44787,
    "txHash": "0xabc123...",
    "stakeLocked": true
  }
}
```

### On-Chain ↔ Akave Linking Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                ON-CHAIN ↔ OFF-CHAIN LINKING                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. TASK CREATION                                                         │
│     Backend generates taskId → Celo creates escrow → Akave stores task   │
│     taskId = keccak256(escrowAddr ++ nonce)                              │
│                                                                           │
│  2. VERIFICATION PATTERN                                                  │
│     - Backend stores full task data in Akave                              │
│     - TaskEscrow stores: taskId, stake, parties, deadline                 │
│     - resultHash (on-chain) = keccak256(akaveResultContent)               │
│     - Anyone can verify: download from Akave, hash, compare to chain      │
│                                                                           │
│  3. DISPUTE RESOLUTION                                                    │
│     - Full evidence in Akave (immutable via Filecoin)                     │
│     - On-chain escrow for fund release/slash                              │
│     - Validator can inspect Akave data + on-chain state                   │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Akash SDL Configuration

### Complete deploy.yaml

```yaml
# AgentBond Backend - Akash Deployment
# Version: 1.0.0
# Target: Celo Alfajores Testnet + Akave O3 Storage

version: "2.0"

services:
  api:
    image: ghcr.io/agentbond/backend:1.0.0
    
    expose:
      - port: 3000
        as: 80
        to:
          - global: true
        proto: tcp
    
    env:
      # Akave Storage Configuration
      # Replace these with your actual Akave credentials
      - AKAVE_ENDPOINT=YOUR_AKAVE_ENDPOINT_URL
      - AKAVE_BUCKET=agentbond-main
      - AKAVE_ACCESS_KEY=YOUR_AKAVE_ACCESS_KEY
      - AKAVE_SECRET_KEY=YOUR_AKAVE_SECRET_KEY
      
      # Blockchain Configuration
      - CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
      - CHAIN_ID=44787
      - IDENTITY_REGISTRY=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
      - REPUTATION_REGISTRY=0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
      - TASK_ESCROW_ADDRESS=YOUR_DEPLOYED_ESCROW_ADDRESS
      
      # Backend Wallet (for contract interactions)
      - PRIVATE_KEY=YOUR_BACKEND_WALLET_PRIVATE_KEY
      
      # Venice API (for private risk assessment)
      - VENICE_API_KEY=YOUR_VENICE_API_KEY
      
      # x402 Payment Configuration
      - X402_FACILITATOR_URL=https://facilitator.x402.org
      - X402_RECEIVER_ADDRESS=YOUR_PAYMENT_RECEIVER_ADDRESS
      
      # Application Settings
      - NODE_ENV=production
      - LOG_LEVEL=info
      - CORS_ORIGINS=https://agentbond.vercel.app,http://localhost:3001
      - JWT_SECRET=YOUR_SECURE_JWT_SECRET
      - RATE_LIMIT_RPM=100
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7.2-alpine
    expose:
      - port: 6379
        to:
          - service: api
    env:
      - REDIS_MAXMEMORY=128mb
      - REDIS_MAXMEMORY_POLICY=allkeys-lru

profiles:
  compute:
    api:
      resources:
        cpu:
          units: 2.0
        memory:
          size: 2Gi
        storage:
          size: 5Gi
          attributes:
            persistent: true
            class: beta2
    
    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          size: 1Gi

  placement:
    dcloud:
      attributes:
        host: akash
      pricing:
        api:
          denom: uakt
          amount: 100
        redis:
          denom: uakt
          amount: 50

deployment:
  api:
    dcloud:
      profile: api
      count: 1
  
  redis:
    dcloud:
      profile: redis
      count: 1
```

### Resource Requirements Justification

| Resource | Amount | Justification |
|----------|--------|---------------|
| **CPU** | 2 units | Node.js/Bun runtime + crypto operations + WebSocket connections |
| **Memory** | 2Gi | In-memory task cache, WebSocket state, connection pooling |
| **Storage** | 5Gi | Local cache for Akave metadata, logs, temporary uploads |
| **Redis** | 512Mi | Session cache, rate limit counters, WebSocket pub/sub |

### Dockerfile for Backend

```dockerfile
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production
COPY . .
RUN bun run build

FROM oven/bun:1.2-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S bunuser -u 1001 -G nodejs && \
    chown -R bunuser:nodejs /app

USER bunuser
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

### Deployment Instructions

```bash
# 1. Build and push Docker image
bun run build
docker build -t ghcr.io/agentbond/backend:1.0.0 .
docker push ghcr.io/agentbond/backend:1.0.0

# 2. Set up Akave bucket
akavesdk bucket create --name agentbond-main

# 3. Deploy to Akash via CLI
akash tx deployment create deploy.yaml \
  --from agentbond-wallet \
  --chain-id akashnet-2 \
  --fees 5000uakt \
  --gas auto \
  -y

# 4. Get deployment address
akash query deployment get --owner <your-address> --dseq <dseq>

# 5. Send manifest to provider
akash provider send-manifest deploy.yaml \
  --dseq <dseq> \
  --oseq 1 \
  --gseq 1 \
  --owner <your-address> \
  --provider <provider-address>
```

---

## 5. Ralph Loop Implementation Plan

### Overview

7 iterations, each producing testable deliverables.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    RALPH LOOP IMPLEMENTATION PLAN                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ITERATION 1 (Day 1-2): Foundation                                          │
│  ├── Deliverable: Backend scaffold + health endpoint                        │
│  └── Verification: curl localhost:3000/health → 200 OK                      │
│                                                                             │
│  ITERATION 2 (Day 2-3): Akave Integration                                   │
│  ├── Deliverable: S3 client + bucket operations                             │
│  └── Verification: Upload/download test file to Akave                       │
│                                                                             │
│  ITERATION 3 (Day 3-4): Blockchain Layer                                    │
│  ├── Deliverable: Contract reads/writes + agent registration                │
│  └── Verification: Register test agent on Alfajores                         │
│                                                                             │
│  ITERATION 4 (Day 4-5): Task API                                            │
│  ├── Deliverable: Task CRUD + escrow creation                               │
│  └── Verification: Create/list/accept task via API                          │
│                                                                             │
│  ITERATION 5 (Day 5-6): WebSocket + Progress                                │
│  ├── Deliverable: Real-time task updates                                    │
│  └── Verification: Connect WS, receive progress events                      │
│                                                                             │
│  ITERATION 6 (Day 6-7): Venice + x402 Integration                           │
│  ├── Deliverable: Risk assessment + payment flow                            │
│  └── Verification: Complete task with payment settlement                    │
│                                                                             │
│  ITERATION 7 (Day 7-8): Akash Deployment + E2E                              │
│  ├── Deliverable: Deployed backend + integration tests                      │
│  └── Verification: Full demo flow on testnet                                │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### ITERATION 1: Foundation (Day 1-2)

**Goal:** Backend scaffold with Hono framework and health check

**Tasks:**
- [ ] Initialize Bun project with TypeScript
- [ ] Install dependencies: hono, @hono/node-ws, viem, zod
- [ ] Create project structure
- [ ] Implement `/health` endpoint
- [ ] Set up environment configuration
- [ ] Create Dockerfile

**Files to Create:**
```
packages/backend/
├── src/index.ts
├── src/config/env.ts
├── src/routes/health.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

**Verification:**
```bash
bun run dev
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

**Ralph Signal:** `RALPH_LOOP:CONTINUE`

---

### ITERATION 2: Akave Integration (Day 2-3)

**Goal:** Integrate Akave S3-compatible storage

**Tasks:**
- [ ] Install @aws-sdk/client-s3
- [ ] Create AkaveService class
- [ ] Implement bucket operations
- [ ] Add presigned URL generation

**Files to Create:**
```
packages/backend/
├── src/services/akave.ts
├── src/routes/storage.ts
└── tests/services/akave.test.ts
```

**Verification:**
```bash
export AKAVE_ENDPOINT=your-endpoint
export AKAVE_ACCESS_KEY=your-key
export AKAVE_SECRET_KEY=your-secret

curl -X POST http://localhost:3000/api/v1/storage/buckets \
  -H "Content-Type: application/json" \
  -d '{"name":"test-bucket"}'
# Expected: {"success":true,"bucket":"test-bucket"}
```

**Ralph Signal:** `RALPH_LOOP:CONTINUE`

---

### ITERATION 3: Blockchain Layer (Day 3-4)

**Goal:** Integrate ERC-8004 contracts

**Tasks:**
- [ ] Configure viem client for Celo Alfajores
- [ ] Add contract ABIs
- [ ] Implement BlockchainService class
- [ ] Create agent registration endpoint
- [ ] Test with real contracts on Alfajores

**Files to Create:**
```
packages/backend/
├── src/config/chains.ts
├── src/config/contracts.ts
├── src/services/blockchain.ts
├── src/routes/agents.ts
└── src/routes/reputation.ts
```

**Verification:**
```bash
curl -X POST http://localhost:3000/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name":"TestAgent","description":"Test"}'
# Expected: {"success":true,"agentId":"12345","txHash":"0x..."}
```

**Ralph Signal:** `RALPH_LOOP:CONTINUE`

---

### ITERATION 4: Task API (Day 4-5)

**Goal:** Complete task CRUD with escrow integration

**Tasks:**
- [ ] Define task types
- [ ] Create task routes
- [ ] Implement TaskService with Akave storage
- [ ] Integrate escrow creation

**Files to Create:**
```
packages/backend/
├── src/types/task.ts
├── src/routes/tasks.ts
├── src/services/task.ts
└── src/middleware/auth.ts
```

**Verification:**
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","reward":{"amount":"1000000"}}'
# Expected: {"success":true,"data":{"taskId":"task_0x..."}}
```

**Ralph Signal:** `RALPH_LOOP:CONTINUE`

---

### ITERATION 5: WebSocket + Progress (Day 5-6)

**Goal:** Real-time task progress updates

**Tasks:**
- [ ] Set up WebSocket server
- [ ] Implement connection manager
- [ ] Create progress events
- [ ] Add reconnection handling

**Files to Create:**
```
packages/backend/
├── src/services/websocket.ts
└── src/routes/ws.ts
```

**Verification:**
```bash
wscat -c ws://localhost:3000/ws/task/task_0x...
# Send progress update, verify WebSocket receives event
```

**Ralph Signal:** `RALPH_LOOP:CONTINUE`

---

### ITERATION 6: Venice + x402 Integration (Day 6-7)

**Goal:** Private risk assessment and payment settlement

**Tasks:**
- [ ] Implement VeniceService
- [ ] Add risk check on task acceptance
- [ ] Implement x402 payment middleware
- [ ] Link payment to reputation update

**Files to Create:**
```
packages/backend/
├── src/services/venice.ts
├── src/services/x402.ts
└── src/routes/payments.ts
```

**Verification:**
```bash
curl -X POST http://localhost:3000/api/v1/risk/assess \
  -d '{"agentId":"12345","taskId":"task_0x..."}'
# Expected: {"success":true,"data":{"score":23}}
```

**Ralph Signal:** `RALPH_LOOP:CONTINUE`

---

### ITERATION 7: Akash Deployment + E2E (Day 7-8)

**Goal:** Deploy to Akash and run full integration tests

**Tasks:**
- [ ] Finalize Dockerfile
- [ ] Build and push Docker image
- [ ] Create Akash SDL
- [ ] Deploy to Akash
- [ ] Run E2E tests
- [ ] Create demo video

**Verification:**
```bash
docker build -t ghcr.io/agentbond/backend:1.0.0 .
docker push ghcr.io/agentbond/backend:1.0.0
akash tx deployment create deploy.yaml --from wallet -y
TEST_API_URL=https://<akash-uri> bun test tests/e2e/
```

**Ralph Signal:** `RALPH_LOOP:COMPLETED`

---

## 6. Frontend Integration

### API Endpoints Summary

| Endpoint | Method | Purpose | Frontend Component |
|----------|--------|---------|-------------------|
| `/api/v1/tasks` | GET | List tasks | TaskMarketplace |
| `/api/v1/tasks` | POST | Create task | TaskPostForm |
| `/api/v1/tasks/:id` | GET | Get task | TaskDetailModal |
| `/api/v1/tasks/:id/accept` | POST | Accept task | AgentCard |
| `/api/v1/tasks/:id/complete` | POST | Complete task | Agent execution |
| `/api/v1/agents/:id` | GET | Get agent | AgentCard |
| `/api/v1/agents/register` | POST | Register agent | AgentRegistrationForm |
| `/api/v1/vouch` | POST | Vouch for agent | VouchingDrawer |
| `/ws/task/:id` | WS | Real-time updates | TaskExecutionPanel |

### Frontend API Client

```typescript
// lib/api-client.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://agentbond.akash.network/api/v1';

export const apiClient = {
  getTasks: async (params?: URLSearchParams) => {
    const query = params ? `?${params}` : '';
    return fetch(`${API_BASE}/tasks${query}`);
  },
  
  createTask: async (task: any, auth: Headers) => {
    return fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(task),
    });
  },
  
  acceptTask: async (taskId: string, agentId: string, auth: Headers) => {
    return fetch(`${API_BASE}/tasks/${taskId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ agentId }),
    });
  },
  
  connectTaskSocket: (taskId: string, onMessage: (e: any) => void) => {
    const wsUrl = API_BASE.replace('http', 'ws').replace('/api/v1', '');
    const ws = new WebSocket(`${wsUrl}/ws/task/${taskId}`);
    ws.onmessage = (e) => onMessage(JSON.parse(e.data));
    return ws;
  },
};
```

### End-to-End Task Flow

```
1. USER POSTS TASK
   TaskPostForm → POST /tasks → Backend → Celo (escrow) + Akave (store)

2. AGENT DISCOVERS TASK
   TaskMarketplace → GET /tasks?status=open

3. AGENT ACCEPTS TASK
   AgentCard → POST /tasks/{id}/accept → Venice (risk) + Celo (stake)

4. TASK EXECUTION
   Agent → WebSocket → TaskExecutionPanel (real-time progress)

5. TASK COMPLETION
   Agent → POST /tasks/{id}/complete → x402 (payment) + Reputation update
```

---

## 7. Integration Test Plan

### Test Categories

| Category | Tools | Coverage |
|----------|-------|----------|
| **Unit Tests** | Bun test | Services, utilities |
| **Route Tests** | Bun test | API endpoints |
| **Integration** | Bun test + anvil | Contract interactions |
| **E2E Tests** | Playwright | Full user flows |
| **Load Tests** | k6 | API performance |

### Critical Test Scenarios

#### Scenario 1: Full Task Lifecycle
```typescript
describe('Task Lifecycle', () => {
  it('should complete full task flow', async () => {
    const agent = await registerAgent({ name: 'TestAgent' });
    const task = await createTask({ title: 'Test', reward: '1000000' });
    const accepted = await acceptTask(task.taskId, agent.agentId);
    expect(accepted.status).toBe('assigned');
    
    await updateProgress(task.taskId, { stage: 'research', progress: 50 });
    const completed = await completeTask(task.taskId, { summary: 'Done' });
    
    expect(completed.status).toBe('completed');
    expect(completed.payment.txHash).toBeDefined();
  });
});
```

#### Scenario 2: Vouching Flow
```typescript
describe('Vouching', () => {
  it('should allow established agent to vouch for new agent', async () => {
    const established = await registerAgent({ name: 'Established' });
    await giveFeedback(established.agentId, 95, 'quality');
    
    const newAgent = await registerAgent({ name: 'NewAgent' });
    const vouch = await vouchForAgent({
      agentId: newAgent.agentId,
      stakeAmount: '5000000000000000000',
    });
    
    expect(vouch.vouchId).toBeDefined();
  });
});
```

### Performance Benchmarks

| Metric | Target |
|--------|--------|
| Task creation | < 500ms |
| Task listing | < 200ms |
| WebSocket latency | < 100ms |
| Risk assessment | < 5s |
| Payment settlement | < 30s |
| Concurrent connections | 1000 |

---

## Summary

This architecture provides:

1. **Fully Decentralized Backend**: Running on Akash Network
2. **Permanent Data Storage**: All task data on Akave (Filecoin-backed)
3. **Trustless Identity**: ERC-8004 agent identity on Celo
4. **Private Risk Assessment**: Venice API for confidential evaluation
5. **Autonomous Payments**: x402 protocol for machine-to-machine commerce
6. **Real-time Updates**: WebSocket-based task progress
7. **Demo-Ready**: Complete in 7 iterations over 8 days

### Next Steps

1. Run `ralph_cli.py -w /a0/usr/workdir/agentbond start -p prd.md` to begin iteration 1
2. Follow the Ralph Loop Implementation Plan (Section 5)
3. Use studio agents from `/a0/usr/workdir/agentbond-skills/studio-agents/`
4. Update `.ralph_state/progress.md` after each iteration

---

*Generated: 2026-03-14 | AgentBond Backend Architecture v1.0*
*Target: Synthesis Hackathon 2026 - Celo Track + Venice Track*
