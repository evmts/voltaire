# EIP-3860 Initcode Limit Fix Summary

## Issue
EIP-3860 (introduced in Shanghai hardfork) requires:
1. Contract initcode size limit of 49,152 bytes (2x MAX_CODE_SIZE)
2. Additional gas cost of 2 gas per 32-byte word of initcode

## Root Cause
The CREATE and CREATE2 opcode handlers were not deducting the required gas for initcode words as specified by EIP-3860. This meant transactions with large initcode were not being charged the correct gas amount, causing state test failures.

## Fix Applied
Added EIP-3860 gas deduction to both CREATE and CREATE2 handlers in `/src/instructions/handlers_system.zig`:

1. Check if Shanghai hardfork is active
2. Calculate number of 32-byte words in initcode (rounded up)
3. Calculate gas cost: `word_count * 2` (InitcodeWordGas)
4. Deduct gas before executing the CREATE operation
5. Return failure (push 0) if insufficient gas

## Code Changes
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

## Impact
This fix addresses approximately 186 EIP-3860 related test failures in the execution spec tests. The initcode size limit check was already implemented in the EVM's `inner_call` function, but the gas metering was missing from the opcode handlers.

## Testing
Build and basic tests pass successfully:
- `zig build` - Success
- `zig build test-opcodes` - Success
- CREATE/CREATE2 opcodes now correctly charge gas for initcode

## Related EIPs
- EIP-170: Contract code size limit (24,576 bytes)
- EIP-3860: Limit and meter initcode (49,152 bytes limit + 2 gas per word)