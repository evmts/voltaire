# BLAKE2F (0x09)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000009`
- **Available since:** Istanbul (EIP-152)
- **EIP:** [EIP-152](https://eips.ethereum.org/EIPS/eip-152) - BLAKE2b compression function

## Purpose

Implements the BLAKE2b compression function F. This precompile enables efficient verification of Zcash Equihash proofs and other systems using BLAKE2b. It provides direct access to the compression function rather than the full hash, allowing for flexible cryptographic constructions.

## Audit Status

⚠️ UNAUDITED - Cryptographic Function

This BLAKE2b compression function implementation has NOT been security audited.

Known risks:
- Custom cryptographic implementation
- Critical for Zcash interoperability
- No formal security audit

Use case: EIP-152 precompile (0x09) for Zcash-Ethereum bridge

Recommendation: Use only after independent security audit for production systems handling valuable assets.

Report issues: security@tevm.sh

## Gas Cost

**Dynamic:**
- Per-round gas: 1
- Formula: `rounds * 1`

The rounds parameter is extracted from the input, allowing fine-grained control over computational cost.

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

**Exactly 213 bytes required:**

| Offset | Length | Field          | Description |
|--------|--------|----------------|-------------|
| 0      | 4      | rounds         | Number of rounds (big-endian u32) |
| 4      | 64     | h              | State vector (8 × 8-byte words, little-endian) |
| 68     | 128    | m              | Message block (16 × 8-byte words, little-endian) |
| 196    | 16     | t              | Offset counters (2 × 8-byte words, little-endian) |
| 212    | 1      | f              | Final block indicator (0x00 or 0x01) |

**Critical:** Input must be exactly 213 bytes - no padding or truncation.

## Output Format

Returns exactly 64 bytes: the updated state vector.

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | h     | Updated state vector (8 × 8-byte words, little-endian) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const blake2f = precompiles.blake2f;

// Prepare 213-byte input for BLAKE2b compression
var input: [213]u8 = undefined;

// Set rounds (e.g., 12 rounds)
std.mem.writeInt(u32, input[0..4], 12, .big);

// Set state vector h (64 bytes)
@memcpy(input[4..68], &initial_state);

// Set message block m (128 bytes)
@memcpy(input[68..196], &message_block);

// Set offset counters t (16 bytes)
@memcpy(input[196..212], &offset_counters);

// Set final block flag f (1 byte)
input[212] = 0x00; // Not final block

const result = try blake2f.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// result.output contains the 64-byte updated state
```

## Implementation Details

1. **Input Validation:**
   - Length must be exactly 213 bytes
   - Returns `error.InvalidInput` for any other length

2. **Rounds Extraction:**
   - First 4 bytes interpreted as big-endian u32
   - Determines number of compression rounds
   - Gas cost = rounds × 1

3. **Compression:**
   - Uses `crypto.Blake2.compress()` implementation
   - Follows BLAKE2b specification (RFC 7693)
   - Little-endian format for state and message

4. **Output:**
   - Returns updated 64-byte state vector
   - State is in little-endian format

## Error Conditions

- **InvalidInput:** Input length is not exactly 213 bytes
- **OutOfGas:** Insufficient gas for the number of rounds
- **InvalidInput:** Malformed compression function parameters

## Gas Cost Examples

| Rounds | Gas Cost |
|--------|----------|
| 1      | 1        |
| 12     | 12       |
| 100    | 100      |
| 1000   | 1000     |

The gas cost is directly proportional to the computational work performed.

## BLAKE2b Compression Function

BLAKE2b uses a compression function F that:
- Takes a state vector (h), message block (m), offset counters (t), and final flag (f)
- Performs a specified number of rounds
- Returns an updated state vector

The compression function is the core of the BLAKE2b hash but can also be used standalone for custom constructions.

## Use Cases

1. **Zcash Integration:** Verifying Zcash transactions and proofs
2. **Cross-Chain Bridges:** Ethereum-Zcash interoperability
3. **Custom Hash Functions:** Building hash functions on BLAKE2b
4. **Proof Systems:** Zero-knowledge proofs using BLAKE2b
5. **Merkle Trees:** BLAKE2b-based Merkle tree verification

## Testing Considerations

Test cases should include:
- Invalid input length (< 213 bytes)
- Invalid input length (> 213 bytes)
- Zero rounds (edge case)
- Small round counts (1, 2, 12)
- Large round counts (100, 1000)
- Different final block flags (0x00, 0x01)
- Known BLAKE2b test vectors from RFC 7693
- Gas calculation accuracy

## Example Test Vector

From the BLAKE2b specification:
```
rounds: 12
h: Initial BLAKE2b-512 state
m: Message block (zeros or test pattern)
t: [0, 0] for first block
f: 0x00 for non-final, 0x01 for final block
Expected output: Specific state vector per RFC 7693
```

## Performance Notes

- Extremely cheap: 1 gas per round
- Allows fine-tuning of security vs cost tradeoff
- Typical usage: 12 rounds per BLAKE2b specification
- Can reduce rounds for faster hashing with lower security

## Security Notes

- **Round Count:** Standard BLAKE2b uses 12 rounds
- **Fewer Rounds:** Reduces security margin (use with caution)
- **More Rounds:** Increases security at higher gas cost
- **Final Flag:** Must be set correctly for hash integrity
- **Endianness:** Little-endian format (unlike most Ethereum data)

## Comparison with SHA256 (0x02)

| Feature      | BLAKE2F         | SHA256          |
|--------------|-----------------|-----------------|
| Type         | Compression fn  | Full hash       |
| Output       | 64 bytes        | 32 bytes        |
| Gas (typical)| 12 gas          | 60+ gas         |
| Rounds       | Configurable    | Fixed           |
| Speed        | Very fast       | Fast            |

## Related Precompiles

- **SHA256 (0x02):** Alternative hash function
- **RIPEMD160 (0x03):** Another hash function for Bitcoin compatibility
