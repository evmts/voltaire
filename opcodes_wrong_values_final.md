# Opcodes Returning Wrong Values - Final Analysis

Based on code review and test analysis, here are the opcodes that are definitely returning incorrect values:

## 1. Comparison Operators - REVERSED STACK ORDER ❌

The implementation has the stack order backwards. They compute `b op a` instead of `a op b`:

### LT (0x10) - Less Than
```zig
// Current (WRONG): b < a
// Should be: a < b
```

### GT (0x11) - Greater Than  
```zig
// Current (WRONG): b > a
// Should be: a > b
```

### SLT (0x12) - Signed Less Than
```zig
// Current (WRONG): b < a (signed)
// Should be: a < b (signed)
```

### SGT (0x13) - Signed Greater Than
```zig
// Current (WRONG): b > a (signed)
// Should be: a > b (signed)
```

## 2. EXP (0x0A) - Exponentiation ❌

Has incorrect edge case handling for `0^0`:

```zig
// Current implementation:
if (exp == 0) return 1;  // Correct
if (base == 0) return 0;  // WRONG - this makes 0^0 = 0

// Should be:
if (exp == 0) return 1;  // This handles 0^0 = 1 correctly
if (base == 0 && exp != 0) return 0;  // Only return 0 if exp != 0
```

## 3. Potential Issues (Need Testing)

### MULMOD (0x09) - Modular Multiplication
- Implementation looks correct (Russian peasant algorithm)
- Tests claim it fails, but algorithm review suggests it should work
- May be a test generation issue

### ADDMOD (0x08) - Modular Addition
- Implementation uses `@addWithOverflow` which should be correct
- May have edge case with `(MAX + MAX) % MAX`

### SIGNEXTEND (0x0B) - Sign Extension
- Implementation looks correct
- Complex bit manipulation that may have edge cases

### BYTE (0x1A) - Byte Extraction
- Implementation looks correct
- Formula: `(val >> ((31 - i) * 8)) & 0xFF`

## 4. Shift Operators ✅
These appear to be implemented correctly:
- SHL (0x1B) - Shift Left
- SHR (0x1C) - Shift Right  
- SAR (0x1D) - Arithmetic Shift Right

## Summary

**Definitely Wrong (High Priority):**
1. LT, GT, SLT, SGT - Stack order reversed
2. EXP - Edge case `0^0` returns 0 instead of 1

**Possibly Wrong (Need Verification):**
1. MULMOD - Tests fail but implementation looks correct
2. ADDMOD - May have overflow edge case
3. SIGNEXTEND - Complex implementation, may have edge cases
4. BYTE - Implementation looks correct but tests may fail

The comparison operators are the most critical to fix as they affect control flow (JUMPI decisions).