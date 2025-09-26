# EIP-3860 Fix Verification

## Changes Made

Modified `/src/instructions/handlers_system.zig` to add EIP-3860 gas deduction for CREATE and CREATE2 opcodes:

1. **Added imports**:
   - `GasConstants` from primitives
   - `Hardfork` from eips module

2. **CREATE handler (line ~514-525)**:
   ```zig
   // EIP-3860: Deduct gas for initcode words (Shanghai+)
   if (self.getEvm().is_hardfork_at_least(.SHANGHAI)) {
       const word_count = (size_usize + 31) / 32; // Round up to words
       const initcode_gas = word_count * GasConstants.InitcodeWordGas;
       if (self.gas_remaining < @as(i32, @intCast(initcode_gas))) {
           self.stack.push_unsafe(0);
           // ... return failure
       }
       self.gas_remaining -= @as(i32, @intCast(initcode_gas));
   }
   ```

3. **CREATE2 handler (line ~613-624)**:
   - Identical logic added for CREATE2 opcode

## What This Fixes

- **Before**: CREATE/CREATE2 only deducted base gas cost (32000), not the per-word initcode cost
- **After**: CREATE/CREATE2 correctly deduct 2 gas per 32-byte word of initcode in Shanghai+
- **Impact**: ~186 EIP-3860 test failures should be resolved

## Gas Cost Calculation

For CREATE/CREATE2 with initcode:
- Base cost: 32,000 gas
- Initcode cost: `ceil(initcode_size / 32) * 2` gas (Shanghai+)
- Example: 64 bytes initcode = 32,000 + (64/32)*2 = 32,004 gas

## Hardfork Gating

The fix only applies when `hardfork >= SHANGHAI`:
- Pre-Shanghai: No initcode gas (original behavior)
- Shanghai+: Initcode gas applied (EIP-3860 active)

## Build Status

✅ Code compiles successfully
✅ No type errors
✅ Gas deduction uses correct i32 type for gas_remaining

## Potential Regressions to Watch

1. **Pre-Shanghai tests**: Should NOT charge initcode gas
2. **Gas calculations**: Other tests may have hardcoded gas expectations
3. **CREATE failures**: Tests expecting CREATE to succeed with minimal gas may now fail

## Next Steps

1. Run full test suite to check for regressions
2. Verify EIP-3860 specific tests pass
3. Update any tests with incorrect gas expectations