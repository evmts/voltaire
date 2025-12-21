# TypeScript Error Fixing Automation Reports

This directory contains reports from automated TypeScript error fixing sessions.

## Running the Automation

```bash
# Run with defaults (10 cycles max)
bun run scripts/fix-typescript-errors-loop.ts

# Run with custom limits
bun run scripts/fix-typescript-errors-loop.ts --max-cycles=20

# Run a single cycle for testing
bun run scripts/fix-typescript-errors-loop.ts --max-cycles=1
```

## Report Files

- `session-*.json` - Full JSON report for each session
- `LATEST.md` - Human-readable summary of latest progress

## How It Works

1. **Check Errors**: Counts current TypeScript errors
2. **Generate Handoff**: Creates a detailed prompt with context and patterns
3. **Run Claude**: Executes Claude Code with the prompt
4. **Capture Progress**: Records errors fixed, commits made
5. **Save Report**: Writes JSON and markdown reports
6. **Loop**: Repeats until errors = 0 or max cycles reached

## Manual Handoff

If you need to continue manually, use the handoff prompt from `LATEST.md`.
