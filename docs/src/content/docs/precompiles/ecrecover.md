---
title: ECRECOVER (0x01)
description: Elliptic curve signature recovery precompile for recovering Ethereum addresses from ECDSA signatures.
---

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000001`
- **Available since:** Frontier (first Ethereum release)
- **EIP:** Part of Ethereum Yellow Paper

## Purpose

Recovers the Ethereum address associated with the public key from an ECDSA signature. This is essential for signature verification in Ethereum, allowing contracts to verify that a message was signed by a specific account without needing the public key.

## Gas Cost

**Fixed:** 3,000 gas

## API Reference

### Function Signature

```zig
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult
```

### Constants

```zig
pub const GAS: u64 = 3000;
```

## Input Format

Expects exactly 128 bytes (4 × 32 bytes) with the following structure:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 32     | hash  | Message hash (Keccak256) |
| 32     | 32     | v     | Recovery ID (27 or 28), right-padded |
| 64     | 32     | r     | First signature component |
| 96     | 32     | s     | Second signature component |

**Important:**
- If input is less than 128 bytes, it is right-padded with zeros
- `v` is stored in the last byte of the 32-byte v field (byte 63)
- `v` must be 27 or 28 (or 0/1 in some contexts)
- `r` and `s` must be valid secp256k1 signature components

## Output Format

Returns exactly 32 bytes:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 12     | padding | Zero bytes |
| 12     | 20     | address | Recovered Ethereum address |

**On failure** (invalid signature): Returns 32 zero bytes

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const ecrecover = precompiles.ecrecover;

// Prepare input: hash || v || r || s
var input: [128]u8 = undefined;

// Message hash (32 bytes)
const hash = [_]u8{0x47} ** 32;
@memcpy(input[0..32], &hash);

// v (32 bytes, with actual value in last byte)
var v_padded = [_]u8{0} ** 32;
v_padded[31] = 28;
@memcpy(input[32..64], &v_padded);

// r (32 bytes)
const r = [_]u8{0x69} ** 32;
@memcpy(input[64..96], &r);

// s (32 bytes)
const s = [_]u8{0x7a} ** 32;
@memcpy(input[96..128], &s);

// Execute
const result = try ecrecover.execute(allocator, &input, 10000);
defer result.deinit(allocator);

// Extract address (last 20 bytes)
const address = result.output[12..32];
```

## Implementation Details

1. **Input Parsing:** Input is padded to 128 bytes if shorter
2. **Parameter Extraction:**
   - `hash` = bytes 0-31
   - `v` = byte 63 (last byte of v field)
   - `r` = bytes 64-95
   - `s` = bytes 96-127
3. **Recovery:** Uses `secp256k1.recoverPubkey()` to recover the 64-byte public key
4. **Address Derivation:**
   - Compute `keccak256(pubkey)`
   - Take last 20 bytes of hash
   - Left-pad with 12 zero bytes
5. **Error Handling:** Invalid signatures return 32 zero bytes (not an error)

## Error Conditions

- **OutOfGas:** Insufficient gas provided (needs at least 3,000 gas)
- **Invalid Signature:** Returns zero address instead of failing

## Recovery ID (v parameter)

The `v` parameter serves as a recovery ID to distinguish between two possible public keys:

- **v = 27:** Recovery ID 0 (even y-coordinate parity)
- **v = 28:** Recovery ID 1 (odd y-coordinate parity)

In EIP-155 (replay protection), v can also be:
- **v = chainId * 2 + 35:** Recovery ID 0 with chain ID
- **v = chainId * 2 + 36:** Recovery ID 1 with chain ID

The precompile handles both formats.

## Testing Considerations

Test cases should include:

- **Valid signatures** with v = 27 and v = 28
- **Invalid signatures** (wrong r, s, or v values)
- **Out of range** r and s values
- **Short input** (less than 128 bytes)
- **Empty input**
- **Gas exhaustion** scenarios
- **Known test vectors** from Ethereum test suite

## Common Use Cases

### 1. Signature Verification in Contracts

```solidity
function verifySignature(
    bytes32 hash,
    uint8 v,
    bytes32 r,
    bytes32 s,
    address expected
) public pure returns (bool) {
    address recovered = ecrecover(hash, v, r, s);
    return recovered == expected;
}
```

### 2. Meta-Transactions

Contracts use ecrecover to verify off-chain signatures and execute transactions on behalf of users.

### 3. EIP-712 Typed Data Signing

Structured data signing relies on ecrecover to verify typed message signatures.

## Security Notes

### Signature Malleability (EIP-2)

Prior to EIP-2, signatures were malleable: given a valid signature `(r, s)`, the signature `(r, n - s)` was also valid (where n is the curve order). This allowed attackers to modify transaction signatures.

**Mitigation:** Modern implementations reject signatures where `s > n/2`.

### Zero Address Return

Unlike most precompiles, ecrecover does not revert on invalid signatures. Instead, it returns the zero address (`0x000...000`). Contracts MUST check for this:

```solidity
address signer = ecrecover(hash, v, r, s);
require(signer != address(0), "Invalid signature");
require(signer == expected, "Unauthorized");
```

### Replay Attacks

Always include transaction-specific data in the hash to prevent replay attacks:
- Nonce
- Chain ID (EIP-155)
- Contract address
- Expiration timestamp

## Performance Considerations

- **Gas cost is fixed:** Always 3,000 gas regardless of input validity
- **Computation time:** Dominated by elliptic curve operations (~0.1ms)
- **Most used precompile:** Critical path for signature verification

## Known Test Vectors

```zig
// Example from Ethereum test suite
hash: 0x47...47 (32 bytes of 0x47)
v:    28
r:    0x69...69 (32 bytes of 0x69)
s:    0x7a...7a (32 bytes of 0x7a)
// Result: specific address depending on signature validity
```

## Related Functions

- **secp256k1.recoverPubkey():** Underlying curve recovery function
- **keccak256():** Hash function for address derivation
- **EIP-155:** Transaction signature format with chain ID
- **EIP-191:** Signed data standard
- **EIP-712:** Typed structured data hashing and signing

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Section 7
- [EIP-2: Homestead Hard-fork Changes](https://eips.ethereum.org/EIPS/eip-2)
- [EIP-155: Simple replay attack protection](https://eips.ethereum.org/EIPS/eip-155)
- [SEC 2: Recommended Elliptic Curve Domain Parameters](http://www.secg.org/sec2-v2.pdf)

---

**Source:** `/Users/williamcory/primitives/src/precompiles/ecrecover.zig` (79 lines)
**Gas Cost:** 3,000 (constant)
