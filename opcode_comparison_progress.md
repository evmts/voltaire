# Opcode Comparison Progress

## Summary

Started with 23 passed, 7 failed. After fixing stack order in test setup, we have 24 passed, 6 failed.

## Fixed Issues

1. **Test Setup**: Fixed Zig FFI test to push values in reverse order to match REVM
   - This fixed all comparison opcodes (LT, GT, EQ, etc.)
   - This fixed all bitwise shift opcodes (SHL, SHR)

2. **Attempted Fixes** (not working yet):
   - DIV: Changed from a/b to b/a
   - MOD: Changed from a%b to b%a
   - ADDMOD/MULMOD: Changed pop order to match REVM
   - EXP: Changed to use top as base, second as exponent

## Current Status

### Passing Tests (24)
- ADD (3 tests)
- SUB (3 tests)
- MUL (2 tests)
- DIV: division by zero test
- MOD: mod by zero test
- All comparison opcodes (8 tests)
- All bitwise opcodes (6 tests)

### Failing Tests (6)
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| DIV: 84 / 2 | 42 | 0 | ❌ |
| MOD: 17 % 5 | 2 | 5 | ❌ |
| ADDMOD: (10+10)%8 | 4 | 8 | ❌ |
| MULMOD: (10*10)%8 | 4 | 0 | ❌ |
| EXP: 2^3 | 8 | 9 | ❌ |
| SIGNEXTEND: 0xFF from byte 0 | MAX | 0 | ❌ |

## Next Steps

The issue appears to be that the opcodes aren't executing properly through the FFI. Need to:
1. Verify opcodes are being called
2. Check if there's an issue with the FFI setup
3. Add more debug logging to trace execution