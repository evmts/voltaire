# Remove EventLog Redundant Aliases

**Priority: HIGH**

EventLog has duplicate filter methods with reversed parameter orders.

## Task
Remove redundant alias methods from EventLog.

## Issue
- `filterLogs(logs, filter)` - Keep this
- `filter(filter, logs)` - Remove this (reversed params, confusing)

## Files
Check `src/primitives/EventLog/` for both methods.

## Steps
1. Locate both method definitions
2. Remove `filter(filter, logs)` method
3. Keep `filterLogs(logs, filter)` as canonical
4. Update tests to use `filterLogs()` only
5. Update any documentation

## Verification
```bash
bun run test -- EventLog
grep -r "EventLog.filter(" src/ # Should find no usages of removed method
```
