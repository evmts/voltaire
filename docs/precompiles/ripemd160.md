# RIPEMD160 (0x03)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000003`
- **Available since:** Frontier (first Ethereum release)
- **EIP:** Part of Ethereum Yellow Paper

## Purpose

Computes the RIPEMD-160 cryptographic hash of arbitrary input data. RIPEMD-160 is primarily used in Bitcoin address generation and is maintained for compatibility.

## Gas Cost

**Dynamic:**
- Base gas: 600
- Per-word gas: 120 (where word = 32 bytes)
- Formula: `600 + 120 * ceil(input_length / 32)`

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

Always returns exactly 32 bytes: the 20-byte RIPEMD-160 hash, left-padded with 12 zero bytes.

| Offset | Length | Field   | Description |
|--------|--------|---------|-------------|
| 0      | 12     | padding | Zero bytes |
| 12     | 20     | hash    | RIPEMD-160 hash of the input |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const ripemd160 = precompiles.ripemd160;

const input = "hello world";
const result = try ripemd160.execute(allocator, input, 1000000);
defer result.deinit(allocator);

// Extract the actual hash (skip first 12 padding bytes)
const hash = result.output[12..32];
std.debug.print("Hash: {x}\n", .{std.fmt.fmtSliceHexLower(hash)});
```

## Example with Empty Input

```zig
// RIPEMD-160 of empty string
const result = try ripemd160.execute(allocator, &[_]u8{}, 1000000);
defer result.deinit(allocator);

// First 12 bytes are zero padding
// Bytes 12-32 contain the RIPEMD-160 hash
```

## Implementation Details

1. **Gas Calculation:** Computed as `BASE_GAS + PER_WORD_GAS * num_words` where `num_words = (input.len + 31) / 32`
2. **Hash Computation:** Uses `crypto.Ripemd160.hash` implementation
3. **Output Padding:** The 20-byte hash is left-padded with 12 zero bytes to match Ethereum's 32-byte output format

## Error Conditions

- **OutOfGas:** Insufficient gas provided for the input size

## Gas Cost Examples

| Input Size | Words | Gas Cost |
|------------|-------|----------|
| 0 bytes    | 0     | 600      |
| 1 byte     | 1     | 720      |
| 32 bytes   | 1     | 720      |
| 33 bytes   | 2     | 840      |
| 64 bytes   | 2     | 840      |
| 1024 bytes | 32    | 4440     |

## Testing Considerations

Test cases should include:
- Empty input (verify padding)
- Single byte input
- Various input sizes (1, 31, 32, 33, 64 bytes)
- Large inputs (>1KB)
- Out of gas scenarios
- Verification that first 12 bytes are always zero
- Known RIPEMD-160 test vectors

## Known Test Vectors

```zig
// Empty string
input: ""
output (20 bytes): 9c1185a5c5e9fc54612808977ee8f548b2258d31

// "abc"
input: "abc"
output (20 bytes): 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
```

## Use Cases

- Bitcoin P2PKH address generation
- Legacy cryptographic systems requiring RIPEMD-160
- Cross-chain compatibility with Bitcoin-derived systems

## Security Notes

- RIPEMD-160 is considered deprecated for new systems
- Maintained primarily for Bitcoin compatibility
- 160-bit output provides less collision resistance than SHA-256
- Implementation follows the standard RIPEMD-160 specification
