# Stack Safety and Assertion Errors

## Critical: Assertions Should Never Trigger

**⚠️ CRITICAL SECURITY PRINCIPLE: Stack assertions should NEVER be hit in production code. If an assertion triggers, it indicates a validation bug that could lead to fund loss.**

## The Two-Layer Safety Model

### Layer 1: Validation (Must Always Catch Errors)
Every operation that could cause stack underflow/overflow MUST be validated BEFORE execution:

```zig
// CORRECT: Validate first, then operate
if (self.stack.size() < 2) {
    return Error.StackUnderflow;  // Safe error return
}
const a = self.stack.pop_unsafe();  // Can use unsafe because we validated
```

### Layer 2: Assertions (Debug-Only Safety Net)
Assertions exist ONLY to catch validation bugs during development:

```zig
// Assertion is a safety net, not primary validation
tracer.assert(self.stack.size() >= 2, "ADD requires 2 stack items");
const a = self.stack.pop_unsafe();  // Already validated above
```

## Why Assertions Indicate Critical Bugs

When a stack assertion triggers, it means:
1. **Validation Failed**: The primary safety check didn't catch an invalid state
2. **Unsafe Assumption**: Code assumed something was validated when it wasn't
3. **Security Risk**: In production (without assertions), this would be undefined behavior

## Stack Validation Points

### 1. First Block Validation (Frame Interpret)
```zig
// Validates stack requirements for the entire first basic block
if (meta.min_stack > 0 and current_stack_size < meta.min_stack) {
    return Error.StackUnderflow;  // Must catch here!
}
```

### 2. JUMPDEST Validation (Jump Handler)
```zig
// Validates stack for the upcoming basic block
if (min_stack > 0 and current_stack_size < min_stack) {
    return Error.StackUnderflow;  // Must catch here!
}
```

### 3. Dispatch Preprocessing (calculateFirstBlockInfo)
```zig
// Calculates min/max stack requirements during preprocessing
// These calculations MUST be correct - errors here cause assertions later
```

## Common Stack Calculation Errors

### DUP Operations (0x80-0x8f)
```zig
// WRONG: Incorrect calculation
const required_items = dup_n - stack_effect;

// CORRECT: DUP needs exactly N items available
const dup_n = data.opcode - 0x80 + 1;  // DUP1=1, DUP2=2, etc.
const min_required = stack_effect - dup_n;
if (min_required < min_stack) {
    min_stack = min_required;
}
```

### SWAP Operations (0x90-0x9f)
```zig
// CORRECT: SWAP needs N+1 items
const swap_n = data.opcode - 0x90 + 2;  // SWAP1=2, SWAP2=3, etc.
const min_required = stack_effect - swap_n;
```

## Debugging Assertion Failures

When you hit a stack assertion:

1. **DON'T just fix the immediate error** - Find the validation gap
2. **Trace backwards** to find where validation should have occurred
3. **Fix the validation** BEFORE fixing the operation

### Example Debugging Flow
```
Assertion hit: "DUP3 requires 3 stack items"
↓
Check: Where should DUP3 be validated?
↓
Found: calculateFirstBlockInfo() has wrong DUP calculation
↓
Fix: Correct the min_stack calculation for DUP ops
↓
Result: Validation now catches error, assertion never reached
```

## Critical Rules

1. **Never rely on assertions for safety** - They're debug-only
2. **Every unsafe operation must have prior validation**
3. **Assertions catching errors = validation bug = security vulnerability**
4. **Fix validation, not just the symptom**

## Stack Effect Calculation

The preprocessor calculates stack effects for basic blocks:

```zig
// Track minimum stack needed and maximum stack growth
var stack_effect: i32 = 0;  // Current stack delta
var min_stack: i32 = 0;     // Most negative point (items needed)
var max_stack: i32 = 0;     // Most positive point (items added)

// For each opcode:
stack_effect -= inputs;      // Consume inputs
if (stack_effect < min_stack) min_stack = stack_effect;
stack_effect += outputs;     // Produce outputs
if (stack_effect > max_stack) max_stack = stack_effect;
```

## Testing Stack Safety

### Differential Testing
- Compare Frame execution against MinimalEvm
- Any divergence indicates validation error
- Both must fail identically or succeed identically

### Fuzzing
- Random bytecode with edge cases
- Should NEVER trigger assertions
- All failures must be clean Error returns

## Summary

**Stack assertions are bug detectors, not safety mechanisms.**

If an assertion triggers:
1. **STOP** - This is a critical security issue
2. **FIND** the missing/incorrect validation
3. **FIX** the validation to catch the error properly
4. **VERIFY** the assertion is never reached

Remember: **Crashes are SEVERE SECURITY BUGS**. The EVM must ALWAYS return errors gracefully.