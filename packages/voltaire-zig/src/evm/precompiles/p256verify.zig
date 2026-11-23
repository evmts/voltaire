//! EIP-7951 P256VERIFY precompile (0x0100, Osaka+).
//!
//! ECDSA signature verification over secp256r1 (NIST P-256) against a raw
//! 32-byte digest. Mirrors `ethereum/execution-specs`
//! `osaka/vm/precompiled_contracts/p256verify.py`:
//! - Fixed gas cost: 6900 (`error.OutOfGas` when `gas_limit < 6900`).
//! - Strict 160-byte input: `h(32) || r(32) || s(32) || qx(32) || qy(32)`.
//! - Valid signature returns 32 bytes `0x00..01`.
//! - Any malformed length, invalid scalar/point encoding, or invalid signature
//!   returns empty output (0 bytes) with `gas_used = 6900` (never reverts).
//! - High-s signatures (`n/2 < s < n`), `h ≡ 0 (mod n)`, and `R.x >= n`
//!   (`R.x mod n == r`) are all accepted per EIP-7951.
//!
//! https://eips.ethereum.org/EIPS/eip-7951
const std = @import("std");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

const P256 = std.crypto.ecc.P256;
const Fe = P256.Fe;
const Scalar = P256.scalar.Scalar;

/// Fixed gas cost for P256VERIFY precompile (EIP-7951)
pub const GAS: u64 = 6900;

/// EIP-7951 spec-named alias of `GAS`
pub const P256VERIFY_GAS: u64 = GAS;

/// Exact input length: h(32) || r(32) || s(32) || qx(32) || qy(32)
pub const INPUT_LENGTH: usize = 160;

/// Output length for a valid signature: 32-byte big-endian 1
pub const OUTPUT_LENGTH: usize = 32;

/// Reduce a 32-byte big-endian integer modulo the curve order `n`.
fn reduceToScalar(bytes: [32]u8) Scalar {
    var wide = [_]u8{0} ** 48;
    @memcpy(wide[16..], &bytes);
    return Scalar.fromBytes48(wide, .big);
}

/// Verify an EIP-7951 secp256r1 ECDSA payload (`h || r || s || qx || qy`).
///
/// `std.crypto.sign.ecdsa` is intentionally not used because its verifier
/// rejects `h ≡ 0 (mod n)`, which EIP-7951 accepts. Every input is public, so
/// variable-time curve arithmetic is appropriate.
pub fn verify(input: []const u8) bool {
    if (input.len != INPUT_LENGTH) return false;

    // 1. Signature scalars: 0 < r < n and 0 < s < n (no low-s restriction).
    //    Scalar.fromBytes rejects values >= n.
    const r = Scalar.fromBytes(input[32..64].*, .big) catch return false;
    const s = Scalar.fromBytes(input[64..96].*, .big) catch return false;
    if (r.isZero() or s.isZero()) return false;

    // 2. Public key field bounds: 0 <= qx < p and 0 <= qy < p.
    //    Fe.fromBytes rejects non-canonical values >= p.
    const qx = Fe.fromBytes(input[96..128].*, .big) catch return false;
    const qy = Fe.fromBytes(input[128..160].*, .big) catch return false;

    // 3. Reject point at infinity encoding (0, 0).
    if (qx.isZero() and qy.isZero()) return false;

    // 4. Verify secp256r1 curve equation y^2 = x^3 - 3x + b (mod p) explicitly
    //    (also rejects the affine identity artifact (0, 1)) and reject identity.
    const rhs = qx.sq().mul(qx).sub(qx).sub(qx).sub(qx).add(P256.B);
    if (!qy.sq().equivalent(rhs)) return false;
    const q = P256.fromAffineCoordinates(.{ .x = qx, .y = qy }) catch return false;
    q.rejectIdentity() catch return false;

    // 5. Compute u_1 = h * s^-1 (mod n), u_2 = r * s^-1 (mod n), R = u_1*G + u_2*Q.
    //    h is used as a raw 32-byte integer (never re-hashed); h ≡ 0 (mod n) is valid.
    const h = reduceToScalar(input[0..32].*);
    const s_inv = s.invert();
    const u_1 = h.mul(s_inv).toBytes(.little);
    const u_2 = r.mul(s_inv).toBytes(.little);

    // mulDoubleBasePublic handles u_1 == 0 and rejects an identity result R = O.
    const point = P256.basePoint.mulDoubleBasePublic(u_1, q, u_2, .little) catch return false;

    // 6. Accept iff R.x mod n == r (handles R.x >= n, i.e., R.x == r + n).
    const x_mod_n = reduceToScalar(point.affineCoordinates().x.toBytes(.big));
    return x_mod_n.equivalent(r);
}

/// 0x0100: P256VERIFY - EIP-7951 secp256r1 ECDSA verification (Osaka+)
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult {
    if (gas_limit < GAS) {
        return error.OutOfGas;
    }

    if (!verify(input)) {
        return PrecompileResult{
            .output = try allocator.alloc(u8, 0),
            .gas_used = GAS,
        };
    }

    const output = try allocator.alloc(u8, OUTPUT_LENGTH);
    @memset(output, 0);
    output[OUTPUT_LENGTH - 1] = 1;
    return PrecompileResult{
        .output = output,
        .gas_used = GAS,
    };
}

// ============================================================================
// Tests
// ============================================================================

const testing = std.testing;

const P: u256 = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff;
const N: u256 = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551;
const MAX: u256 = std.math.maxInt(u256);

// Reference vector shared with TypeScript tests
const H: u256 = 0xa82b78501f418ef01de9d97e884bd8fe66aa6fd438d585d5cb7fa88db3f21a40;
const R: u256 = 0x471c3e758c4904285bba7e53118ed0f524adeb0757d25bd2f8e7b0d76dfa714c;
const S_LOW: u256 = 0x091c7ae3b0636fa73f8300d67e54865d204c5487c7fe83dd1d67b0c249c433be;
const S_HIGH: u256 = N - S_LOW;
const QX: u256 = 0x60fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6;
const QY: u256 = 0x7903fe1008b8bc99a41ae9e95628bc64f2f1b20c2d7e9f5177a3c294d4462299;

// Signatures by the same key over h = 0 and h = 2^256 - 1
const S_HASH_ZERO: u256 = 0x7eec549ecb64d21ec59e76f8c3a92a9e30060e845c4c12967c4d30d29382af87;
const S_HASH_MAX: u256 = 0x97ac5dc2d435b3f42c69d1c33dfc818b0d251e267dd6dd49583c836bb105be39;

// Point with x = n + 3 >= n on secp256r1 (exercises R.x mod n == r when R.x >= n)
const X_GE_N: u256 = N + 3;
const Y_FOR_X_GE_N: u256 = 0x484f0c0fda434ef0a808458914f328715d7a545e198ac7eee31dffe861b5d23f;

// (0, sqrt(b)) is on secp256r1 (x == 0 but not infinity)
const SQRT_B: u256 = 0x66485c780e2f83d72433bd5d84a06bb6541c2af31dae871728bf856a174f93f4;

fn encode(h: u256, r: u256, s: u256, qx: u256, qy: u256) [INPUT_LENGTH]u8 {
    var out: [INPUT_LENGTH]u8 = undefined;
    std.mem.writeInt(u256, out[0..32], h, .big);
    std.mem.writeInt(u256, out[32..64], r, .big);
    std.mem.writeInt(u256, out[64..96], s, .big);
    std.mem.writeInt(u256, out[96..128], qx, .big);
    std.mem.writeInt(u256, out[128..160], qy, .big);
    return out;
}

fn expectValid(input: []const u8) !void {
    const result = try execute(testing.allocator, input, GAS);
    defer result.deinit(testing.allocator);
    try testing.expectEqual(GAS, result.gas_used);
    const expected = [_]u8{0} ** 31 ++ [_]u8{1};
    try testing.expectEqualSlices(u8, &expected, result.output);
}

fn expectInvalid(input: []const u8) !void {
    const result = try execute(testing.allocator, input, GAS);
    defer result.deinit(testing.allocator);
    try testing.expectEqual(GAS, result.gas_used);
    try testing.expectEqual(@as(usize, 0), result.output.len);
}

test "P256VERIFY - constants" {
    try testing.expectEqual(@as(u64, 6900), GAS);
    try testing.expectEqual(@as(u64, 6900), P256VERIFY_GAS);
    try testing.expectEqual(@as(usize, 160), INPUT_LENGTH);
    try testing.expectEqual(@as(usize, 32), OUTPUT_LENGTH);
}

test "P256VERIFY - valid low-s and high-s signatures" {
    try testing.expect(S_LOW <= N / 2);
    try testing.expect(S_HIGH > N / 2);
    try expectValid(&encode(H, R, S_LOW, QX, QY));
    try expectValid(&encode(H, R, S_HIGH, QX, QY));
}

test "P256VERIFY - hash edge cases (h = 0, h = n, h = max, raw integer no re-hashing)" {
    try expectValid(&encode(0, R, S_HASH_ZERO, QX, QY));
    try expectValid(&encode(N, R, S_HASH_ZERO, QX, QY));
    try expectValid(&encode(0, R, N - S_HASH_ZERO, QX, QY));
    try expectValid(&encode(MAX, R, S_HASH_MAX, QX, QY));

    // h and h + n verify identically when h + n < 2^256
    const gx = P256.basePoint.x.toInt();
    const gy = P256.basePoint.y.toInt();
    const small_h: u256 = 0x1234;
    const s_val: u256 = (small_h + gx) % N;
    try expectValid(&encode(small_h, gx, s_val, gx, gy));
    try expectValid(&encode(small_h + N, gx, s_val, gx, gy));
}

test "P256VERIFY - R.x >= n reduces modulo n (R.x == r + n)" {
    // With h ≡ 0 (mod n) and r = s = 3, R = Q with Q.x = n + 3 => R.x mod n == 3.
    try expectValid(&encode(0, 3, 3, X_GE_N, Y_FOR_X_GE_N));
    try expectValid(&encode(N, 3, 3, X_GE_N, Y_FOR_X_GE_N));
    try expectValid(&encode(0, 3, N - 3, X_GE_N, Y_FOR_X_GE_N));
}

test "P256VERIFY - on-curve public key with qx = 0" {
    const q = try P256.fromAffineCoordinates(.{
        .x = Fe.zero,
        .y = try Fe.fromInt(SQRT_B),
    });
    const r_pt = P256.basePoint.add(q).affineCoordinates();
    const r_val: u256 = r_pt.x.toInt() % N;
    try expectValid(&encode(r_val, r_val, r_val, 0, SQRT_B));
}

test "P256VERIFY - invalid lengths return empty output and charge 6900 gas" {
    const valid = encode(H, R, S_LOW, QX, QY);
    try expectInvalid(&.{});
    try expectInvalid(valid[0..1]);
    try expectInvalid(valid[0..159]);
    var long = [_]u8{0} ** 161;
    @memcpy(long[0..160], &valid);
    try expectInvalid(&long);
}

test "P256VERIFY - invalid scalars, field elements, infinity, off-curve, and R = O" {
    for ([_]u256{ 0, N, N + 1, MAX }) |bad| {
        try expectInvalid(&encode(H, bad, S_LOW, QX, QY));
        try expectInvalid(&encode(H, R, bad, QX, QY));
    }
    for ([_]u256{ P, P + 1, MAX }) |bad_fe| {
        try expectInvalid(&encode(H, R, S_LOW, bad_fe, QY));
        try expectInvalid(&encode(H, R, S_LOW, QX, bad_fe));
    }
    // Point at infinity (0, 0) and affine identity (0, 1)
    try expectInvalid(&encode(H, R, S_LOW, 0, 0));
    try expectInvalid(&encode(H, R, S_LOW, 0, 1));
    // Off-curve point
    try expectInvalid(&encode(H, R, S_LOW, QX, (QY + 1) % P));
    // Wrong hash / r / s
    try expectInvalid(&encode(H ^ 1, R, S_LOW, QX, QY));
    try expectInvalid(&encode(H, R ^ 1, S_LOW, QX, QY));
    try expectInvalid(&encode(H, R, S_LOW ^ 1, QX, QY));
    // Recovered point at infinity: Q = G, h = n - 1, r = 1, s = 1 => -G + G = O
    const gx = P256.basePoint.x.toInt();
    const gy = P256.basePoint.y.toInt();
    try expectInvalid(&encode(N - 1, 1, 1, gx, gy));
}

test "P256VERIFY - out of gas checked before input validation" {
    const valid = encode(H, R, S_LOW, QX, QY);
    try testing.expectError(error.OutOfGas, execute(testing.allocator, &valid, GAS - 1));
    try testing.expectError(error.OutOfGas, execute(testing.allocator, &.{}, GAS - 1));
    try testing.expectError(error.OutOfGas, execute(testing.allocator, &.{}, 0));
    // Extra gas still reports 6900 gas used
    const res = try execute(testing.allocator, &valid, 100_000);
    defer res.deinit(testing.allocator);
    try testing.expectEqual(GAS, res.gas_used);
}

test "P256VERIFY - 782 official go-ethereum / Wycheproof conformance vectors" {
    const vectors = @embedFile("p256verify_vectors.txt");
    var lines = std.mem.splitScalar(u8, vectors, '\n');
    var total: usize = 0;
    var valid_count: usize = 0;
    var invalid_count: usize = 0;

    while (lines.next()) |raw_line| {
        const line = std.mem.trim(u8, raw_line, " \t\r");
        if (line.len == 0 or line[0] == '#') continue;

        const sep = std.mem.indexOfScalar(u8, line, ' ') orelse return error.InvalidVectorFormat;
        const hex_input = line[0..sep];
        const expected_flag = line[sep + 1 ..];

        var input_buf: [256]u8 = undefined;
        const input = try std.fmt.hexToBytes(input_buf[0 .. hex_input.len / 2], hex_input);

        if (std.mem.eql(u8, expected_flag, "1")) {
            try expectValid(input);
            valid_count += 1;
        } else if (std.mem.eql(u8, expected_flag, "0")) {
            try expectInvalid(input);
            invalid_count += 1;
        } else {
            return error.InvalidVectorFormat;
        }
        total += 1;
    }

    try testing.expectEqual(@as(usize, 782), total);
    try testing.expect(valid_count > 0);
    try testing.expect(invalid_count > 0);
}
