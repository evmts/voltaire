---
allowed-tools: Bash(zig build:*), Bash(zig build test:*), Bash(bun run test:*), Bash(bun run build:*), Bash(bun typecheck:*), Bash(git:*), Bash(gh:*), Read, Edit, Write, Glob, Grep, Task, TodoWrite
argument-hint: <issue-number-or-url>
description: Fix GitHub issue with TDD validation, architecture review, and comprehensive reporting
model: claude-sonnet-4-20250514
---

# Fix Issue Command

<mission>
Fix a GitHub issue following a rigorous, evidence-based methodology that guarantees:
1. Repository starts in a healthy state (or we abort)
2. Architecture is understood before changes
3. Changes are validated with comprehensive tests
4. No regressions are introduced
5. Documentation is updated
6. Complete audit trail is created
</mission>

<critical_constraints>
- NEVER proceed if repo is broken at start
- NEVER skip validation steps
- NEVER mark complete without passing tests
- NEVER close issue without commit linking to it
- ALWAYS update architecture docs if implementation changes patterns
- ALWAYS create report in docs/reports/
</critical_constraints>

## Phase 0: Parse Input

Extract issue information from `$ARGUMENTS`:

```xml
<input_parsing>
  <accepted_formats>
    - Issue number: "123", "#123"
    - Full URL: "https://github.com/evmts/voltaire/issues/123"
    - Short URL: "evmts/voltaire#123"
  </accepted_formats>

  <extract>
    - issue_number: The numeric issue ID
    - repository: Default to "evmts/voltaire" if not specified
  </extract>
</input_parsing>
```

If no valid issue identifier found, ASK the user for the issue number.

---

## Phase 1: Repository Health Check

<health_check priority="BLOCKING">
Before ANY work begins, verify repository is in a healthy state.

### Step 1.1: Check Git Status
```bash
git status --porcelain
```
- If uncommitted changes exist, WARN user but continue
- Record current HEAD commit for rollback reference

### Step 1.2: Run Build
```bash
zig build 2>&1
```
<success_criteria>Exit code 0, no errors</success_criteria>

### Step 1.3: Run Tests
```bash
zig build test 2>&1
```
<success_criteria>All tests pass</success_criteria>

### Step 1.4: Run TypeScript Checks
```bash
bun run test:run 2>&1
```
<success_criteria>All tests pass</success_criteria>

<on_failure>
If ANY health check fails:

1. **DO NOT PROCEED** with the fix
2. Create a HIGH PRIORITY issue documenting the broken state:
```bash
gh issue create \
  --title "🚨 CRITICAL: Repository in broken state - [describe failure]" \
  --body "$(cat <<'EOF'
## Broken State Detected

**Detected while attempting to fix:** #[original_issue_number]

### Failure Details
- **Phase:** [Build/Test/TypeScript]
- **Command:** [failed command]
- **Error Output:**
\`\`\`
[error output]
\`\`\`

### Impact
Cannot proceed with any development work until this is resolved.

### Priority
🔴 **CRITICAL** - Blocks all development

---
_Note: Claude AI assistant, not @roninjin10 or @fucory_
EOF
)" \
  --label "critical,bug,blocks-development"
```

3. Report to user:
```
❌ ABORTING: Repository is in broken state

Created issue #[new_issue_number] to track the broken state.

The following must be fixed before proceeding:
[summary of failures]

Original issue #[original_issue_number] cannot be addressed until repo is healthy.
```

4. **STOP EXECUTION COMPLETELY**
</on_failure>
</health_check>

---

## Phase 2: Issue Analysis

<issue_analysis>
### Step 2.1: Fetch Issue Details
```bash
gh issue view [issue_number] --json title,body,labels,assignees,comments
```

### Step 2.2: Extract Key Information
Parse the issue to understand:

```xml
<issue_understanding>
  <title>The issue title</title>
  <type>bug | feature | refactor | docs | performance</type>
  <affected_areas>
    - List of modules/files likely affected
    - primitives/*, crypto/*, precompiles/*, docs/*
  </affected_areas>
  <acceptance_criteria>
    - What must be true for this to be considered fixed?
    - Extract from issue body or infer from description
  </acceptance_criteria>
  <reproduction_steps>
    - If bug: steps to reproduce
    - If feature: expected behavior description
  </reproduction_steps>
</issue_understanding>
```

### Step 2.3: Read Architecture Documentation

**MANDATORY**: Read these files before making any changes:

```xml
<architecture_review>
  <required_reading>
    - docs/dev/architecture.mdx (overall structure)
    - docs/dev/typescript-patterns.mdx (TS conventions)
    - docs/dev/zig-patterns.mdx (Zig conventions)
    - docs/dev/testing.mdx (testing patterns)
  </required_reading>

  <conditional_reading issue_type="[type]">
    <if type="primitives">docs/dev/adding-primitives.mdx</if>
    <if type="crypto">docs/dev/adding-crypto.mdx</if>
    <if type="wasm">docs/dev/wasm.mdx</if>
    <if type="multi-language">docs/dev/multi-language.mdx</if>
    <if type="security">docs/dev/security.mdx</if>
  </conditional_reading>
</architecture_review>
```

### Step 2.4: Locate Relevant Code

Use search to find affected code:

```xml
<code_discovery>
  <search_strategy>
    1. Glob for files matching issue keywords
    2. Grep for function/type names mentioned in issue
    3. Read identified files to understand current implementation
    4. Map dependencies between affected modules
  </search_strategy>

  <document>
    - Files to modify
    - Files that depend on modifications (ripple effects)
    - Test files that need updates
    - Documentation files that need updates
  </document>
</code_discovery>
```
</issue_analysis>

---

## Phase 3: Test-First Implementation

<tdd_implementation>
### Step 3.1: Write Failing Tests FIRST

**BEFORE writing any fix code**, create tests that:

```xml
<test_requirements>
  <bug_fix>
    - Test that reproduces the bug (should FAIL initially)
    - Test edge cases around the bug
    - Test that the bug doesn't regress
  </bug_fix>

  <feature>
    - Test the happy path
    - Test error conditions
    - Test edge cases
    - Test integration with existing code
  </feature>

  <test_locations>
    - Zig: Inline tests in affected .zig files
    - TypeScript: Separate *.test.ts files
    - Integration: If cross-language, both
  </test_locations>
</test_requirements>
```

### Step 3.2: Verify Tests Fail
```bash
zig build test 2>&1 | grep -E "(FAIL|error)"
bun run test:run 2>&1 | grep -E "(FAIL|✗)"
```

<validation>Tests MUST fail before proceeding. If they pass, tests don't cover the issue.</validation>

### Step 3.3: Implement the Fix

Now implement the minimal fix that makes tests pass:

```xml
<implementation_principles>
  <do>
    - Make smallest change that fixes the issue
    - Follow existing patterns in architecture docs
    - Add inline comments only for non-obvious logic
    - Use existing validation/utility functions
  </do>

  <do_not>
    - Refactor unrelated code
    - Add features not in the issue
    - Change APIs without explicit request
    - Skip tests for "simple" changes
  </do_not>
</implementation_principles>
```

### Step 3.4: Verify Tests Pass
```bash
zig build test
bun run test:run
```

<validation>ALL tests must pass, including new ones</validation>

### Step 3.5: Run Full Validation Suite
```bash
zig build               # Full build
zig build check         # Format + lint + typecheck
bun run test:run        # All TS tests
```

<validation>Zero failures allowed</validation>
</tdd_implementation>

---

## Phase 4: Regression Prevention

<regression_check>
### Step 4.1: Compare Test Counts

```bash
# Before (from Phase 1)
TESTS_BEFORE=$(zig build test 2>&1 | grep -c "passed")

# After
TESTS_AFTER=$(zig build test 2>&1 | grep -c "passed")
```

<validation>TESTS_AFTER >= TESTS_BEFORE (tests should only increase)</validation>

### Step 4.2: Verify No Existing Tests Removed/Modified to Pass

```bash
git diff --stat | grep "test"
```

Review any test file changes:
- New tests: ✅ Good
- Modified tests to fix actual bugs in tests: ✅ Acceptable (document why)
- Removed/commented tests: ❌ FORBIDDEN
- Modified assertions to make failing tests pass: ❌ FORBIDDEN

### Step 4.3: Cross-Validate with Reference Implementations

For crypto/primitives, if applicable:
```typescript
// Verify against noble-curves, ethers, viem
import { keccak256 } from '@noble/hashes/sha3';
// Compare outputs
```
</regression_check>

---

## Phase 5: Documentation Updates

<documentation_updates>
### Step 5.1: Check if Architecture Docs Need Updates

If the fix:
- Introduces new patterns → Update docs/dev/*.mdx
- Changes existing patterns → Update docs/dev/*.mdx
- Adds new modules → Update docs/dev/codebase-map.mdx
- Changes exports → Update docs/dev/exports.mdx

### Step 5.2: Update API Documentation

If public API changed:
- Update relevant docs/primitives/*.mdx
- Update relevant docs/crypto/*.mdx
- Update docs/docs.json navigation if new pages

### Step 5.3: Create Implementation Report

Create `docs/reports/issue-[number].md`:

```markdown
---
title: "Issue #[number]: [title]"
date: [YYYY-MM-DD]
issue: https://github.com/evmts/voltaire/issues/[number]
commit: [commit-sha]
---

# Issue #[number]: [title]

## Summary
[1-2 sentence description of what was fixed]

## Problem
[Description of the issue]

## Solution
[Technical description of the fix]

## Files Changed
- `path/to/file.ts` - [what changed]
- `path/to/file.zig` - [what changed]

## Tests Added
- `path/to/test.ts` - [what is tested]
- `path/to/test.zig` - [what is tested]

## Validation
- [ ] Build passes
- [ ] All existing tests pass
- [ ] New tests pass
- [ ] No regressions detected
- [ ] Documentation updated

## Architecture Impact
[None / Description of any pattern changes]

---
_Generated by Claude Code fix-issue command_
```
</documentation_updates>

---

## Phase 6: Commit and Close

<finalization>
### Step 6.1: Stage Changes
```bash
git add -A
git status
```

Review staged files match expectations.

### Step 6.2: Create Commit

```bash
git commit -m "$(cat <<'EOF'
🐛 fix(module): Brief description of fix

Fixes #[issue_number]

## Changes
- [change 1]
- [change 2]

## Tests
- Added test for [scenario]
- Added test for [edge case]

## Validation
- All tests pass
- No regressions

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Use appropriate emoji prefix:
- 🐛 fix: Bug fixes
- 🎉 feat: New features
- ♻️ refactor: Code refactoring
- 📚 docs: Documentation only
- ✅ test: Test additions
- ⚡ perf: Performance improvements

### Step 6.3: Comment on Issue

```bash
gh issue comment [issue_number] --body "$(cat <<'EOF'
## Fixed in [commit_sha]

### Summary
[Brief description of the fix]

### Changes Made
- [change 1]
- [change 2]

### Tests Added
- [test 1]
- [test 2]

### Validation
✅ Build passes
✅ All tests pass (X total)
✅ No regressions

### Report
See [docs/reports/issue-[number].md](link) for full details.

---
_Note: Claude AI assistant, not @roninjin10 or @fucory_
EOF
)"
```

### Step 6.4: Close Issue

```bash
gh issue close [issue_number] --comment "Closed via commit [commit_sha]"
```
</finalization>

---

## Phase 7: Final Report

<final_report>
Output to user:

```
✅ Issue #[number] Fixed Successfully

## Summary
[title]
[1-2 sentence description]

## Commit
[commit_sha]

## Changes
- [file1]: [brief description]
- [file2]: [brief description]

## Tests
- Added X new tests
- All Y tests passing

## Documentation
- Report: docs/reports/issue-[number].md
- Architecture updates: [none / list]

## Issue Status
- Commented: ✅
- Closed: ✅

## Verification Commands
\`\`\`bash
zig build test              # Verify Zig tests
bun run test:run            # Verify TS tests
gh issue view [number]      # View closed issue
\`\`\`
```
</final_report>

---

## Error Recovery

<error_recovery>
If ANY phase fails after Phase 1:

### On Implementation Failure
1. Do NOT commit broken code
2. Report what went wrong
3. Leave issue open with comment explaining blocker

### On Test Failure
1. Do NOT disable or modify tests to pass
2. Identify root cause
3. Either fix implementation or report why tests are wrong

### On Commit Failure
1. Check git status
2. Resolve any conflicts
3. Retry commit

### On GitHub API Failure
1. Report the failure
2. Provide manual commands for user to run
3. Note that issue may need manual closing
</error_recovery>

---

## Execution Checklist

Use TodoWrite to track progress through these phases:

```
[ ] Phase 0: Parse issue input
[ ] Phase 1: Repository health check
  [ ] Git status clean
  [ ] Build passes
  [ ] Zig tests pass
  [ ] TS tests pass
[ ] Phase 2: Issue analysis
  [ ] Fetch issue details
  [ ] Read architecture docs
  [ ] Locate affected code
[ ] Phase 3: TDD implementation
  [ ] Write failing tests
  [ ] Verify tests fail
  [ ] Implement fix
  [ ] Verify tests pass
  [ ] Full validation suite
[ ] Phase 4: Regression prevention
  [ ] Test count >= before
  [ ] No tests removed/disabled
  [ ] Cross-validation (if applicable)
[ ] Phase 5: Documentation
  [ ] Architecture docs updated (if needed)
  [ ] API docs updated (if needed)
  [ ] Report created
[ ] Phase 6: Commit and close
  [ ] Changes committed
  [ ] Issue commented
  [ ] Issue closed
[ ] Phase 7: Final report to user
```

---

## Available Utilities (src/utils/)

When implementing fixes, these utilities may be useful:

```typescript
import {
  retryWithBackoff, withRetry,           // Exponential backoff retry
  poll, pollForReceipt, pollWithBackoff, // Polling with timeout
  RateLimiter, throttle, debounce,       // Rate limiting
  BatchQueue, AsyncQueue, createBatchedFunction, // Batch processing
  withTimeout, sleep, createDeferred,    // Timeout/async control
} from './src/utils/index.js';
```

| Utility | Fix Use Case |
|---------|--------------|
| `retryWithBackoff(fn, opts)` | Network/RPC reliability fixes |
| `poll(fn, opts)` | Async state waiting issues |
| `RateLimiter` | Rate limit compliance fixes |
| `BatchQueue` | Request batching optimizations |
| `withTimeout(promise, { ms })` | Timeout-related bugs |

---

**Execute now with issue: $ARGUMENTS**
