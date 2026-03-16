---
tracker:
  kind: linear
  project_slug: "agentbond"
  active_states:
    - Todo
    - In Progress
    - In Review
  terminal_states:
    - Done
    - Closed
    - Cancelled

polling:
  interval_ms: 30000

workspace:
  root: ~/agentbond-workspaces

hooks:
  after_create: |
    git clone https://github.com/ToXMon/agentbond.git .
    npm install

copilot:
  trigger: "@copilot"
  auto_assign: true
  max_turns: 20
  approval_policy: suggest
---

# AgentBond GitHub Copilot Workflow

You are working on Linear issue `{{ issue.identifier }}`

## Issue Context
- **Identifier:** {{ issue.identifier }}
- **Title:** {{ issue.title }}
- **Status:** {{ issue.state }}
- **URL:** {{ issue.url }}

## Instructions

1. Read the issue description carefully
2. Create a feature branch: `copilot/{{ issue.identifier }}-<short-description>`
3. Implement the required changes
4. Create a PR with reference to the Linear issue
5. Update Linear with progress comments

## Code Standards

- Follow existing code patterns
- Write tests for new functionality
- Update documentation as needed
- Keep commits atomic and descriptive

## Acceptance Criteria

- [ ] Code compiles without errors
- [ ] Tests pass
- [ ] PR linked to Linear issue
- [ ] Documentation updated
