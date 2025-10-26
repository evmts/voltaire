# ECRECOVER (0x01)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000001`
- **Available since:** Frontier (first Ethereum release)
- **EIP:** Part of Ethereum Yellow Paper

## Purpose

Recovers the Ethereum address associated with a given message hash and ECDSA signature (v, r, s components). This is the fundamental operation used to verify transaction signatures and authenticate message signers on Ethereum.

## Audit Status

⚠️ UNAUDITED - Use with Caution

This implementation uses:
- Pure Zig secp256k1 implementation (UNAUDITED)
- Custom signature recovery logic (UNAUDITED)
- Keccak-256 for address derivation

**Not suitable for production use without security audit.**

## Gas Cost

**Fixed:**
- Constant gas cost: **3000** (independent of input)

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

Expects exactly 128 bytes (or pads/truncates to 128 bytes):

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 32     | hash  | Message hash (typically from keccak256) |
| 32     | 32     | v     | Recovery ID (last byte contains 27 or 28, rest should be 0) |
| 64     | 32     | r     | ECDSA signature r component |
| 96     | 32     | s     | ECDSA signature s component |

**Input handling:**
- If input < 128 bytes: Right-padded with zeros
- If input > 128 bytes: Truncated to 128 bytes
- Empty input is treated as 128 zero bytes

## Output Format

Always returns exactly 32 bytes:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 12     | padding | Zero bytes (left-padding) |
| 12     | 20     | address | Recovered Ethereum address |

**On signature recovery failure:**
- Returns 32 zero bytes (0x0000...0000)
- Still consumes gas (3000)

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const ecrecover = precompiles.ecrecover;

// Prepare input: hash || v || r || s
var input: [128]u8 = undefined;
@memcpy(input[0..32], message_hash);      // 32-byte hash
@memcpy(input[32..64], v_padded);         // v value (padded to 32 bytes)
@memcpy(input[64..96], r_component);      // r signature component
@memcpy(input[96..128], s_component);     // s signature component

const result = try ecrecover.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Extract address from output (last 20 bytes)
const recovered_address = result.output[12..32];
std.debug.print("Recovered address: 0x{x}\n", .{std.fmt.fmtSliceHexLower(recovered_address)});
```

## Example with Invalid Signature

```zig
// All zeros - invalid signature
var input = [_]u8{0} ** 128;

const result = try ecrecover.execute(allocator, &input, 3000);
defer result.deinit(allocator);

// Output will be 32 zero bytes
// result.output = [0, 0, 0, ..., 0]
```

## Implementation Details

1. **Input Padding:** Input is always normalized to exactly 128 bytes
2. **v Value Extraction:** Takes the last byte of the v field (bytes 32-63)
3. **Signature Recovery:** Uses secp256k1 public key recovery from signature
4. **Address Derivation:**
   - Computes keccak256(recovered_pubkey)
   - Takes last 20 bytes as the Ethereum address
   - Left-pads with 12 zero bytes to make 32-byte output
5. **Error Handling:** Invalid signatures return empty output (32 zero bytes) rather than failing

## Error Conditions

- **OutOfGas:** Gas limit < 3000

## Signature Recovery Values

The `v` value determines the recovery ID:
- **27 (0x1b):** Even y-coordinate
- **28 (0x1c):** Odd y-coordinate
- **Chain-specific v:** For EIP-155 signed transactions, `v = 2 * chainId + 35 + {0,1}`
  - Note: This precompile expects raw v values (27 or 28)
  - Chain-specific v values should be normalized before calling

## Testing Considerations

Test cases should include:
- Valid signatures (v=27 and v=28)
- Invalid signatures (all zeros, invalid r/s values)
- Various input sizes (< 128, = 128, > 128 bytes)
- Empty input
- Out of gas scenarios
- Edge case v values
- Known test vectors from Ethereum test suite

## Known Test Vectors

```zig
// Example from Ethereum tests
Input:
  hash: 0x47...47 (32 bytes of 0x47)
  v:    0x00...1c (28 in last byte)
  r:    0x69...69 (32 bytes of 0x69)
  s:    0x7a...7a (32 bytes of 0x7a)

Output:
  Recovered address (padded): 0x000000000000000000000000{20-byte-address}
```

## Security Notes

- **UNAUDITED secp256k1 implementation** - Do not use in production without audit
- **Side-channel resistance:** Implementation should use constant-time operations
- **Malleability:** s values > secp256k1.n/2 should be rejected (EIP-2)
- **Invalid signatures:** Return empty output rather than failing (Ethereum spec)
- **v value validation:** Only 27 and 28 are valid for non-chain-specific signatures

## Common Use Cases

1. **Transaction Signature Verification:** Recover sender address from transaction signature
2. **Message Authentication:** Verify that a message was signed by a specific address
3. **EIP-191 Personal Sign:** Recover signer of personal messages
4. **EIP-712 Typed Data:** Recover signer of structured data
5. **Account Abstraction:** Validate signatures in smart contracts

## Performance Characteristics

- **Fixed cost:** Always 3000 gas regardless of input
- **No loops:** Constant-time execution
- **Single elliptic curve operation:** One point recovery + one Keccak-256 hash
- **Memory:** Allocates 32 bytes for output
