# Product Requirements Document: AgentBond

> "Reputation-backed agent lending protocol - where established AI agents vouch for new agents by staking their ERC-8004 reputation as collateral"

---

## 0. CRITICAL CONTEXT FOR CONTINUATION

> **This section contains all paths and references needed for autonomous building across context windows**

### Project Location
- **Workspace:** `/a0/usr/workdir/agentbond/`
- **Ralph State:** `/a0/usr/workdir/agentbond/.ralph_state/`

### Installed Skills (USE THESE)
```
ETHSKILLS:
- /a0/usr/workdir/agentbond-skills/ethskills/standards.md  (ERC-8004, x402, EIP-7702)
- /a0/usr/workdir/agentbond-skills/ethskills/tools.md     (Foundry, Scaffold-ETH 2, MCP)
- /a0/usr/workdir/agentbond-skills/ethskills/layer2.md    (Celo L2 specifics)
- /a0/usr/workdir/agentbond-skills/ethskills/security.md  (Solidity security)
- /a0/usr/workdir/agentbond-skills/ethskills/ship.md      (End-to-end dApp guide)
- /a0/usr/workdir/agentbond-skills/ethskills/addresses.md (Verified protocol addresses)

STUDIO AGENTS (for delegation via call_subordinate):
- /a0/usr/workdir/agentbond-skills/studio-agents/ai-engineer.md
- /a0/usr/workdir/agentbond-skills/studio-agents/backend-architect.md
- /a0/usr/workdir/agentbond-skills/studio-agents/frontend-developer.md
- /a0/usr/workdir/agentbond-skills/studio-agents/rapid-prototyper.md
- /a0/usr/workdir/agentbond-skills/studio-agents/test-writer-fixer.md
```

### ERC-8004 Contract Addresses (CRITICAL - deployed Jan 29, 2026)
```
IdentityRegistry:    0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
ReputationRegistry:  0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
```
Deployed on: Mainnet, Base, Arbitrum, Optimism, **Celo**, Polygon, Avalanche, and 15+ chains.

### Synthesis Hackathon Registration (COMPLETED)
```
Participant ID: 52a0b98ea1204c669ebcb4dbced43e1b
Email: tas8ka@virginia.edu
Twitter: @tolu_evm
Background: Self-taught developer
```

### Target Tracks
1. **Celo Track:** $10,000 - Judged by ERC-8004 reputation score
2. **Venice Track:** 2,000 VVV (~$10,000) - Private agents, trusted actions

---

## 1. Problem Statement

**What's broken:**
New AI agents face a chicken-egg problem: they can't get hired for tasks without reputation, but they can't build reputation without getting hired. Existing platforms require extensive verification or centralized trust.

**Who feels the pain:**
- New AI agent developers who want their agents to earn money
- Task requesters who want trustworthy agents but can't verify quality
- The broader AI agent ecosystem lacking decentralized trust infrastructure

**Evidence:**
- ERC-8004 standard addresses this exact problem (Jan 2026 deployment)
- No existing protocol connects agent reputation to staking/vouching
- x402 payment protocol enables machine-to-machine commerce

---

## 2. 11-Star Experience

| Stars | Experience Level | Description |
|-------|------------------|-------------|
| 1★ | Broken | Agents cannot be trusted at all |
| 3★ | Functional | Basic reputation scores exist |
| 5★ | Expected | Agents have verifiable onchain reputation |
| 7★ | Surprising | Established agents can vouch for new ones with staked collateral |
| 10★ | Magical | New agents instantly get jobs through vouching, trust is composable |
| 11★ | Transformative | Agent reputation becomes a tradable, composable DeFi primitive |

**The 11-Star Vision:**
A new AI agent can be "lent" reputation by an established agent who stakes their own ERC-8004 reputation score as collateral. If the new agent performs well, both earn reputation. If not, the voucher loses stake. This creates a web of trust where reputation flows from proven agents to newcomers.

**What's Shippable for v1 (10 days):**
- Onchain agent registration via ERC-8004 IdentityRegistry
- Vouching mechanism with staked collateral
- Venice API integration for private risk assessment
- Basic frontend dashboard showing agent reputations
- Demo flow: vouch → assess → execute → pay

---

## 3. Goals and Success Metrics

### Primary Metric
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| ERC-8004 Reputation Score | 0 (new project) | 3+ agents with scores | Onchain registry data |

### Secondary Metrics
- Successful vouching transactions on Celo Alfajores testnet
- Venice API private inference calls for risk assessment
- x402 payment flow completion
- Demo showing full agent lifecycle

### Counter-Metrics
- Gas costs must remain under $1 per vouch transaction
- Risk assessment latency under 5 seconds
- No security vulnerabilities in smart contracts

---

## 4. User Stories

### Must Have (P0)
- [ ] US-001: As an agent developer, I want to register my agent onchain via ERC-8004 so that it has a verifiable identity
- [ ] US-002: As an established agent, I want to vouch for a new agent by staking my reputation so that they can get jobs
- [ ] US-003: As a task requester, I want to see an agent's vouching history so that I can trust new agents
- [ ] US-004: As an agent, I want my risk to be assessed privately via Venice API so that sensitive data isn't exposed

### Should Have (P1)
- [ ] US-005: As a voucher, I want to withdraw my vouch if the agent underperforms so that I'm not liable
- [ ] US-006: As a task requester, I want to pay agents via x402 protocol so that payments are autonomous
- [ ] US-007: As an agent, I want to see my reputation score breakdown so that I understand my standing

### Nice to Have (P2)
- [ ] US-008: As a developer, I want an SDK to integrate AgentBond into my app so that I can use verified agents
- [ ] US-009: As a protocol, I want to earn fees from successful vouches so that the system is sustainable

---

## 5. Functional Requirements

### Critical (Must Have)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| REQ-001 | ERC-8004 Agent Registration | Agent can register with metadata URI, receives unique agentId NFT |
| REQ-002 | Reputation Staking Contract | Voucher can stake CELO tokens to back a new agent |
| REQ-003 | Vouching Mechanism | Established agent (reputation > threshold) can vouch for new agent |
| REQ-004 | Venice Risk Assessment | Private API call returns risk score without exposing agent data |
| REQ-005 | Frontend Dashboard | Display agent cards with reputation, vouching history, risk scores |

### Important (Should Have)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| REQ-006 | x402 Payment Integration | Agents can receive payment via HTTP 402 protocol |
| REQ-007 | Vouch Withdrawal | Voucher can withdraw stake after cooldown period |
| REQ-008 | Reputation Updates | Successful task completion updates both agent and voucher reputation |

### Future (Nice to Have)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| REQ-009 | AgentBond SDK | TypeScript SDK for third-party integration |
| REQ-010 | Fee Mechanism | Protocol takes 1% of successful vouch value |

---

## 6. Technical Architecture

### Stack Decision (FINAL)

```
Framework: Scaffold-ETH 2 (modified) + Foundry + Bun

packages/
├── contracts/          # Foundry (Solidity)
│   ├── src/
│   │   ├── AgentRegistry.sol      # Wraps ERC-8004 IdentityRegistry
│   │   ├── ReputationStaking.sol  # Vouching with staked collateral
│   │   └── TaskEscrow.sol         # x402 payment handling
│   ├── test/
│   ├── foundry.toml
│   └── remappings.txt
│
├── nextjs/             # Scaffold-ETH 2 frontend
│   ├── components/
│   │   ├── AgentCard.tsx
│   │   ├── VouchForm.tsx
│   │   └── RiskScore.tsx
│   └── hooks/           # useScaffoldReadContract, etc.
│
└── agent/              # Bun runtime (NEW)
    ├── src/
    │   ├── agent.ts      # Main agent loop
    │   ├── llm.ts        # Venice SDK integration
    │   ├── memory.ts     # lowdb persistence
    │   └── tools/
    │       ├── vouch.ts
    │       ├── assessRisk.ts
    │       └── payment.ts
    └── package.json
```

### Key Dependencies
```json
{
  "contracts": ["forge-std", "@openzeppelin/contracts"],
  "frontend": ["next", "wagmi", "viem", "@rainbow-me/rainbowkit", "@celo/rainbowkit-celo"],
  "agent": ["@venice-dev-tools/core", "viem", "zod", "lowdb"]
}
```

### Network Configuration
- **Development:** Anvil (local)
- **Testnet:** Celo Alfajores (L2 OP Stack)
- **Mainnet:** Celo Mainnet (L2)

---

## 7. Implementation Plan (10 Days)

### Days 1-2: Foundation
- [ ] Clone Scaffold-ETH 2 to /a0/usr/workdir/agentbond
- [ ] Remove Hardhat package, initialize Foundry
- [ ] Create agent package with Bun
- [ ] Install Venice SDK, viem, zod, lowdb
- [ ] Implement basic agent loop (Scott Morris pattern)

### Days 3-4: Smart Contracts
- [ ] Write AgentRegistry.sol (wrap ERC-8004)
- [ ] Write ReputationStaking.sol (vouching logic)
- [ ] Write TaskEscrow.sol (x402 payments)
- [ ] Deploy to Celo Alfajores testnet
- [ ] Write Foundry tests

### Days 5-6: Agent Tools
- [ ] Build vouch.ts tool (contract interaction)
- [ ] Build assessRisk.ts tool (Venice API)
- [ ] Build payment.ts tool (x402 protocol)
- [ ] Build executeTask.ts tool
- [ ] Test agent loop with real tools

### Days 7-8: Frontend Dashboard
- [ ] Set up RainbowKit + Celo
- [ ] Build AgentCard component
- [ ] Build VouchForm component
- [ ] Build RiskScore visualization
- [ ] Connect to deployed contracts

### Days 9-10: Integration & Demo
- [ ] End-to-end testing
- [ ] Create demo scenarios (3 agents with different reputations)
- [ ] Polish UI/UX
- [ ] Record demo video
- [ ] Submit to hackathon

---

## 8. Studio Agent Delegation Strategy

When building, delegate to these specialized agents:

| Agent | When to Invoke | Task Type |
|-------|----------------|-----------|
| **ai-engineer** | Days 1-3 | Agent loop, Venice SDK, tool definitions |
| **backend-architect** | Days 2-4 | Smart contract architecture, API design |
| **frontend-developer** | Days 5-8 | Next.js dashboard, components, hooks |
| **rapid-prototyper** | Days 1-10 | Quick iterations, demo scenarios |
| **test-writer-fixer** | Days 6-9 | Foundry tests, integration tests |

**Invocation Pattern:**
```
call_subordinate with profile="developer" and message containing:
- Role description from studio-agents/<agent>.md
- Specific task from implementation plan
- Context from ethskills/<relevant-skill>.md
```

---

## 9. Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| Venice API rate limits? | ai-engineer | Day 2 | Check docs, implement caching |
| Minimum stake amount? | backend-architect | Day 3 | 1 CELO minimum for demo |
| Vouch cooldown period? | backend-architect | Day 3 | 7 days for security |
| Frontend hosting? | rapid-prototyper | Day 8 | Vercel for demo |

---

## 10. Success Criteria for Hackathon

### Celo Track Requirements ✅
- ERC-8004 identity standard implementation
- Onchain reputation scoring
- Celo L2 deployment
- x402 payment integration (bonus)

### Venice Track Requirements ✅
- Venice API integration for private inference
- Agent-first design
- Privacy-preserving features
- Uncensored AI capability

### Demo Requirements
- [ ] 3+ agents with different reputation scores
- [ ] Live vouching transaction on testnet
- [ ] Venice risk assessment call
- [ ] Payment flow demonstration
- [ ] 2-minute video walkthrough

---

## 11. Ralph Loop Instructions

When continuing this build in a fresh context:

1. **Read this PRD first** - All context is here
2. **Check .ralph_state/progress.md** - See what's done
3. **Read relevant ethskills** - Use paths from Section 0
4. **Invoke studio agents** - Use patterns from Section 8
5. **Follow implementation plan** - Section 7 timeline
6. **Update progress.md** - After each iteration
7. **Use signal RALPH_LOOP:CONTINUE** - Until demo complete

**Key Files to Create/Update:**
- `/a0/usr/workdir/agentbond/packages/contracts/src/*.sol`
- `/a0/usr/workdir/agentbond/packages/agent/src/*.ts`
- `/a0/usr/workdir/agentbond/packages/nextjs/components/*.tsx`
- `/a0/usr/workdir/agentbond/.ralph_state/progress.md`

---

*Generated for Synthesis Hackathon 2026 | Team: Tolulope Shekoni + Agent Zero*

---

## 12. UI/UX Demo Flow Specification

> **Critical Addition**: Complete end-to-end visual demo showing task execution, not just vouching

### Demo Flow Overview

The demo must visually demonstrate the complete agent lifecycle:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENTBOND DEMO FLOW (2 minutes)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] SPLASH         →  "AgentBond" logo animates in                         │
│  [2] MARKETPLACE    →  Grid of agents with reputation cards                 │
│  [3] VOUCHING       →  Established agent vouches for new agent               │
│  [4] TASK POST      →  User posts a task with requirements                  │
│  [5] TASK MATCH     →  Agent accepts task (risk assessment runs)            │
│  [6] EXECUTION      →  ⭐ LIVE agent executes task with stages               │
│  [7] COMPLETION     →  Task marked complete, reputation updates              │
│  [8] PAYMENT        →  x402 payment flows, both parties rewarded             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### New Components Required

#### TaskExecutionPanel.tsx

The core visual component showing live task execution:

```tsx
/* ─────────────────────────────────────────────────────────
 * TASK EXECUTION STORYBOARD
 *
 *    0ms   panel slides in from right
 *  300ms   task header appears (title, reward)
 *  600ms   agent avatar pulses, "Working..." shows
 *  900ms   stage 1: Research (icon + progress bar)
 * 1500ms   stage 1 completes (checkmark, green flash)
 * 1800ms   stage 2: Processing (icon + progress bar)
 * 2400ms   stage 2 completes (checkmark, green flash)
 * 2700ms   stage 3: Validation (icon + progress bar)
 * 3300ms   stage 3 completes (checkmark, green flash)
 * 3600ms   "COMPLETE" badge animates in (scale + glow)
 * 4000ms   reputation scores update (+numbers float up)
 * 4500ms   payment confirmation shows
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  panelSlide:      300,   // panel slides in
  headerAppear:    600,   // task header shows
  agentPulse:      900,   // agent starts working
  stage1Start:     900,   // Research stage begins
  stage1Complete:  1500,  // Research done
  stage2Start:     1800,  // Processing begins
  stage2Complete:  2400,  // Processing done
  stage3Start:     2700,  // Validation begins
  stage3Complete:  3300,  // Validation done
  completeBadge:   3600,  // COMPLETE badge
  reputationUpdate: 4000, // scores update
  paymentShow:     4500,  // payment confirmation
};

/* Panel container */
const PANEL = {
  slideFrom:      100,   // px from right
  spring: { type: "spring" as const, stiffness: 300, damping: 30 },
};

/* Task header */
const HEADER = {
  rewardColor: "#10B981",  // green-500
  avatarSize:  48,         // px
};

/* Execution stages */
const STAGES = {
  stagger:      0.3,   // seconds between stages
  barHeight:    8,     // px
  checkScale:   1.2,   // checkmark pop scale
  completeGlow: "#22C55E",  // green-400 glow
  items: [
    { id: "research",    icon: "🔍", label: "Research",    duration: 600 },
    { id: "processing",  icon: "⚡", label: "Processing",  duration: 600 },
    { id: "validation",  icon: "✓",  label: "Validation",  duration: 600 },
  ],
};

/* Completion badge */
const COMPLETE = {
  scale:       1.5,   // pop-in scale
  glowRadius:  20,    // px shadow spread
  spring: { type: "spring" as const, stiffness: 500, damping: 20 },
};

/* Reputation update */
const REPUTATION = {
  floatDistance: -40,  // px upward
  fontSize:       24,  // px
  color:          "#10B981",
};
```

#### TaskCard.tsx

Visual card for posted tasks in marketplace:

```tsx
/* ─────────────────────────────────────────────────────────
 * TASK CARD STORYBOARD
 *
 *    0ms   card invisible, waiting
 *  200ms   card fades in, slides up 20px
 *  500ms   reward badge pulses once
 *  800ms   "Accept Task" button enables
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  cardAppear:   200,   // card fades in
  rewardPulse:  500,   // reward badge pulses
  buttonEnable: 800,   // button becomes active
};

const CARD = {
  offsetY:       20,    // px slide up
  rewardBg:      "#F59E0B",  // amber-500
  borderColor:   "#374151",  // gray-700
  spring: { type: "spring" as const, stiffness: 350, damping: 28 },
};
```

#### CompletionCelebration.tsx

Lottie-style celebration animation:

```tsx
/* ─────────────────────────────────────────────────────────
 * COMPLETION CELEBRATION STORYBOARD
 *
 *    0ms   trigger (task complete)
 *  100ms   confetti particles spawn (20 particles)
 *  300ms   "TASK COMPLETE" text scales in
 *  500ms   reputation +5 floats up
 *  700ms   earnings amount floats up
 * 1000ms   "View Transaction" button fades in
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  confettiStart:   100,   // particles begin
  textScaleIn:     300,   // "COMPLETE" appears
  reputationFloat: 500,   // +5 rep floats
  earningsFloat:   700,   // $X.XX floats
  buttonAppear:    1000,  // CTA shows
};

const CELEBRATION = {
  particleCount:   20,
  particleColors: ["#10B981", "#3B82F6", "#F59E0B", "#EC4899"],
  floatDistance:   -60,   // px upward
  spring: { type: "spring" as const, stiffness: 400, damping: 25 },
};
```

### Complete Demo Page Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER: AgentBond Logo | Connect Wallet | Network: Celo Alfajores     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │                                 │  │                             │  │
│  │   AGENT MARKETPLACE             │  │   TASK EXECUTION PANEL      │  │
│  │   ─────────────────             │  │   ─────────────────────     │  │
│  │                                 │  │                             │  │
│  │   ┌─────┐ ┌─────┐ ┌─────┐      │  │   Task: "Analyze this       │  │
│  │   │ 🤖  │ │ 🤖  │ │ 🤖  │      │  │   contract for security     │  │
│  │   │Rep: │ │Rep: │ │Rep: │      │  │   vulnerabilities"          │  │
│  │   │ 87  │ │ 45  │ │ 12  │      │  │                             │  │
│  │   │ ⭐  │ │ ⭐  │ │NEW! │      │  │   Agent: security-bot-007   │  │
│  │   └─────┘ └─────┘ └─────┘      │  │   Status: ████████░░ 80%    │  │
│  │                                 │  │                             │  │
│  │   ┌─────────────────────────┐   │  │   ┌─────────────────────┐   │  │
│  │   │  POST NEW TASK          │   │  │   │ 🔍 Research    ✓    │   │  │
│  │   │  Title: [___________]   │   │  │   │ ⚡ Processing  ▓▓▓  │   │  │
│  │   │  Reward: [_____] CELO   │   │  │   │ ✓ Validation       │   │  │
│  │   │  [POST TASK]            │   │  │   └─────────────────────┘   │  │
│  │   └─────────────────────────┘   │  │                             │  │
│  │                                 │  │   ┌─────────────────────┐   │  │
│  │                                 │  │   │   ✨ COMPLETE ✨     │   │  │
│  │                                 │  │   │   +5 Reputation     │   │  │
│  │                                 │  │   │   Earned: 5 CELO    │   │  │
│  │                                 │  │   └─────────────────────┘   │  │
│  └─────────────────────────────────┘  └─────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  VOUCHING PANEL (bottom drawer - expands when clicked)          │   │
│  │  ───────────────────────────────────────────────────────────   │   │
│  │  [Vouch for Agent] | Stake: [5] CELO | [CONFIRM VOUCH]          │   │
│  │  Risk Assessment: 23% (via Venice API - private)                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Animation Implementation Order

| Priority | Component | Purpose |
|----------|-----------|---------|
| P0 | TaskExecutionPanel | Core demo - shows agent working |
| P0 | CompletionCelebration | Visual payoff - task complete |
| P1 | TaskCard | Marketplace task display |
| P1 | AgentCard | Enhanced with vouching status |
| P2 | VouchingDrawer | Bottom drawer for vouch actions |
| P2 | ReputationUpdate | Floating +numbers animation |

### Demo Script (2 minutes)

```
0:00  - Splash screen: "AgentBond" animates in
0:05  - Fade to marketplace grid showing 3 agents
0:10  - Click on new agent (rep: 12, "NEW!" badge)
0:15  - Vouching drawer expands
0:20  - Established agent (rep: 87) vouches with 5 CELO stake
0:25  - Venice risk assessment runs (private spinner)
0:30  - Risk: 23% - vouch confirmed, new agent rep becomes 15
0:35  - User posts task: "Analyze contract" - 5 CELO reward
0:40  - New agent accepts task (matched by reputation)
0:45  - TaskExecutionPanel slides in
0:50  - Stage 1: Research (progress bar animates)
0:55  - Stage 1 complete (checkmark, green flash)
1:00  - Stage 2: Processing (progress bar)
1:05  - Stage 2 complete
1:10  - Stage 3: Validation (progress bar)
1:15  - Stage 3 complete
1:20  - COMPLETE badge pops in with glow
1:25  - Confetti particles spawn
1:30  - Reputation +5 floats up for agent
1:35  - Reputation +2 floats up for voucher
1:40  - Payment confirmation: 5 CELO transferred
1:45  - Transaction hash shown (clickable)
1:50  - "AgentBond: Reputation-backed agent lending"
2:00  - End
```

### Key Visual States

```
Agent States:
- IDLE:       Gray ring, static avatar
- VOUCHING:   Blue pulse, stake amount shown
- WORKING:    Green ring animated, "Working..." text
- COMPLETE:   Gold ring, +rep floating
- FAILED:     Red ring, slash icon

Task States:
- OPEN:       Blue badge, "Accept Task" enabled
- ASSIGNED:   Yellow badge, assigned agent shown
- IN_PROGRESS: Green badge, progress bar active
- COMPLETE:   Gold badge, checkmark
- DISPUTED:   Red badge, warning icon
```

---

## 13. Updated User Stories (with UI/UX)

### Must Have (P0) - Enhanced
- [ ] US-001: As an agent developer, I want to register my agent onchain via ERC-8004 so that it has a verifiable identity → **Visual: AgentCard with NFT badge**
- [ ] US-002: As an established agent, I want to vouch for a new agent by staking my reputation so that they can get jobs → **Visual: VouchingDrawer with stake slider**
- [ ] US-003: As a task requester, I want to see an agent's vouching history so that I can trust new agents → **Visual: VouchHistory timeline in AgentCard**
- [ ] US-004: As an agent, I want my risk to be assessed privately via Venice API so that sensitive data isn't exposed → **Visual: Private spinner, "Assessing..." with lock icon**
- [ ] **US-010: As a user, I want to SEE an agent executing my task in real-time** → **Visual: TaskExecutionPanel with stages and progress**
- [ ] **US-011: As a user, I want to SEE when my task is complete with celebration** → **Visual: CompletionCelebration with confetti and reputation update**

---

## 14. Frontend Component Tree

```
App
├── Header
│   ├── Logo (animated)
│   ├── ConnectWallet (RainbowKit)
│   └── NetworkSelector
│
├── MarketplacePage
│   ├── AgentGrid
│   │   └── AgentCard[] (with storyboard animation)
│   │       ├── Avatar (reputation ring)
│   │       ├── ReputationScore
│   │       ├── VouchBadge (if vouched)
│   │       └── ActionButton
│   │
│   └── TaskPostForm
│       ├── TitleInput
│       ├── RewardInput
│       └── SubmitButton
│
├── TaskExecutionPanel (slide-in from right)
│   ├── TaskHeader (title, reward)
│   ├── AgentStatus (avatar, "Working...")
│   ├── ExecutionStages (STAGES.items.map)
│   │   └── StageRow
│   │       ├── Icon
│   │       ├── Label
│   │       ├── ProgressBar
│   │       └── Checkmark
│   └── CompletionCelebration
│       ├── Confetti
│       ├── CompleteBadge
│       ├── ReputationFloat
│       └── PaymentConfirm
│
└── VouchingDrawer (bottom drawer)
    ├── AgentSelector
    ├── StakeSlider
    ├── RiskAssessment (Venice)
    └── ConfirmButton
```

---

*UI/UX Section Added: March 14, 2026*
*Interface-Craft Storyboard Pattern Applied*
