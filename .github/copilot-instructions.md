# 🤖 AgentBond GitHub Copilot Instructions

> Comprehensive instructions for GitHub Copilot to work autonomously on the AgentBond project.

---

## 📋 Project Overview

**AgentBond** is a decentralized reputation-backed agent lending protocol for the Synthesis Hackathon 2026. It targets:
- **Celo ($10K track)** - ERC-8004 identity, CELO staking
- **Venice ($10K track)** - Private AI inference

### Architecture
```
agentbond/
├── packages/
│   ├── contracts/     # Foundry smart contracts (Solidity)
│   ├── agent/         # Venice SDK agent with OODA loop (TypeScript/Bun)
│   ├── backend/       # Hono API server with Akave/Akash (TypeScript/Bun)
│   └── nextjs/        # Scaffold-ETH 2 frontend (React/Next.js)
├── skills/            # Custom skills for Copilot
└── .ralph_state/      # Ralph loop state management
```

---

## 🛠️ CRITICAL RULES

### 1. NEVER Use `:latest` Image Tags
```yaml
# ✅ CORRECT
image: nginx:1.25.3
image: node:20-alpine

# ❌ WRONG - causes deployment issues
image: nginx:latest
image: nginx
```

### 2. Always Specify Explicit Versions
- Docker images: Pin to specific versions
- npm packages: Use exact versions in production
- Solidity: Use ^0.8.20 pragma

### 3. NO MOCK DATA Policy
- All task data must be stored on Akave (Filecoin-backed S3)
- Backend must be deployed on Akash Network
- Use real API endpoints, not demo data

---

## ☁️ AKASH NETWORK SKILLS

### SDL Structure (Required Sections)
```yaml
version: "2.0"  # or "2.1" for IP endpoints

services:       # Container definitions
  web:
    image: node:20-alpine
    env:
      - NODE_ENV=production
    expose:
      - port: 3000
        as: 80
        to:
          - global: true

profiles:       # Compute resources & placement
  compute:
    web:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          size: 1Gi
  placement:
    dcloud:
      pricing:
        web:
          denom: uakt
          amount: 1000

deployment:
  web:
    dcloud:
      profile: web
      count: 1
```

### Common Akash Patterns

#### Persistent Storage
```yaml
profiles:
  compute:
    app:
      resources:
        storage:
          - size: 10Gi
            attributes:
              persistent: true
              class: beta2
```

#### GPU Workloads
```yaml
profiles:
  compute:
    ml:
      resources:
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: a100
```

#### Environment Variables
```yaml
services:
  app:
    env:
      - DATABASE_URL=postgres://user:pass@db:5432/agentbond
      - NODE_ENV=production
      - AKAVE_ENDPOINT=https://.akave.io
```

### Payment Options
- **uakt**: Native Akash Token (`amount: 1000`)
- **USDC**: Via IBC denom (`ibc/170C677610AC31DF0904FFE09CD3B5C657492170E7E52372E48756B71E56F2F1`)

### Deployment Commands
```bash
# Install Akash CLI
curl -sSfL https://raw.githubusercontent.com/akash-network/provider/main/_docs/guides/binaries.md | sh

# Create wallet
akash keys default wallet

# Deploy
akash tx deployment create deploy.yaml --from default --chain-id akashnet-2
```

---

## 🎨 INTERFACE-CRAFT DESIGN SKILLS

### Design Philosophy (Ryo Lu / Linear Style)
- **Simplicity is Earned**: Compress complexity into digestible form
- **Systems > Screens**: Design containers, not fixed layouts
- **Discovery > Prescription**: Pro-grade tools with beginner-friendly packaging
- **Soulful Design**: Iteration and taste over first AI output

### Color Tokens (CSS Custom Properties)
```css
:root {
  /* Background */
  --bg-primary: #0A0A0B;
  --bg-secondary: #111113;
  --bg-tertiary: #1A1A1D;
  --bg-elevated: #222225;
  
  /* Text */
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;
  
  /* Accent */
  --accent-primary: #6366F1;
  --accent-secondary: #8B5CF6;
  --accent-success: #10B981;
  --accent-warning: #F59E0B;
  --accent-error: #EF4444;
  
  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-default: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.20);
}
```

### Typography Scale
```css
--font-xs: 0.75rem;    /* 12px */
--font-sm: 0.875rem;   /* 14px */
--font-base: 1rem;     /* 16px */
--font-lg: 1.125rem;   /* 18px */
--font-xl: 1.25rem;    /* 20px */
--font-2xl: 1.5rem;    /* 24px */
--font-3xl: 1.875rem;  /* 30px */
--font-4xl: 2.25rem;   /* 36px */
```

### Spacing System
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Animation Timing
- **Micro-interactions**: 150-200ms (hover, click)
- **State transitions**: 200-300ms (expand, collapse)
- **Page transitions**: 300-500ms (fade, slide)
- **Complex animations**: 500-800ms (entrance, celebration)

### Animation Easing
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
--spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Storyboard Animation DSL
```typescript
interface AnimationStage {
  name: string;
  duration: number;
  easing: string;
  properties: Record<string, { from: any; to: any }>;
}

const entranceStoryboard: AnimationStage[] = [
  {
    name: "fade-in",
    duration: 200,
    easing: "ease-out",
    properties: {
      opacity: { from: 0, to: 1 }
    }
  },
  {
    name: "scale-up",
    duration: 300,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    properties: {
      transform: { from: "scale(0.95)", to: "scale(1)" }
    }
  }
];
```

### Glassmorphism Effects
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.2),
    0 2px 4px -2px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

---

## 👥 5 SPECIALIZED AGENTS

### 1. AI Engineer (`studio-agents/ai-engineer.md`)
**Role**: LLM integration, agent architecture, AI tooling

**Responsibilities**:
- Integrate Venice SDK for private AI inference
- Implement OODA loop pattern (Observe-Orient-Decide-Act)
- Build agent memory and context management
- Design tool interfaces for LLM function calling

**Key Files**:
- `packages/agent/src/agent.ts`
- `packages/agent/src/llm.ts`
- `packages/agent/src/tools/*.ts`

**Code Pattern**:
```typescript
// OODA Loop Agent
class Agent extends EventEmitter {
  async observe(): Promise<Context> { /* gather inputs */ }
  async orient(context: Context): Promise<Analysis> { /* analyze */ }
  async decide(analysis: Analysis): Promise<Action[]> { /* plan */ }
  async act(actions: Action[]): Promise<Result[]> { /* execute */ }
  
  async run(): Promise<void> {
    const context = await this.observe();
    const analysis = await this.orient(context);
    const actions = await this.decide(analysis);
    const results = await this.act(actions);
    this.emit('complete', results);
  }
}
```

---

### 2. Backend Architect (`studio-agents/backend-architect.md`)
**Role**: API design, database schema, infrastructure

**Responsibilities**:
- Design RESTful API routes with Hono framework
- Implement Akave S3-compatible storage integration
- Set up WebSocket real-time updates
- Configure Akash deployment SDL files

**Key Files**:
- `packages/backend/src/routes/*.ts`
- `packages/backend/src/services/AkaveService.ts`
- `deploy.yaml`

**Code Pattern**:
```typescript
// Hono API Route with Zod validation
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  reward: z.number().positive(),
  deadline: z.string().datetime()
});

app.post('/tasks', zValidator('json', taskSchema), async (c) => {
  const data = c.req.valid('json');
  // Store on Akave
  const task = await akaveService.storeTask(data);
  return c.json(task, 201);
});
```

---

### 3. Frontend Developer (`studio-agents/frontend-developer.md`)
**Role**: React components, state management, UI implementation

**Responsibilities**:
- Build animated React components (AgentCard, TaskExecutionPanel)
- Implement Scaffold-ETH 2 integration with RainbowKit
- Connect to real backend API endpoints
- Apply design system tokens and animations

**Key Files**:
- `packages/nextjs/components/*.tsx`
- `packages/nextjs/hooks/useApi.ts`
- `packages/nextjs/lib/api.ts`

**Code Pattern**:
```typescript
// Animated Component with Framer Motion
import { motion } from 'framer-motion';

const AgentCard = ({ agent }: { agent: Agent }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    className="glass-panel p-6"
  >
    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
      {agent.name}
    </h3>
    <p className="text-[var(--text-secondary)]">{agent.description}</p>
  </motion.div>
);
```

---

### 4. Rapid Prototyper (`studio-agents/rapid-prototyper.md`)
**Role**: Quick iterations, demo features, proof-of-concepts

**Responsibilities**:
- Build fast MVP features
- Create demo scenarios and mock data (for demos only)
- Integrate hackathon-specific features
- Polish UI/UX for presentations

**Key Files**:
- `packages/nextjs/app/page.tsx`
- `packages/nextjs/public/screenshots/`

**Code Pattern**:
```typescript
// Quick prototype with placeholder data
const DemoFlow = () => {
  const [step, setStep] = useState<'vouch' | 'assess' | 'execute' | 'pay'>('vouch');
  
  const nextStep = () => setStep(s => {
    if (s === 'vouch') return 'assess';
    if (s === 'assess') return 'execute';
    if (s === 'execute') return 'pay';
    return 'vouch';
  });
  
  return (
    <div className="demo-container">
      <StepIndicator current={step} />
      <button onClick={nextStep}>Continue</button>
    </div>
  );
};
```

---

### 5. Test Writer/Fixer (`studio-agents/test-writer-fixer.md`)
**Role**: Test coverage, bug fixes, CI/CD reliability

**Responsibilities**:
- Write Foundry tests for Solidity contracts
- Create integration tests for API routes
- Fix failing tests and improve coverage
- Set up GitHub Actions CI/CD

**Key Files**:
- `packages/contracts/test/*.t.sol`
- `packages/backend/src/**/*.test.ts`

**Code Pattern (Foundry)**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry registry;
    address owner = address(0x1);
    address agent = address(0x2);
    
    function setUp() public {
        vm.prank(owner);
        registry = new AgentRegistry();
    }
    
    function test_RegisterAgent() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent", "https://metadata.uri");
        
        assertEq(registry.getAgentName(agent), "TestAgent");
    }
    
    function testFail_DoubleRegister() public {
        vm.startPrank(agent);
        registry.registerAgent("Agent1", "uri1");
        registry.registerAgent("Agent2", "uri2"); // Should fail
        vm.stopPrank();
    }
}
```

---

## 🔧 5 ETHEREUM SKILLS

### 1. Standards (`ethskills/standards.md`)
**ERC-8004**: Identity Registry for AI Agents
```solidity
interface IIdentityRegistry {
    function register(address agent, string calldata metadata) external;
    function getMetadata(address agent) external view returns (string memory);
    function isValid(address agent) external view returns (bool);
}
```

**x402**: Payment Protocol for Machine-to-Machine Commerce
```solidity
interface IPaymentProtocol {
    function initiatePayment(address to, uint256 amount) external;
    function confirmPayment(bytes32 paymentId) external;
}
```

**EIP-7702**: Account Abstraction
- Enables smart contract wallet functionality for EOAs
- Batch transactions for gas efficiency

---

### 2. Tools (`ethskills/tools.md`)

**Foundry** (Solidity Development)
```bash
# Install
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Create project
forge init

# Build
forge build

# Test
forge test -vvvv

# Deploy
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

**Scaffold-ETH 2** (Frontend)
```bash
# Create app
npx create-eth@latest

# Start local chain
yarn chain

# Deploy contracts
yarn deploy

# Start frontend
yarn start
```

**MCP** (Model Context Protocol)
- Connect AI agents to blockchain data
- Standardized tool interfaces

---

### 3. Layer 2 (`ethskills/layer2.md`)

**Celo L2 (OP Stack)**
- **Testnet**: Alfajores (chainId: 44787)
- **Mainnet**: Celo (chainId: 42220)

**Configuration**:
```typescript
// scaffold.config.ts
const config = {
  targetNetworks: [celoAlfajores],
  pollingInterval: 3000,
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
};
```

**Gas Optimization**:
- Use `calldata` instead of `memory` for external function parameters
- Pack storage variables
- Use events for data logging

---

### 4. Security (`ethskills/security.md`)

**Common Vulnerabilities**:
- Reentrancy: Use `ReentrancyGuard`
- Integer Overflow: Use Solidity ^0.8.0 (built-in SafeMath)
- Access Control: Use `Ownable` or `AccessControl`

**Security Pattern**:
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureContract is ReentrancyGuard, Ownable {
    mapping(address => uint256) public balances;
    
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        
        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

---

### 5. Ship (`ethskills/ship.md`)

**End-to-End Deployment Checklist**:

1. **Local Development**
   - `forge build` - Compile contracts
   - `forge test` - Run all tests
   - `yarn start` - Start frontend

2. **Testnet Deployment**
   - Fund deployer account with CELO
   - Set environment variables (RPC_URL, PRIVATE_KEY)
   - Run deployment script
   - Verify contracts on Celoscan

3. **Frontend Deployment**
   - Update contract addresses
   - Configure environment variables
   - Deploy to Vercel or Akash

4. **Verification**
   - Test all user flows
   - Verify contract interactions
   - Check event emissions

**Deployment Script**:
```solidity
// script/Deploy.s.sol
contract DeployAgentBond is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        AgentRegistry registry = new AgentRegistry();
        ReputationStaking staking = new ReputationStaking(address(registry));
        TaskEscrow escrow = new TaskEscrow(address(staking));
        
        vm.stopBroadcast();
    }
}
```

---

## 📝 PR DESCRIPTION TEMPLATE

When creating PRs, include:

```markdown
## 🎯 Summary
Brief description of changes

## 📋 Related Issue
Closes #[issue-number]

## 🔄 Changes Made
- [ ] Change 1
- [ ] Change 2

## ✅ Testing
- [ ] Tests pass (`forge test`)
- [ ] No breaking changes
- [ ] TypeScript compiles

## 📸 Screenshots (if UI)
Before/After images

## 🔗 References
- Linear: [Issue Link]
- Docs: [Relevant Documentation]
```

---

## 🚀 QUICK START COMMANDS

```bash
# Install dependencies
yarn install

# Run backend
cd packages/backend && bun run dev

# Run frontend  
cd packages/nextjs && yarn dev

# Run agent
cd packages/agent && bun run dev

# Run tests
cd packages/contracts && forge test -vvvv

# Build all
yarn build
```

---

## 📚 KEY FILES REFERENCE

| Area | Key Files |
|------|-----------|
| **Smart Contracts** | `packages/contracts/src/*.sol` |
| **Contract Tests** | `packages/contracts/test/*.t.sol` |
| **Agent Core** | `packages/agent/src/agent.ts` |
| **Agent Tools** | `packages/agent/src/tools/*.ts` |
| **API Routes** | `packages/backend/src/routes/*.ts` |
| **Akave Service** | `packages/backend/src/services/AkaveService.ts` |
| **Frontend Pages** | `packages/nextjs/app/page.tsx` |
| **Components** | `packages/nextjs/components/*.tsx` |
| **API Client** | `packages/nextjs/lib/api.ts` |
| **Akash Deploy** | `deploy.yaml` |
| **Ralph State** | `.ralph_state/loop_state.json` |

---

*Last updated: 2026-03-16*
