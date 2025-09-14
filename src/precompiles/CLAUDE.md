# CLAUDE.md - Precompiles Module AI Context

## MISSION CRITICAL: Precompiled Contract Security

EVM precompiles provide optimized implementations of cryptographic and utility functions. **ANY bug in precompile implementations can enable consensus attacks, fund theft, or system compromise.** Precompiles must match reference implementations exactly.

## Critical Implementation Details

### Precompile Address Space (IMMUTABLE)

**0x01**: ECDSA signature recovery (ecrecover)
**0x02**: SHA-256 hash function
**0x03**: RIPEMD-160 hash function
**0x04**: Identity function (data copy)
**0x05**: Modular exponentiation (EIP-198)
**0x06**: BN254 elliptic curve addition (EIP-196)
**0x07**: BN254 elliptic curve scalar multiplication (EIP-196)
**0x08**: BN254 bilinear pairing check (EIP-197)
**0x09**: BLAKE2F compression function (EIP-152)

### Gas Cost Validation (CONSENSUS CRITICAL)

Each precompile has specific gas cost formulas that MUST be implemented exactly as specified in the respective EIPs. Incorrect gas costs can lead to DoS attacks or consensus failures.

## Precompile 0x01: ECRECOVER

### Signature Recovery Implementation
```zig
pub fn ecrecover(input: []const u8) !PrecompileResult {
    if (input.len != 128) {
        return PrecompileResult{
            .success = false,
            .output = &[_]u8{},
            .gas_used = 3000, // Base gas cost
        };
    }

    const message_hash = input[0..32];
    const v_bytes = input[32..64];
    const r_bytes = input[64..96];
    const s_bytes = input[96..128];

    // Extract v, r, s values
    const v = bytes_to_uint256(v_bytes.*);
    const r = bytes_to_uint256(r_bytes.*);
    const s = bytes_to_uint256(s_bytes.*);

    // CRITICAL: Validate signature parameters
    if (v != 27 and v != 28) return invalid_result();
    if (r == 0 or r >= SECP256K1_N) return invalid_result();
    if (s == 0 or s >= SECP256K1_N) return invalid_result();

    // EIP-2: Reject malleable signatures
    if (s > SECP256K1_N / 2) return invalid_result();

    // Recover public key
    const public_key = crypto.recover_public_key(
        message_hash.*,
        r, s, v - 27
    ) orelse return invalid_result();

    // Derive Ethereum address
    const address = crypto.derive_address(public_key);

    var output: [32]u8 = [_]u8{0} ** 32;
    @memcpy(output[12..32], &address); // Right-padded

    return PrecompileResult{
        .success = true,
        .output = output,
        .gas_used = 3000,
    };
}
```

## Precompile 0x05: MODEXP (EIP-198)

### Gas Cost Calculation (CRITICAL)
```zig
pub fn modexp_gas_cost(input: []const u8) u64 {
    if (input.len < 96) return 0; // Invalid input

    const base_len = bytes_to_uint256(input[0..32]);
    const exp_len = bytes_to_uint256(input[32..64]);
    const mod_len = bytes_to_uint256(input[64..96]);

    // Extract exponent bytes for iteration count
    const exp_start = 96 + base_len;
    const exp_bytes = if (exp_start + exp_len <= input.len)
        input[exp_start..exp_start + exp_len] else &[_]u8{};

    const max_len = @max(@max(base_len, exp_len), mod_len);
    const complexity = calculate_complexity(max_len);
    const iteration_count = calculate_iteration_count(exp_len, exp_bytes);

    return @max(200, complexity * iteration_count / 3);
}

fn calculate_iteration_count(exp_len: u64, exp_bytes: []const u8) u64 {
    if (exp_len <= 32 and exp_bytes.len > 0) {
        // Count bits in exponent
        const exp_uint = bytes_to_uint256(exp_bytes);
        return if (exp_uint == 0) 0 else 256 - @clz(exp_uint);
    } else if (exp_len > 32) {
        // For large exponents, use approximation
        return 8 * (@max(exp_len, 1) - 32) +
               calculate_iteration_count(32, exp_bytes[0..@min(32, exp_bytes.len)]);
    }
    return 0;
}
```

### Modular Exponentiation Implementation
```zig
pub fn modexp(input: []const u8) !PrecompileResult {
    const gas_cost = modexp_gas_cost(input);

    if (input.len < 96) {
        return PrecompileResult{
            .success = true,
            .output = &[_]u8{0}, // Empty result
            .gas_used = gas_cost,
        };
    }

    // Parse input parameters
    const base_len = bytes_to_uint256(input[0..32]);
    const exp_len = bytes_to_uint256(input[32..64]);
    const mod_len = bytes_to_uint256(input[64..96]);

    // Extract base, exponent, modulus
    const base = extract_bytes(input, 96, base_len);
    const exponent = extract_bytes(input, 96 + base_len, exp_len);
    const modulus = extract_bytes(input, 96 + base_len + exp_len, mod_len);

    // Handle edge cases
    if (modulus.len == 0) {
        return PrecompileResult{
            .success = true,
            .output = try allocator.alloc(u8, mod_len),
            .gas_used = gas_cost,
        };
    }

    // Perform modular exponentiation
    const result = try crypto.mod_exp(base, exponent, modulus);
    defer allocator.free(result);

    // Pad result to mod_len bytes
    var output = try allocator.alloc(u8, mod_len);
    @memset(output, 0);
    const copy_len = @min(result.len, mod_len);
    @memcpy(output[mod_len - copy_len..], result[result.len - copy_len..]);

    return PrecompileResult{
        .success = true,
        .output = output,
        .gas_used = gas_cost,
    };
}
```

## Precompile 0x06-0x08: BN254 Operations

### Point Validation (CONSENSUS CRITICAL)
```zig
pub fn validate_g1_point(x: u256, y: u256) bool {
    // Check if point is on curve: y² = x³ + 3 (mod p)
    if (x >= BN254_FIELD_MODULUS or y >= BN254_FIELD_MODULUS) {
        return false;
    }

    // Point at infinity is represented as (0, 0) and is valid
    if (x == 0 and y == 0) return true;

    const x_cubed = mod_pow(x, 3, BN254_FIELD_MODULUS);
    const rhs = add_mod(x_cubed, 3, BN254_FIELD_MODULUS);
    const y_squared = mod_pow(y, 2, BN254_FIELD_MODULUS);

    return y_squared == rhs;
}

pub fn validate_g2_point(x: [2]u256, y: [2]u256) bool {
    // G2 point validation over Fp2
    // More complex validation for extension field
    return validate_g2_point_fp2(x, y);
}
```

### BN254 Addition (0x06)
```zig
pub fn bn254_add(input: []const u8) !PrecompileResult {
    const GAS_COST = 150;

    if (input.len != 128) {
        return invalid_precompile_result(GAS_COST);
    }

    // Parse input points
    const x1 = bytes_to_uint256(input[0..32]);
    const y1 = bytes_to_uint256(input[32..64]);
    const x2 = bytes_to_uint256(input[64..96]);
    const y2 = bytes_to_uint256(input[96..128]);

    // Validate points are on curve
    if (!validate_g1_point(x1, y1) or !validate_g1_point(x2, y2)) {
        return invalid_precompile_result(GAS_COST);
    }

    // Perform elliptic curve addition
    const result = crypto.bn254_add(.{ .x = x1, .y = y1 }, .{ .x = x2, .y = y2 });

    var output: [64]u8 = undefined;
    uint256_to_bytes(result.x, output[0..32]);
    uint256_to_bytes(result.y, output[32..64]);

    return PrecompileResult{
        .success = true,
        .output = output,
        .gas_used = GAS_COST,
    };
}
```

### BN254 Pairing Check (0x08)
```zig
pub fn bn254_pairing_check(input: []const u8) !PrecompileResult {
    const BASE_GAS = 45000;
    const PAIR_GAS = 34000;

    // Input must be multiple of 192 bytes (6 * 32)
    if (input.len % 192 != 0) {
        return invalid_precompile_result(BASE_GAS);
    }

    const pair_count = input.len / 192;
    const gas_cost = BASE_GAS + PAIR_GAS * pair_count;

    var pairs = try allocator.alloc(PairingPair, pair_count);
    defer allocator.free(pairs);

    // Parse and validate all pairs
    for (0..pair_count) |i| {
        const offset = i * 192;
        const pair_input = input[offset..offset + 192];

        // Parse G1 point (64 bytes)
        const g1_x = bytes_to_uint256(pair_input[0..32]);
        const g1_y = bytes_to_uint256(pair_input[32..64]);

        // Parse G2 point (128 bytes) - complex number representation
        const g2_x = [2]u256{
            bytes_to_uint256(pair_input[64..96]),   // x.im
            bytes_to_uint256(pair_input[96..128]),  // x.re
        };
        const g2_y = [2]u256{
            bytes_to_uint256(pair_input[128..160]), // y.im
            bytes_to_uint256(pair_input[160..192]), // y.re
        };

        // Validate points
        if (!validate_g1_point(g1_x, g1_y) or !validate_g2_point(g2_x, g2_y)) {
            return invalid_precompile_result(gas_cost);
        }

        pairs[i] = PairingPair{
            .g1 = .{ .x = g1_x, .y = g1_y },
            .g2 = .{ .x = g2_x, .y = g2_y },
        };
    }

    // Perform pairing check: e(p1, q1) * e(p2, q2) * ... == 1
    const result = crypto.bn254_pairing_check(pairs);

    var output: [32]u8 = [_]u8{0} ** 32;
    output[31] = if (result) 1 else 0;

    return PrecompileResult{
        .success = true,
        .output = output,
        .gas_used = gas_cost,
    };
}
```

## Precompile 0x09: BLAKE2F

### Compression Function Implementation
```zig
pub fn blake2f(input: []const u8) !PrecompileResult {
    if (input.len != 213) {
        return invalid_precompile_result(0);
    }

    // Parse input
    const rounds = bytes_to_uint32(input[0..4]);
    const h = input[4..68];        // 64 bytes
    const m = input[68..196];      // 128 bytes
    const t = input[196..212];     // 16 bytes
    const f = input[212];          // 1 byte

    // Validate final flag
    if (f != 0 and f != 1) {
        return invalid_precompile_result(0);
    }

    const gas_cost = rounds;

    // Perform BLAKE2F compression
    const result = crypto.blake2f_compress(rounds, h, m, t, f == 1);

    return PrecompileResult{
        .success = true,
        .output = result, // 64 bytes
        .gas_used = gas_cost,
    };
}
```

## Error Handling and Edge Cases

### Invalid Input Handling
```zig
fn invalid_precompile_result(gas_cost: u64) PrecompileResult {
    return PrecompileResult{
        .success = false,
        .output = &[_]u8{},
        .gas_used = gas_cost,
    };
}

// CRITICAL: Always consume gas even on failure
pub fn safe_execute_precompile(address: u8, input: []const u8, gas_limit: u64) !PrecompileResult {
    const result = switch (address) {
        0x01 => ecrecover(input),
        0x02 => sha256_hash(input),
        0x03 => ripemd160_hash(input),
        0x04 => identity_copy(input),
        0x05 => modexp(input),
        0x06 => bn254_add(input),
        0x07 => bn254_scalar_mul(input),
        0x08 => bn254_pairing_check(input),
        0x09 => blake2f(input),
        else => return PrecompileError.InvalidAddress,
    } catch |err| return PrecompileResult{
        .success = false,
        .output = &[_]u8{},
        .gas_used = estimate_failure_gas_cost(address, input.len),
    };

    // Ensure gas limit is not exceeded
    if (result.gas_used > gas_limit) {
        return PrecompileError.OutOfGas;
    }

    return result;
}
```

## Testing Requirements

### Unit Tests MUST Cover
- All precompiles with valid inputs
- Invalid input handling for each precompile
- Edge cases (empty inputs, maximum values)
- Gas cost calculations for various input sizes
- Cross-validation with reference implementations

### EIP Compliance Tests
- Official test vectors from EIP specifications
- Gas cost validation against reference implementations
- Edge case behavior matching

### Security Tests
- Malformed input fuzzing
- Large input handling
- Memory exhaustion prevention
- Timing attack resistance

## Performance Optimization

### Batch Operations
```zig
pub fn batch_ecrecover(inputs: [][]const u8) ![]PrecompileResult {
    var results = try allocator.alloc(PrecompileResult, inputs.len);
    errdefer allocator.free(results);

    // Could optimize with batch signature verification
    for (inputs, 0..) |input, i| {
        results[i] = try ecrecover(input);
    }

    return results;
}
```

### Memory Pooling
```zig
var precompile_arena: std.heap.ArenaAllocator = undefined;

pub fn init_precompile_memory() void {
    precompile_arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
}

pub fn reset_precompile_memory() void {
    _ = precompile_arena.reset(.retain_capacity);
}
```

## Emergency Procedures

### Precompile Bug Discovery
1. **Immediate Disable**: Disable affected precompile calls
2. **Impact Assessment**: Determine potential fund exposure
3. **Reference Validation**: Compare with other implementations
4. **Fix Development**: Implement minimal, targeted fix
5. **Comprehensive Testing**: Validate against all test vectors

### Performance Regression
1. **Benchmark Analysis**: Identify performance bottlenecks
2. **Gas Cost Review**: Ensure gas costs still prevent DoS
3. **Optimization**: Improve performance while maintaining correctness
4. **Validation**: Test performance and correctness thoroughly

Remember: **Precompiles are consensus-critical infrastructure.** Any deviation from specification can cause network splits or enable attacks. Always prioritize exact specification compliance over performance optimizations.