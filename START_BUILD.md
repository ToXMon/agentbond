# 🚀 AGENTBOND AUTONOMOUS BUILD KICKOFF

> **Paste this ENTIRE document into a fresh Agent Zero chat to start the full autonomous build**

---

## ⚡ QUICK START (Copy-paste this prompt)

```
I am starting an autonomous Ralph Loop build for AgentBond - a reputation-backed agent lending protocol for the Synthesis Hackathon ($20K prizes).

## My Role
Act as a DEVELOPER agent leading this implementation. Use profile="developer" when delegating to subordinates.

## First Actions (Do These Now)
1. Read the PRD: cat /a0/usr/workdir/agentbond/prd.md
2. Check Ralph status: cd /a0/usr/workdir/agentbond && python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w ./ status
3. Read the implementation plan: cat /a0/usr/workdir/agentbond/.ralph_state/plan.md

## Build Instructions
- Follow the 10-day implementation plan in PRD Section 7
- Use ethskills from /a0/usr/workdir/agentbond-skills/ethskills/ for context
- Delegate to studio agents from /a0/usr/workdir/agentbond-skills/studio-agents/
- Apply interface-craft patterns for UI animations (PRD Section 12)
- Record each iteration with Ralph CLI

## Critical Context Files
- PRD: /a0/usr/workdir/agentbond/prd.md
- ethskills: /a0/usr/workdir/agentbond-skills/ethskills/
- studio-agents: /a0/usr/workdir/agentbond-skills/studio-agents/
- interface-craft: /a0/skills/interface-craft/

## Control Signals
Use RALPH_LOOP:CONTINUE after each iteration until demo is complete.

Start with Day 1 tasks: Clone Scaffold-ETH 2, set up Foundry, create agent package.
```

---

## 📋 DETAILED BUILD INSTRUCTIONS

### 1. Initial Setup Commands

```bash
# Navigate to workspace
cd /a0/usr/workdir/agentbond

# Check current Ralph status
python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w ./ status

# View implementation plan
head -100 .ralph_state/plan.md

# Read full PRD
cat prd.md
```

### 2. Skill Loading Pattern

When you need context from ethskills, load them:

```bash
# Read ERC-8004 standards
cat /a0/usr/workdir/agentbond-skills/ethskills/standards.md

# Read Foundry tools guide
cat /a0/usr/workdir/agentbond-skills/ethskills/tools.md

# Read Celo L2 specifics
cat /a0/usr/workdir/agentbond-skills/ethskills/layer2.md

# Read security patterns
cat /a0/usr/workdir/agentbond-skills/ethskills/security.md

# Read end-to-end dApp guide
cat /a0/usr/workdir/agentbond-skills/ethskills/ship.md
```

### 3. Studio Agent Invocation Pattern

When delegating tasks, use call_subordinate with profile="developer" and include studio agent context:

```json
{
  "tool_name": "call_subordinate",
  "tool_args": {
    "profile": "developer",
    "reset": true,
    "message": "You are the AI Engineer agent for AgentBond. Read your role: $(cat /a0/usr/workdir/agentbond-skills/studio-agents/ai-engineer.md)

    Task: Implement the agent loop with Venice SDK integration.

    Context:
    - Use Venice SDK for private inference
    - Follow Scott Morris pattern from PRD
    - Create packages/agent/src/agent.ts
    - Install: bun add @venice-dev-tools/core viem zod lowdb

    Return: Complete agent.ts with tool definitions for vouch, assessRisk, payment."
  }
}
```

### 4. Studio Agent Roles

| Agent | File | Use For |
|-------|------|--------|
| **ai-engineer** | studio-agents/ai-engineer.md | Agent loop, Venice SDK, tool definitions |
| **backend-architect** | studio-agents/backend-architect.md | Smart contracts, API design, architecture |
| **frontend-developer** | studio-agents/frontend-developer.md | Next.js components, hooks, UI |
| **rapid-prototyper** | studio-agents/rapid-prototyper.md | Quick iterations, demo scenarios |
| **test-writer-fixer** | studio-agents/test-writer-fixer.md | Foundry tests, integration tests |

### 5. Interface-Craft Pattern

For UI animations (PRD Section 12), load the interface-craft skill:

```json
{
  "tool_name": "skills_tool:load",
  "tool_args": {
    "skill_name": "interface-craft"
  }
}
```

Then read storyboard-animation.md:
```bash
cat /a0/skills/interface-craft/storyboard-animation.md
```

Apply the storyboard pattern to:
- TaskExecutionPanel.tsx (Section 12)
- CompletionCelebration.tsx
- AgentCard.tsx

### 6. Ralph Loop Workflow

After completing each iteration:

```bash
# Record progress
python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w ./ record \
  --summary "What was accomplished" \
  --files "file1.ts,file2.sol,file3.json" \
  --passed 5 \
  --failed 0 \
  --signal CONTINUE

# Get next task
python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w ./ next

# Check updated status
python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w ./ status
```

### 7. Day-by-Day Task Breakdown

#### Day 1-2: Foundation
```bash
# Clone Scaffold-ETH 2
git clone https://github.com/scaffold-eth/scaffold-eth-2.git temp-se2
mv temp-se2/* .
rm -rf temp-se2

# Replace Hardhat with Foundry
rm -rf packages/hardhat
mkdir -p packages/contracts
cd packages/contracts && forge init --no-git

# Create agent package
mkdir -p packages/agent/src
cd packages/agent && bun init
bun add @venice-dev-tools/core viem zod lowdb
```

**Delegate to ai-engineer:**
```json
{
  "tool_name": "call_subordinate",
  "tool_args": {
    "profile": "developer",
    "reset": true,
    "message": "ROLE: $(cat /a0/usr/workdir/agentbond-skills/studio-agents/ai-engineer.md)

    TASK: Create packages/agent/src/agent.ts with:
    1. Venice SDK LLM client initialization
    2. Tool interface definitions (vouch, assessRisk, payment, executeTask)
    3. Agent loop with memory persistence (lowdb)
    4. Scott Morris pattern: observe → orient → decide → act

    CONTEXT: Read /a0/usr/workdir/agentbond/prd.md Section 6 for architecture.

    OUTPUT: Complete agent.ts file."
  }
}
```

#### Day 3-4: Smart Contracts

**Delegate to backend-architect:**
```json
{
  "tool_name": "call_subordinate",
  "tool_args": {
    "profile": "developer",
    "reset": true,
    "message": "ROLE: $(cat /a0/usr/workdir/agentbond-skills/studio-agents/backend-architect.md)

    TASK: Create smart contracts in packages/contracts/src/:
    1. AgentRegistry.sol - wraps ERC-8004 IdentityRegistry at 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
    2. ReputationStaking.sol - vouching with CELO collateral
    3. TaskEscrow.sol - x402 payment handling

    CONTEXT:
    - Read /a0/usr/workdir/agentbond-skills/ethskills/standards.md for ERC-8004
    - Read /a0/usr/workdir/agentbond-skills/ethskills/security.md for safety
    - Target: Celo Alfajores testnet

    OUTPUT: Three Solidity files with Foundry tests."
  }
}
```

#### Day 5-6: Agent Tools

**Delegate to ai-engineer:**
```json
{
  "tool_name": "call_subordinate",
  "tool_args": {
    "profile": "developer",
    "reset": false,
    "message": "ROLE: $(cat /a0/usr/workdir/agentbond-skills/studio-agents/ai-engineer.md)

    TASK: Create agent tools in packages/agent/src/tools/:
    1. vouch.ts - contract interaction for vouching
    2. assessRisk.ts - Venice API private risk assessment
    3. payment.ts - x402 protocol payments
    4. executeTask.ts - task execution logic

    CONTEXT: Use viem for contract calls, Venice SDK for private inference.

    OUTPUT: Four tool files with proper error handling."
  }
}
```

#### Day 7-8: Frontend Dashboard

**Delegate to frontend-developer:**
```json
{
  "tool_name": "call_subordinate",
  "tool_args": {
    "profile": "developer",
    "reset": true,
    "message": "ROLE: $(cat /a0/usr/workdir/agentbond-skills/studio-agents/frontend-developer.md)

    TASK: Create Next.js components in packages/nextjs/components/:
    1. AgentCard.tsx - reputation ring, vouch badge
    2. TaskExecutionPanel.tsx - WITH STORYBOARD ANIMATION (PRD Section 12)
    3. CompletionCelebration.tsx - confetti, reputation float
    4. VouchingDrawer.tsx - stake slider, risk assessment

    ANIMATION CONTEXT: Load interface-craft skill and apply storyboard pattern.
    Read: /a0/skills/interface-craft/storyboard-animation.md

    The TaskExecutionPanel MUST show:
    - Stage 1: Research (progress bar)
    - Stage 2: Processing (progress bar)
    - Stage 3: Validation (progress bar)
    - COMPLETE badge with glow animation
    - +Reputation floating numbers

    OUTPUT: Four TSX components following Scaffold-ETH 2 patterns."
  }
}
```

#### Day 9-10: Integration & Demo

**Delegate to rapid-prototyper and test-writer-fixer:**
```json
{
  "tool_name": "call_subordinate",
  "tool_args": {
    "profile": "developer",
    "reset": true,
    "message": "ROLE: $(cat /a0/usr/workdir/agentbond-skills/studio-agents/rapid-prototyper.md)

    TASK: Create demo scenario in packages/nextjs/pages/demo.tsx:
    1. Three agents with different reputations (87, 45, 12)
    2. Vouching flow: Agent 87 vouches for Agent 12
    3. Task execution flow: Agent 12 completes a task
    4. Full celebration animation with confetti

    Follow the 2-minute demo script in PRD Section 12.

    OUTPUT: Complete demo page with all animations working."
  }
}
```

---

## 🔑 Critical Contract Addresses

```
ERC-8004 IdentityRegistry:    0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
ERC-8004 ReputationRegistry:  0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
```

Deployed on: Mainnet, Base, Arbitrum, Optimism, **Celo**, Polygon, and 15+ chains.

---

## 📁 Project Structure Target

```
/a0/usr/workdir/agentbond/
├── packages/
│   ├── contracts/
│   │   ├── src/
│   │   │   ├── AgentRegistry.sol
│   │   │   ├── ReputationStaking.sol
│   │   │   └── TaskEscrow.sol
│   │   ├── test/
│   │   ├── foundry.toml
│   │   └── remappings.txt
│   │
│   ├── nextjs/
│   │   ├── components/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── TaskExecutionPanel.tsx    ← STORYBOARD ANIMATION
│   │   │   ├── CompletionCelebration.tsx  ← STORYBOARD ANIMATION
│   │   │   └── VouchingDrawer.tsx
│   │   ├── hooks/
│   │   └── pages/
│   │
│   └── agent/
│       ├── src/
│       │   ├── agent.ts
│       │   ├── llm.ts (Venice SDK)
│       │   ├── memory.ts (lowdb)
│       │   └── tools/
│       │       ├── vouch.ts
│       │       ├── assessRisk.ts
│       │       ├── payment.ts
│       │       └── executeTask.ts
│       └── package.json
│
├── .ralph_state/
│   ├── loop_state.json
│   ├── goal.md
│   ├── plan.md
│   └── memory/
│
├── prd.md
└── START_BUILD.md (this file)
```

---

## ✅ Success Criteria

- [ ] Agent registration on ERC-8004 IdentityRegistry
- [ ] Vouching with staked collateral
- [ ] Venice API risk assessment (private)
- [ ] Task execution with 3-stage progress visualization
- [ ] Completion celebration with confetti animation
- [ ] x402 payment flow
- [ ] Deployed to Celo Alfajores
- [ ] 2-minute demo video

---

## 🏆 Hackathon Targets

| Track | Prize | Winning Criterion |
|-------|-------|------------------|
| Celo | $10,000 | ERC-8004 reputation score |
| Venice | 2,000 VVV (~$10K) | Private agents, trusted actions |

**Total Potential: ~$20,000**

---

## 🚦 Control Flow

1. **START**: Read PRD, check Ralph status
2. **ITERATE**: Build → Test → Record → Next
3. **SIGNAL**: RALPH_LOOP:CONTINUE after each iteration
4. **COMPLETE**: RALPH_LOOP:COMPLETED when demo ready
5. **BLOCKED**: RALPH_LOOP:BLOCKED if human input needed

---

**NOW BEGIN BUILDING. Start with Day 1 tasks. Signal RALPH_LOOP:CONTINUE after each iteration.**
