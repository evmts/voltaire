# CLAUDE.md - Crypto Module AI Context

## MISSION CRITICAL: Cryptographic Security Foundation

The crypto module provides all cryptographic primitives for Ethereum. **ANY vulnerability in cryptographic operations can compromise the entire system security and enable theft.** Cryptographic implementations must be constant-time, side-channel resistant, and specification-compliant.

## Critical Implementation Details

### Cryptographic Specifications (IMMUTABLE REQUIREMENTS)

**Hash Function**: Keccak-256 (NOT SHA3-256) - different padding
**Digital Signatures**: ECDSA over secp256k1 curve
**Key Derivation**: Ethereum address = last 20 bytes of Keccak256(public_key)
**Precompile Cryptography**: Specific curves and hash functions per EIP

### Core Files and Critical Responsibilities

**Hash Functions**: Keccak-256, SHA-256, RIPEMD-160, BLAKE2F
**Elliptic Curves**: secp256k1, BN254 (alt_bn128)
**Key Management**: Public key recovery, address derivation
**Signature Verification**: ECDSA signature validation
**Precompile Support**: Cryptographic precompiles 0x01-0x09

## Keccak-256 Implementation (CONSENSUS CRITICAL)

### Hash Function Safety
```zig
pub fn keccak256(data: []const u8) [32]u8 {
    var hasher = std.crypto.hash.sha3.Keccak256.init(.{});
    hasher.update(data);
    var result: [32]u8 = undefined;
    hasher.final(&result);
    return result;
}

// CRITICAL: Verify this is Keccak-256, NOT SHA3-256
// They have different padding schemes!
comptime {
    const test_input = "abc";
    const expected = hex_decode("4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45");
    const actual = keccak256(test_input);
    if (!std.mem.eql(u8, &expected, &actual)) {
        @compileError("Keccak256 implementation incorrect - using SHA3 instead?");
    }
}
```

### Address Derivation
```zig
pub fn derive_address(public_key: [64]u8) [20]u8 {
    const hash = keccak256(&public_key);
    var address: [20]u8 = undefined;
    @memcpy(&address, hash[12..32]); // Last 20 bytes
    return address;
}

pub fn derive_contract_address(deployer: [20]u8, nonce: u64) [20]u8 {
    // RLP encode (deployer_address, nonce)
    const rlp_encoded = rlp_encode_address_nonce(deployer, nonce);
    const hash = keccak256(rlp_encoded);
    var address: [20]u8 = undefined;
    @memcpy(&address, hash[12..32]);
    return address;
}
```

## ECDSA Signature Operations

### Signature Recovery (FUND SAFETY CRITICAL)
```zig
pub fn recover_public_key(
    message_hash: [32]u8,
    signature: [65]u8, // r(32) + s(32) + v(1)
) !?[64]u8 {
    const r = signature[0..32];
    const s = signature[32..64];
    const v = signature[64];

    // CRITICAL: Validate signature components
    if (!is_valid_signature_component(r, s, v)) {
        return null;
    }

    // EIP-2: Reject malleable signatures (high s values)
    if (is_malleable_signature(s)) {
        return null;
    }

    // Recovery ID must be 0, 1, 2, or 3
    if (v < 27 or v > 30) {
        return null;
    }

    const recovery_id = v - 27;
    return secp256k1.recover_public_key(message_hash, r, s, recovery_id);
}
```

### Signature Validation
```zig
pub fn verify_signature(
    message_hash: [32]u8,
    signature: [65]u8,
    expected_address: [20]u8,
) !bool {
    const public_key = recover_public_key(message_hash, signature) orelse return false;
    const derived_address = derive_address(public_key);
    return std.mem.eql(u8, &derived_address, &expected_address);
}

// CRITICAL: Prevent signature malleability (EIP-2)
fn is_malleable_signature(s: []const u8) bool {
    // s must be <= curve_order / 2 to prevent malleability
    const half_curve_order = secp256k1.CURVE_ORDER / 2;
    return bytes_to_uint256(s) > half_curve_order;
}
```

## BN254 Curve Operations (EIP-196/197)

### Point Validation
```zig
pub fn validate_bn254_point(x: u256, y: u256) bool {
    // Point must be on curve: y² = x³ + 3
    const x_cubed = modular_pow(x, 3, BN254_FIELD_MODULUS);
    const y_squared = modular_pow(y, 2, BN254_FIELD_MODULUS);
    const rhs = add_mod(x_cubed, 3, BN254_FIELD_MODULUS);
    return y_squared == rhs;
}
```

### Precompile Operations
```zig
pub fn bn254_add(point1: G1Point, point2: G1Point) !G1Point {
    if (!validate_bn254_point(point1.x, point1.y) or
        !validate_bn254_point(point2.x, point2.y)) {
        return CryptoError.InvalidPoint;
    }

    // Elliptic curve point addition
    return ec_add_g1(point1, point2);
}

pub fn bn254_scalar_mul(point: G1Point, scalar: u256) !G1Point {
    if (!validate_bn254_point(point.x, point.y)) {
        return CryptoError.InvalidPoint;
    }

    // Scalar must be in field
    if (scalar >= BN254_CURVE_ORDER) {
        return CryptoError.InvalidScalar;
    }

    return ec_scalar_mul_g1(point, scalar);
}
```

## Modular Exponentiation (EIP-198)

### Big Integer Arithmetic
```zig
pub fn mod_exp(base: []const u8, exponent: []const u8, modulus: []const u8) ![]u8 {
    // Handle edge cases
    if (modulus.len == 0 or (modulus.len == 1 and modulus[0] == 0)) {
        return CryptoError.InvalidModulus;
    }

    if (modulus.len == 1 and modulus[0] == 1) {
        return &[_]u8{0}; // Any number mod 1 is 0
    }

    // Use sliding window exponentiation for performance
    return sliding_window_mod_exp(base, exponent, modulus);
}
```

### Gas Cost Calculation
```zig
pub fn calculate_mod_exp_gas(
    base_len: u32,
    exp_len: u32,
    mod_len: u32,
    exponent: []const u8,
) u64 {
    const max_len = @max(@max(base_len, exp_len), mod_len);
    const complexity = max_len * max_len / 4; // Simplified

    const iteration_count = calculate_iteration_count(exp_len, exponent);
    return @max(200, complexity * iteration_count / 3);
}
```

## Constant-Time Operations

### Side-Channel Resistance
```zig
// CRITICAL: All cryptographic operations must be constant-time
pub fn constant_time_compare(a: []const u8, b: []const u8) bool {
    if (a.len != b.len) return false;

    var result: u8 = 0;
    for (a, b) |byte_a, byte_b| {
        result |= byte_a ^ byte_b;
    }

    return result == 0;
}

// CRITICAL: Conditional assignment must be constant-time
pub fn constant_time_select(condition: bool, if_true: u256, if_false: u256) u256 {
    const mask = @as(u256, @intFromBool(condition)) - 1; // 0x0000... or 0xFFFF...
    return (if_true & mask) | (if_false & ~mask);
}
```

### Secure Memory Handling
```zig
pub fn secure_zero_memory(buffer: []u8) void {
    // Prevent compiler optimization of memory clearing
    @memset(buffer, 0);
    std.crypto.utils.secureZero(u8, buffer);
}

pub fn secure_random_bytes(buffer: []u8) !void {
    std.crypto.random.bytes(buffer);
}
```

## Hash-Based Operations

### Merkle Tree Operations
```zig
pub fn merkle_hash(left: [32]u8, right: [32]u8) [32]u8 {
    var combined: [64]u8 = undefined;
    @memcpy(combined[0..32], &left);
    @memcpy(combined[32..64], &right);
    return keccak256(&combined);
}

pub fn compute_merkle_root(leaves: []const [32]u8) [32]u8 {
    if (leaves.len == 0) return EMPTY_MERKLE_ROOT;
    if (leaves.len == 1) return leaves[0];

    var current_level = try allocator.dupe([32]u8, leaves);
    defer allocator.free(current_level);

    while (current_level.len > 1) {
        const next_len = (current_level.len + 1) / 2;
        const next_level = try allocator.alloc([32]u8, next_len);
        defer allocator.free(next_level);

        for (0..next_len) |i| {
            const left = current_level[i * 2];
            const right = if (i * 2 + 1 < current_level.len)
                current_level[i * 2 + 1] else left; // Duplicate if odd
            next_level[i] = merkle_hash(left, right);
        }

        current_level = next_level;
    }

    return current_level[0];
}
```

## Performance Optimization

### Hardware Acceleration
```zig
// Use hardware acceleration when available
pub fn optimized_keccak256(data: []const u8) [32]u8 {
    if (comptime std.Target.current.cpu.arch.isX86()) {
        if (std.crypto.core.aes.has_hardware_support) {
            return hardware_keccak256(data);
        }
    }
    return software_keccak256(data);
}
```

### Batch Operations
```zig
pub fn batch_verify_signatures(
    messages: []const [32]u8,
    signatures: []const [65]u8,
    expected_addresses: []const [20]u8,
) ![]bool {
    std.debug.assert(messages.len == signatures.len);
    std.debug.assert(messages.len == expected_addresses.len);

    var results = try allocator.alloc(bool, messages.len);
    errdefer allocator.free(results);

    // TODO: Implement batch signature verification for better performance
    for (messages, signatures, expected_addresses, 0..) |msg, sig, addr, i| {
        results[i] = try verify_signature(msg, sig, addr);
    }

    return results;
}
```

## Testing Requirements

### Unit Tests MUST Cover
- All hash function test vectors
- ECDSA signature recovery edge cases
- BN254 point validation and operations
- Modular exponentiation with large numbers
- Constant-time operation verification

### Security Testing
- Side-channel resistance validation
- Timing attack prevention
- Memory safety in cryptographic operations
- Invalid input rejection

### Compliance Testing
- EIP test vectors for all precompiles
- Cross-reference with reference implementations
- Fuzzing with random cryptographic inputs

## Critical Error Handling

### Cryptographic Failures
```zig
pub const CryptoError = error{
    InvalidSignature,
    InvalidPublicKey,
    InvalidPoint,
    InvalidScalar,
    InvalidModulus,
    HashFailure,
    MemoryAllocationFailed,
};
```

### Secure Error Propagation
```zig
// NEVER leak timing information in error paths
pub fn secure_verify_with_timing_protection(
    message: [32]u8,
    signature: [65]u8,
    address: [20]u8,
) !bool {
    const start_time = std.time.nanoTimestamp();
    defer {
        // Ensure constant execution time regardless of success/failure
        const end_time = std.time.nanoTimestamp();
        const target_duration = 1_000_000; // 1ms
        const actual_duration = @intCast(u64, end_time - start_time);
        if (actual_duration < target_duration) {
            const sleep_time = target_duration - actual_duration;
            std.time.sleep(sleep_time);
        }
    }

    return verify_signature(message, signature, address);
}
```

## Emergency Procedures

### Cryptographic Vulnerability Discovery
1. **Immediate Assessment**: Determine scope and exploitability
2. **System Isolation**: Disable affected cryptographic operations
3. **Security Audit**: Review all related cryptographic code
4. **Coordinated Disclosure**: Follow responsible disclosure process
5. **Patch Development**: Implement fix with security review
6. **Comprehensive Testing**: Validate fix doesn't introduce new issues

### Side-Channel Attack Detection
1. **Timing Analysis**: Monitor execution time variations
2. **Power Analysis**: Check for differential power consumption
3. **Cache Analysis**: Validate constant-time memory access patterns
4. **Mitigation Implementation**: Add timing protections and blinding

Remember: **Cryptographic security is non-negotiable.** Any weakness in cryptographic operations can be exploited to steal funds or compromise the entire system. Always use well-tested libraries, implement proper side-channel protections, and validate all inputs rigorously.