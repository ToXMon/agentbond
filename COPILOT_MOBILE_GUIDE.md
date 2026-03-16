# 📱 AgentBond GitHub Copilot Mobile Workflow

> **Dummy-proof guide for orchestrating AgentBond builds from your phone**

---

## 🎯 How This Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   LINEAR    │────▶│   GITHUB    │────▶│  GITHUB COPILOT │
│  (on mobile)│     │    PR       │     │  (executes code)│
└─────────────┘     └─────────────┘     └─────────────────┘
       │                   │                     │
       ▼                   ▼                     ▼
   Create Issue      Creates Branch        Implements
   Assigns @copilot   Opens Draft PR        Changes
```

---

## 📲 STEP 1: Create Issue in Linear (Mobile)

### Option A: Linear Mobile App
1. Open **Linear** app on your phone
2. Tap **+** (bottom right) → **New Issue**
3. Fill in:
   - **Title:** Clear task description (e.g., "Add wallet connection to AgentCard")
   - **Description:** Detailed requirements
   - **Project:** AgentBond
   - **Assignee:** @copilot (if available) or yourself
4. Tap **Create Issue**

### Option B: Linear Web (mobile browser)
1. Go to https://linear.app in your mobile browser
2. Navigate to AgentBond project
3. Create issue with detailed description

---

## 🔄 STEP 2: Linear Auto-Creates GitHub PR

Since Linear is connected to your GitHub:

1. **Issue created in Linear** → Automatically creates branch in GitHub
2. **Branch naming:** `linear/[issue-id]-[short-title]`
3. **Draft PR created** with issue linked

---

## 🤖 STEP 3: Trigger GitHub Copilot (THE KEY STEP!)

### 📱 From GitHub Mobile App:

1. Open **GitHub** mobile app
2. Go to: **Repositories** → **ToXMon/agentbond**
3. Tap **Pull Requests** tab
4. Find the PR created by Linear (search by issue ID)
5. **Open the PR** → Scroll to the conversation
6. **Add a comment** to trigger Copilot:

   
   Type this EXACT comment:
   ```
   @github-copilot implement this feature following the AgentBond codebase patterns
   ```

7. **Tap Comment** → Copilot will start working!

### 🌐 From Mobile Browser (alternative):

1. Go to: https://github.com/ToXMon/agentbond/pulls
2. Find your PR → Open it
3. Scroll to **Add a comment**
4. Type: `@github-copilot implement this feature`
5. Click **Comment**

---

## ⚡ Copilot Trigger Commands

| Command | What It Does |
|---------|-------------|
| `@github-copilot implement this` | Full implementation |
| `@github-copilot review this code` | Code review suggestions |
| `@github-copilot add tests` | Generate test cases |
| `@github-copilot fix the bug` | Bug fixing |
| `@github-copilot refactor` | Code refactoring |
| `@github-copilot document this` | Add documentation |

---

## 📋 STEP 4: Monitor Progress (Mobile)

### From GitHub Mobile App:
1. Open PR → **Checks** tab
2. See Copilot's commits being added
3. Review the **Files changed** tab
4. Merge when ready!

### From Linear Mobile App:
1. Open the issue
2. See linked PR status
3. Status updates automatically when PR is ready

---

## 🎬 Complete Mobile Workflow Example

```
1. 📱 Open Linear app
2. ➕ Create Issue: "Add reputation score display to AgentCard component"
3. ✅ Issue created → WIJ-15
4. ⏳ Wait 30 seconds (Linear creates GitHub branch)
5. 📱 Open GitHub app
6. 🔍 Go to ToXMon/agentbond → Pull Requests
7. 📄 Find PR for WIJ-15 → Open it
8. 💬 Comment: "@github-copilot implement this feature using existing AgentCard.tsx patterns"
9. ☕ Wait for Copilot to generate code
10. ✅ Review changes in "Files changed" tab
11. 🎉 Merge when satisfied!
```

---

## ⚠️ IMPORTANT NOTES

1. **Copilot needs context:** Always reference existing files in your comment
   - ✅ Good: `@github-copilot implement this using the pattern in AgentCard.tsx`
   - ❌ Bad: `@github-copilot fix this`

2. **Be specific about requirements:** Copilot follows instructions literally
   - Include acceptance criteria in the issue
   - Mention specific files to modify
   - Reference existing patterns to follow

3. **Review before merging:** Always check Copilot's changes
   - Copilot can make mistakes
   - Test the changes locally if possible
   - Use "Request changes" if needed

4. **Iterate with comments:** You can guide Copilot with follow-up comments
   - `@github-copilot make the button blue instead of red`
   - `@github-copilot add error handling`

---

## 📁 Project Structure Reference

When writing Copilot comments, reference these key files:

| Area | Key Files |
|------|-----------|
| **Frontend** | `packages/nextjs/components/AgentCard.tsx` |
| **Backend** | `packages/backend/src/routes/tasks.ts` |
| **Agent** | `packages/agent/src/tools/vouch.ts` |
| **Contracts** | `packages/contracts/src/AgentRegistry.sol` |
| **API** | `packages/nextjs/lib/api.ts` |

---

## 🔧 Troubleshooting

### Copilot not responding?
1. Check if GitHub Copilot is enabled on the repo
2. Ensure you have Copilot subscription active
3. Try: `@github-copilot help` to test

### Linear not creating PR?
1. Check Linear → Settings → GitHub integration
2. Ensure "Auto-create branch" is enabled
3. Manual backup: Create branch manually in GitHub

### Need more help?
- GitHub Copilot docs: https://docs.github.com/copilot
- Linear + GitHub: https://linear.app/docs/github
