# 🔄 STEER BUILD: Backend Architecture Integration

> **Purpose:** Shift the existing Ralph Loop build to integrate real backend with Akave storage and Akash deployment
> **Target:** Replace ALL mock data with real decentralized infrastructure
> **Timeline:** 7 iterations over remaining days

---

## 🎯 STEER PROMPT (Copy to existing Ralph chat)

```
## CRITICAL PIVOT: Backend Architecture Integration

The build needs to shift to integrate real backend infrastructure. **NO MOCK DATA** - all task data must be real and stored on Akave, deployed via Akash.

### Immediate Actions Required:

1. **Read the Backend Architecture:**
   cat /a0/usr/workdir/agentbond/BACKEND_ARCHITECTURE.md

2. **Delete Mock Data:**
   rm packages/nextjs/lib/demoData.ts
   
3. **Create Backend Package:**
   mkdir -p packages/backend/src

4. **Follow 7-Iteration Plan:** (see BACKEND_ARCHITECTURE.md section 4)

### Key Changes:
- Replace DEMO_AGENTS with real ERC-8004 identity queries
- Replace DEMO_TASKS with Akave-stored task data
- Add WebSocket for real-time task progress
- Deploy to Akash (SDL at deploy.yaml)

### New Dependencies:
- @akave/sdk (S3-compatible storage)
- hono (API framework)
- ioredis (caching)

Signal: RALPH_LOOP:CONTINUE after reading BACKEND_ARCHITECTURE.md
```

---

## 📋 PRD AMENDMENTS (Add to prd.md)

### Section 8.5: Real Data Requirements (NEW)

```markdown
## 8.5 Real Data Requirements - NO MOCKS

### Critical Constraint
**All task and agent data MUST be real - no mock data allowed.**

### Data Storage Architecture

| Data Type | Storage Layer | Access Pattern |
|-----------|---------------|----------------|
| **Task Definitions** | Akave (bucket: tasks/) | REST API + WebSocket |
| **Agent Profiles** | Akave (bucket: agents/) + ERC-8004 | On-chain identity |
| **Task Completions** | Akave (bucket: completions/) | REST API |
| **Vouch Records** | On-chain (ReputationStaking.sol) | Contract read |
| **Reputation Scores** | On-chain (ERC-8004) + Cached | Contract read + Redis |

### Akave Bucket Schema

```
agentbond-main/
├── agents/
│   └── {agentId}/
│       ├── metadata.json       # Agent profile, skills, reputation
│       └── portfolio.json       # Task history, earnings
├── tasks/
│   └── {taskId}/
│       ├── definition.json      # Task spec, reward, deadline
│       ├── artifacts/           # Files, code, outputs
│       └── completion.json      # Result, proof, payment tx
└── vouches/
    └── {vouchId}.json          # Vouch details, stake, risk score
```

### API Endpoints Required

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List all open tasks |
| POST | /api/tasks | Create new task (stores to Akave) |
| GET | /api/tasks/:id | Get task details from Akave |
| POST | /api/tasks/:id/accept | Agent accepts task |
| POST | /api/tasks/:id/complete | Submit completion proof |
| GET | /api/agents/:id | Get agent profile |
| POST | /api/agents/register | Register new agent |
| GET | /api/agents/:id/reputation | Get on-chain reputation |
| POST | /api/vouch | Vouch for agent |
| WS | /ws/tasks/:id | Real-time task progress |

### Frontend Changes Required

1. **Delete demoData.ts** - Remove all mock data
2. **Create API Client:**
   ```typescript
   // packages/nextjs/lib/api.ts
   const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
   
   export async function getTasks(): Promise<Task[]> {
     const res = await fetch(`${API_BASE}/api/tasks`);
     return res.json();
   }
   ```

3. **WebSocket Hook:**
   ```typescript
   // packages/nextjs/hooks/useTaskProgress.ts
   export function useTaskProgress(taskId: string) {
     const [progress, setProgress] = useState(0);
     
     useEffect(() => {
       const ws = new WebSocket(`${WS_BASE}/ws/tasks/${taskId}`);
       ws.onmessage = (e) => setProgress(JSON.parse(e.data));
       return () => ws.close();
     }, [taskId]);
     
     return progress;
   }
   ```
```

---

## 🔄 7-Iteration Backend Integration Plan

### Iteration 1: Backend Scaffold (Day 2)
**Owner:** backend-architect
**Deliverables:**
- [ ] packages/backend/ with Bun + Hono
- [ ] Health endpoint GET /health
- [ ] CORS configured
- [ ] Environment setup

**Commands:**
```bash
cd packages/backend
bun init
bun add hono @hono/node-server dotenv
```

**Test:** `curl http://localhost:3001/health` → `{"status":"ok"}`

---

### Iteration 2: Akave S3 Integration (Day 2-3)
**Owner:** backend-architect
**Deliverables:**
- [ ] AkaveService class with S3 client
- [ ] Bucket creation: agentbond-main
- [ ] File upload/download functions
- [ ] Test with sample task JSON

**Code:**
```typescript
// packages/backend/src/services/akave.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export class AkaveService {
  private client: S3Client;
  private bucket = 'agentbond-main';
  
  constructor() {
    this.client = new S3Client({
      endpoint: process.env.AKAVE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AKAVE_ACCESS_KEY!,
        secretAccessKey: process.env.AKAVE_SECRET_KEY!,
      },
    });
  }
  
  async uploadTask(taskId: string, data: object) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: `tasks/${taskId}/definition.json`,
      Body: JSON.stringify(data),
    }));
  }
}
```

**Test:** Upload and retrieve a test task

---

### Iteration 3: Task API + Akave (Day 3-4)
**Owner:** backend-architect
**Deliverables:**
- [ ] GET /api/tasks - List from Akave
- [ ] POST /api/tasks - Create to Akave
- [ ] GET /api/tasks/:id - Read from Akave
- [ ] Task type definitions

**Test:**
```bash
curl -X POST http://localhost:3001/api/tasks -d '{"title":"Test","reward":"5"}'
curl http://localhost:3001/api/tasks
```

---

### Iteration 4: ERC-8004 Integration (Day 4-5)
**Owner:** ai-engineer
**Deliverables:**
- [ ] BlockchainService with viem
- [ ] Agent registration check
- [ ] Reputation score fetch
- [ ] Vouching contract calls

**Code:**
```typescript
// packages/backend/src/services/blockchain.ts
import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

export class BlockchainService {
  private client = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
  });
  
  async getAgentReputation(agentId: address) {
    return await this.client.readContract({
      address: IDENTITY_REGISTRY,
      abi: ReputationABI,
      functionName: 'getReputation',
      args: [agentId],
    });
  }
}
```

**Test:** Query real ERC-8004 registry

---

### Iteration 5: WebSocket Real-Time (Day 5-6)
**Owner:** frontend-developer
**Deliverables:**
- [ ] WebSocket server on /ws/tasks/:id
- [ ] Progress broadcast on task events
- [ ] Frontend hook: useTaskProgress
- [ ] Update TaskExecutionPanel to use WebSocket

**Test:** Watch task progress in real-time

---

### Iteration 6: Venice + x402 Payment (Day 6-7)
**Owner:** ai-engineer
**Deliverables:**
- [ ] Venice API integration for risk assessment
- [ ] x402 payment protocol integration
- [ ] Payment completion flow
- [ ] Test with real API keys

---

### Iteration 7: Akash Deployment (Day 7-8)
**Owner:** backend-architect
**Deliverables:**
- [ ] Complete SDL (deploy.yaml)
- [ ] Dockerfile for backend
- [ ] Deploy to Akash testnet
- [ ] E2E test with deployed backend

**SDL Template:** (see BACKEND_ARCHITECTURE.md section 3)

---

## 🚀 Quick Start Commands

### For Ralph Loop Chat

```bash
# 1. Read the architecture
cat /a0/usr/workdir/agentbond/BACKEND_ARCHITECTURE.md

# 2. Check current progress
cat /a0/usr/workdir/agentbond/.ralph_state/progress.md 2>/dev/null || echo "No progress yet"

# 3. Start Iteration 1
mkdir -p packages/backend/src
cd packages/backend && bun init

# 4. After each iteration
python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w /a0/usr/workdir/agentbond record --iteration N --result "description"

# 5. Commit daily
python /a0/usr/workdir/ralph-harness/scripts/git_helper.py --day N --desc "Backend integration"
```

### Delegate to Studio Agents

```json
{
  "tool_name": "call_subordinate",
  "tool_args": {
    "profile": "developer",
    "message": "Read /a0/usr/workdir/agentbond-skills/studio-agents/backend-architect.md then implement Iteration 2: Akave S3 Integration. Create packages/backend/src/services/akave.ts with S3Client configured for Akave endpoint."
  }
}
```

---

## ✅ Success Criteria

| Criteria | Verification |
|----------|-------------|
| No mock data | `grep -r "DEMO_" packages/` returns empty |
| Akave storage | Can upload/download tasks via API |
| On-chain reputation | Real ERC-8004 queries work |
| WebSocket works | Real-time task progress visible |
| Akash deployed | Backend accessible at Akash URL |
| Demo ready | Full flow: create task → assign → complete → pay |

---

## 📁 Files to Update

| File | Action |
|------|--------|
| `prd.md` | Add Section 8.5 (Real Data Requirements) |
| `packages/nextjs/lib/demoData.ts` | DELETE |
| `packages/nextjs/lib/api.ts` | CREATE - API client |
| `packages/nextjs/hooks/useTaskProgress.ts` | CREATE - WebSocket hook |
| `packages/backend/` | CREATE - Full backend package |
| `deploy.yaml` | CREATE - Akash SDL |

---

**Signal after completing: RALPH_LOOP:CONTINUE**
