# 🚀 AgentBond Ralph Loop Continuation

> **Paste this entire prompt into a fresh Agent Zero chat to continue autonomous building**

---

## Context
You are continuing an autonomous Ralph Loop build for **AgentBond** - a reputation-backed agent lending protocol targeting the Synthesis Hackathon ($20K combined prizes from Celo + Venice tracks).

## Current State
- **Workspace:** `/a0/usr/workdir/agentbond/`
- **Ralph State:** `.ralph_state/` (running, 0 iterations completed)
- **Requirements:** 96 extracted from PRD
- **PRD:** `/a0/usr/workdir/agentbond/prd.md`

## Immediate Actions Required

### 1. Check Ralph Status
```bash
cd /a0/usr/workdir/agentbond && python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w ./ status
```

### 2. Read PRD (CRITICAL - Contains all context)
```bash
cat /a0/usr/workdir/agentbond/prd.md
```

### 3. Get Next Iteration
```bash
cd /a0/usr/workdir/agentbond && python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w ./ next
```

## Key Resources (All paths preserved)

### ETHSKILLS (Read these for context)
```
/a0/usr/workdir/agentbond-skills/ethskills/standards.md  # ERC-8004, x402
/a0/usr/workdir/agentbond-skills/ethskills/tools.md     # Foundry, Scaffold-ETH 2
/a0/usr/workdir/agentbond-skills/ethskills/layer2.md    # Celo L2
/a0/usr/workdir/agentbond-skills/ethskills/security.md  # Solidity security
/a0/usr/workdir/agentbond-skills/ethskills/ship.md      # dApp guide
```

### STUDIO AGENTS (Delegate to these via call_subordinate)
```
/a0/usr/workdir/agentbond-skills/studio-agents/ai-engineer.md
/a0/usr/workdir/agentbond-skills/studio-agents/backend-architect.md
/a0/usr/workdir/agentbond-skills/studio-agents/frontend-developer.md
/a0/usr/workdir/agentbond-skills/studio-agents/rapid-prototyper.md
/a0/usr/workdir/agentbond-skills/studio-agents/test-writer-fixer.md
```

### ERC-8004 Contract Addresses (Production deployed)
```
IdentityRegistry:    0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
ReputationRegistry:  0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
```

## Build Target
```
packages/
├── contracts/          # Foundry (Solidity)
├── nextjs/             # Scaffold-ETH 2 frontend  
└── agent/              # Bun runtime + Venice SDK
```

## Day 1-2 Tasks (Current)
1. Clone Scaffold-ETH 2 to `/a0/usr/workdir/agentbond/`
2. Remove Hardhat, initialize Foundry
3. Create agent package with Bun
4. Install dependencies: Venice SDK, viem, zod, lowdb
5. Implement basic agent loop

## Control Signals
- **RALPH_LOOP:CONTINUE** - More work needed
- **RALPH_LOOP:COMPLETED** - Demo ready
- **RALPH_LOOP:BLOCKED** - Need human input

## Recording Progress
```bash
python /a0/usr/workdir/ralph-harness/scripts/ralph_cli.py -w ./ record \
  --summary "What was done" \
  --files "created_file1.ts,created_file2.sol" \
  --passed 5 --failed 0 \
  --signal CONTINUE
```

## Hackathon Info
- **Participant ID:** 52a0b98ea1204c669ebcb4dbced43e1b
- **Developer:** Tolulope Shekoni (@tolu_evm)
- **Target:** Celo ($10K) + Venice ($10K) tracks
- **Deadline:** 10 days from now

---

## START BUILDING NOW

1. Read the PRD at `/a0/usr/workdir/agentbond/prd.md`
2. Check `.ralph_state/plan.md` for implementation order
3. Begin Day 1 tasks: Clone Scaffold-ETH 2, set up Foundry, create agent package
4. Use studio agents for specialized work
5. Record each iteration with Ralph CLI

**Signal RALPH_LOOP:CONTINUE after each iteration until demo complete.**
