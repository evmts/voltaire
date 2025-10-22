# IDENTITY (0x04)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000004`
- **Available since:** Frontier (first Ethereum release)
- **EIP:** Part of Ethereum Yellow Paper

## Purpose

The identity function returns its input unchanged. This precompile is primarily used for efficient data copying within the EVM, as calling this precompile is cheaper than manually copying data in EVM bytecode.

## Gas Cost

**Dynamic:**
- Base gas: 15
- Per-word gas: 3 (where word = 32 bytes)
- Formula: `15 + 3 * ceil(input_length / 32)`

This is the cheapest precompile, making it ideal for memory-to-memory copies.

## API Reference

### Function Signature

```zig
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult
```

## Input Format

Accepts arbitrary-length input data (any byte sequence).

## Output Format

Returns an exact copy of the input data.

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const identity = precompiles.identity;

const input = [_]u8{ 1, 2, 3, 4, 5 };
const result = try identity.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// result.output is identical to input
try std.testing.expectEqualSlices(u8, &input, result.output);
```

## Implementation Details

1. **Gas Calculation:** Computed as `BASE_GAS + PER_WORD_GAS * num_words` where `num_words = (input.len + 31) / 32`
2. **Data Copying:** Uses `allocator.dupe()` for efficient memory duplication
3. **Optimization:** This is the most efficient way to copy data in the EVM

## Error Conditions

- **OutOfGas:** Insufficient gas provided for the input size
- **OutOfMemory:** Allocation failure (from allocator)

## Gas Cost Examples

| Input Size | Words | Gas Cost |
|------------|-------|----------|
| 0 bytes    | 0     | 15       |
| 1 byte     | 1     | 18       |
| 32 bytes   | 1     | 18       |
| 33 bytes   | 2     | 21       |
| 64 bytes   | 2     | 21       |
| 1024 bytes | 32    | 111      |

## Use Cases

1. **Efficient Memory Copying:** Cheaper than EVM MLOAD/MSTORE loops
2. **Data Transfer:** Moving data between different memory regions
3. **Testing:** Verifying call data handling
4. **Gas Optimization:** Bulk data operations in smart contracts

## Testing Considerations

Test cases should include:
- Empty input (returns empty output)
- Single byte
- Various sizes (1, 31, 32, 33, 64 bytes)
- Large inputs (>1KB)
- Out of gas scenarios
- Gas calculation accuracy
- Memory allocation/deallocation

## Example Test

```zig
test "identity - returns input" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{ 1, 2, 3, 4, 5 };
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    try testing.expectEqualSlices(u8, &input, result.output);
}

test "identity - gas calculation" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const input = [_]u8{0} ** 64; // 2 words
    const result = try execute(allocator, &input, 1000000);
    defer result.deinit(allocator);

    const expected_gas = 15 + 3 * 2; // BASE_GAS + PER_WORD_GAS * 2
    try testing.expectEqual(expected_gas, result.gas_used);
}
```

## Performance Notes

- This is the cheapest precompile per byte of data
- More efficient than EVM memory operations for data copying
- Negligible computation cost (simple memory copy)
- Often used in gas optimization strategies

## Security Notes

- No cryptographic operations performed
- Simple memory duplication with no security implications
- Cannot fail except for out of gas or out of memory
- No input validation required
