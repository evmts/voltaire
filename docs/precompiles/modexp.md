# MODEXP (0x05)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000005`
- **Available since:** Byzantium (EIP-198)
- **EIP:** [EIP-198](https://eips.ethereum.org/EIPS/eip-198) - Big integer modular exponentiation
- **Updates:** [EIP-2565](https://eips.ethereum.org/EIPS/eip-2565) - ModExp gas cost (Berlin hardfork)

## Purpose

Performs arbitrary-precision modular exponentiation: `(base ^ exponent) mod modulus`. This operation is essential for RSA signature verification, zero-knowledge proofs, and other cryptographic protocols.

## Audit Status

⚠️ UNAUDITED - High Complexity

This is a custom Zig implementation of modular exponentiation that has NOT been security audited.

Known risks:
- Variable-time modular arithmetic (potential timing attacks)
- Complex algorithm with multiple edge cases
- Gas calculation complexity across hardforks
- No formal security audit

Critical for: EIP-198 precompile (0x05)

Recommendation:
- Use only after independent security audit
- Be aware of timing attack surface
- Validate gas calculations thoroughly

Report issues: security@tevm.sh

## Gas Cost

**Dynamic and complex:**
- Minimum gas: 200
- Formula varies by hardfork (EIP-198 vs EIP-2565)
- Depends on input sizes and exponent value
- Uses `ModExp.calculateGas()` for accurate computation

The gas cost is designed to reflect the computational complexity of the operation.

## API Reference

### Function Signature

```zig
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
    hardfork: Hardfork,
) PrecompileError!PrecompileResult
```

**Note:** This precompile requires a `hardfork` parameter to determine gas cost calculation.

## Input Format

The input consists of three length prefixes followed by the actual data:

| Offset        | Length | Field      | Description |
|---------------|--------|------------|-------------|
| 0             | 32     | base_len   | Length of base in bytes (big-endian u256) |
| 32            | 32     | exp_len    | Length of exponent in bytes (big-endian u256) |
| 64            | 32     | mod_len    | Length of modulus in bytes (big-endian u256) |
| 96            | base_len | base     | Base value (big-endian) |
| 96 + base_len | exp_len  | exponent | Exponent value (big-endian) |
| 96 + base_len + exp_len | mod_len | modulus | Modulus value (big-endian) |

**Input Padding:**
- Input shorter than expected is zero-padded
- Length fields must fit in `usize` (returns `InvalidInput` otherwise)

## Output Format

Returns the result of `(base ^ exponent) mod modulus`, padded/truncated to `mod_len` bytes:

| Offset | Length  | Field  | Description |
|--------|---------|--------|-------------|
| 0      | mod_len | result | Modular exponentiation result (big-endian) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const modexp = precompiles.modexp;
const Hardfork = @import("primitives").Hardfork;

// Calculate 2^3 mod 5 = 8 mod 5 = 3
var input: [99]u8 = [_]u8{0} ** 99;

// base_len = 1
input[31] = 1;
// exp_len = 1
input[63] = 1;
// mod_len = 1
input[95] = 1;

// base = 2
input[96] = 2;
// exp = 3
input[97] = 3;
// mod = 5
input[98] = 5;

const result = try modexp.execute(allocator, &input, 1000000, .Cancun);
defer result.deinit(allocator);

// result.output[0] == 3
```

## Implementation Details

1. **Input Parsing:**
   - Reads three 32-byte big-endian length values
   - Validates lengths fit in `usize`
   - Extracts base, exponent, and modulus (with zero-padding)

2. **Gas Calculation:**
   - Uses `ModExp.calculateGas()` which varies by hardfork
   - Pre-Berlin (EIP-198): Based on input sizes
   - Berlin+ (EIP-2565): Improved formula reflecting actual computation

3. **Computation:**
   - Uses `ModExp.modexp()` for arbitrary-precision arithmetic
   - Implements efficient exponentiation algorithms
   - Result is padded/truncated to match `mod_len`

4. **Output Padding:**
   - Result shorter than `mod_len`: left-padded with zeros
   - Result longer than `mod_len`: leftmost bytes taken

## Error Conditions

- **InvalidInput:** Length values exceed `usize` or input too short for specified lengths
- **OutOfGas:** Insufficient gas for the operation
- **OutOfMemory:** Memory allocation failure

## Use Cases

1. **RSA Signature Verification:** Verify RSA signatures on-chain
2. **Zero-Knowledge Proofs:** Modular arithmetic operations in ZK systems
3. **Cryptographic Protocols:** Multi-party computation, threshold signatures
4. **Number Theory:** On-chain mathematical computations

## Testing Considerations

Test cases should include:
- Simple cases (2^3 mod 5)
- Large exponents (testing efficiency)
- Edge cases: zero base, zero exponent, zero modulus
- Various input sizes
- Gas cost validation across hardforks
- Result padding for different output sizes
- Out of gas scenarios

## Example Test Vectors

```zig
// 2^3 mod 5 = 3
base:     0x02
exponent: 0x03
modulus:  0x05
result:   0x03

// 2^256 mod 100 = 56
base:     0x02
exponent: 0x0100
modulus:  0x64
result:   0x38
```

## Gas Cost Considerations

The gas cost depends heavily on:
- Size of the modulus (primary factor)
- Size of the exponent
- Actual exponent value (leading zeros matter post-EIP-2565)
- Hardfork (pre-Berlin vs Berlin+)

Always use sufficient gas limits for large operations.

## Security Notes

- Implementation must prevent timing attacks via constant-time operations
- Large exponents can be computationally expensive
- Modulus of zero should be handled gracefully
- Arbitrary-precision arithmetic must be correct to prevent exploitation
