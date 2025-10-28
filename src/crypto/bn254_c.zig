const std = @import("std");
const bn254 = @import("bn254.zig");

// C ABI exports for BN254 operations (WebAssembly and FFI)

// ============================================================================
// G1 Operations
// ============================================================================

export fn bn254_g1_generator(out_x: *u256, out_y: *u256, out_z: *u256) void {
    const gen = bn254.G1.GENERATOR;
    out_x.* = gen.x.value;
    out_y.* = gen.y.value;
    out_z.* = gen.z.value;
}

export fn bn254_g1_infinity(out_x: *u256, out_y: *u256, out_z: *u256) void {
    const inf = bn254.G1.INFINITY;
    out_x.* = inf.x.value;
    out_y.* = inf.y.value;
    out_z.* = inf.z.value;
}

export fn bn254_g1_add(
    x1: u256,
    y1: u256,
    z1: u256,
    x2: u256,
    y2: u256,
    z2: u256,
    out_x: *u256,
    out_y: *u256,
    out_z: *u256,
) void {
    const p1 = bn254.G1{
        .x = bn254.FpMont.init(x1),
        .y = bn254.FpMont.init(y1),
        .z = bn254.FpMont.init(z1),
    };
    const p2 = bn254.G1{
        .x = bn254.FpMont.init(x2),
        .y = bn254.FpMont.init(y2),
        .z = bn254.FpMont.init(z2),
    };
    const result = p1.add(&p2);
    out_x.* = result.x.value;
    out_y.* = result.y.value;
    out_z.* = result.z.value;
}

export fn bn254_g1_double(x: u256, y: u256, z: u256, out_x: *u256, out_y: *u256, out_z: *u256) void {
    const p = bn254.G1{
        .x = bn254.FpMont.init(x),
        .y = bn254.FpMont.init(y),
        .z = bn254.FpMont.init(z),
    };
    const result = p.double();
    out_x.* = result.x.value;
    out_y.* = result.y.value;
    out_z.* = result.z.value;
}

export fn bn254_g1_negate(x: u256, y: u256, z: u256, out_x: *u256, out_y: *u256, out_z: *u256) void {
    const p = bn254.G1{
        .x = bn254.FpMont.init(x),
        .y = bn254.FpMont.init(y),
        .z = bn254.FpMont.init(z),
    };
    const result = p.neg();
    out_x.* = result.x.value;
    out_y.* = result.y.value;
    out_z.* = result.z.value;
}

export fn bn254_g1_mul(x: u256, y: u256, z: u256, scalar: u256, out_x: *u256, out_y: *u256, out_z: *u256) i32 {
    const p = bn254.G1{
        .x = bn254.FpMont.init(x),
        .y = bn254.FpMont.init(y),
        .z = bn254.FpMont.init(z),
    };
    const s = bn254.Fr.init(scalar);
    const result = p.mul(&s);
    out_x.* = result.x.value;
    out_y.* = result.y.value;
    out_z.* = result.z.value;
    return 0;
}

export fn bn254_g1_is_zero(x: u256, y: u256, z: u256) bool {
    const p = bn254.G1{
        .x = bn254.FpMont.init(x),
        .y = bn254.FpMont.init(y),
        .z = bn254.FpMont.init(z),
    };
    return p.isInfinity();
}

export fn bn254_g1_is_on_curve(x: u256, y: u256, z: u256) bool {
    const p = bn254.G1{
        .x = bn254.FpMont.init(x),
        .y = bn254.FpMont.init(y),
        .z = bn254.FpMont.init(z),
    };
    return p.isOnCurve();
}

export fn bn254_g1_equal(x1: u256, y1: u256, z1: u256, x2: u256, y2: u256, z2: u256) bool {
    const p1 = bn254.G1{
        .x = bn254.FpMont.init(x1),
        .y = bn254.FpMont.init(y1),
        .z = bn254.FpMont.init(z1),
    };
    const p2 = bn254.G1{
        .x = bn254.FpMont.init(x2),
        .y = bn254.FpMont.init(y2),
        .z = bn254.FpMont.init(z2),
    };
    return p1.equal(&p2);
}

export fn bn254_g1_to_affine(x: u256, y: u256, z: u256, out_x: *u256, out_y: *u256, out_z: *u256) i32 {
    const p = bn254.G1{
        .x = bn254.FpMont.init(x),
        .y = bn254.FpMont.init(y),
        .z = bn254.FpMont.init(z),
    };
    const affine = p.toAffine() catch return -1;
    out_x.* = affine.x.value;
    out_y.* = affine.y.value;
    out_z.* = affine.z.value;
    return 0;
}

export fn bn254_g1_from_affine(x: u256, y: u256, out_x: *u256, out_y: *u256, out_z: *u256) i32 {
    const x_fp = bn254.FpMont.init(x);
    const y_fp = bn254.FpMont.init(y);
    const z_fp = bn254.FpMont.ONE;
    const p = bn254.G1.init(&x_fp, &y_fp, &z_fp) catch return -1;
    out_x.* = p.x.value;
    out_y.* = p.y.value;
    out_z.* = p.z.value;
    return 0;
}

// ============================================================================
// G2 Operations
// ============================================================================

export fn bn254_g2_generator(
    out_x_c0: *u256,
    out_x_c1: *u256,
    out_y_c0: *u256,
    out_y_c1: *u256,
    out_z_c0: *u256,
    out_z_c1: *u256,
) void {
    const gen = bn254.G2.GENERATOR;
    out_x_c0.* = gen.x.u0.value;
    out_x_c1.* = gen.x.u1.value;
    out_y_c0.* = gen.y.u0.value;
    out_y_c1.* = gen.y.u1.value;
    out_z_c0.* = gen.z.u0.value;
    out_z_c1.* = gen.z.u1.value;
}

export fn bn254_g2_infinity(
    out_x_c0: *u256,
    out_x_c1: *u256,
    out_y_c0: *u256,
    out_y_c1: *u256,
    out_z_c0: *u256,
    out_z_c1: *u256,
) void {
    const inf = bn254.G2.INFINITY;
    out_x_c0.* = inf.x.u0.value;
    out_x_c1.* = inf.x.u1.value;
    out_y_c0.* = inf.y.u0.value;
    out_y_c1.* = inf.y.u1.value;
    out_z_c0.* = inf.z.u0.value;
    out_z_c1.* = inf.z.u1.value;
}

export fn bn254_g2_add(
    x1_c0: u256,
    x1_c1: u256,
    y1_c0: u256,
    y1_c1: u256,
    z1_c0: u256,
    z1_c1: u256,
    x2_c0: u256,
    x2_c1: u256,
    y2_c0: u256,
    y2_c1: u256,
    z2_c0: u256,
    z2_c1: u256,
    out_x_c0: *u256,
    out_x_c1: *u256,
    out_y_c0: *u256,
    out_y_c1: *u256,
    out_z_c0: *u256,
    out_z_c1: *u256,
) void {
    const p1 = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x1_c0, x1_c1),
        .y = bn254.Fp2Mont.initFromInt(y1_c0, y1_c1),
        .z = bn254.Fp2Mont.initFromInt(z1_c0, z1_c1),
    };
    const p2 = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x2_c0, x2_c1),
        .y = bn254.Fp2Mont.initFromInt(y2_c0, y2_c1),
        .z = bn254.Fp2Mont.initFromInt(z2_c0, z2_c1),
    };
    const result = p1.add(&p2);
    out_x_c0.* = result.x.u0.value;
    out_x_c1.* = result.x.u1.value;
    out_y_c0.* = result.y.u0.value;
    out_y_c1.* = result.y.u1.value;
    out_z_c0.* = result.z.u0.value;
    out_z_c1.* = result.z.u1.value;
}

export fn bn254_g2_double(
    x_c0: u256,
    x_c1: u256,
    y_c0: u256,
    y_c1: u256,
    z_c0: u256,
    z_c1: u256,
    out_x_c0: *u256,
    out_x_c1: *u256,
    out_y_c0: *u256,
    out_y_c1: *u256,
    out_z_c0: *u256,
    out_z_c1: *u256,
) void {
    const p = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x_c0, x_c1),
        .y = bn254.Fp2Mont.initFromInt(y_c0, y_c1),
        .z = bn254.Fp2Mont.initFromInt(z_c0, z_c1),
    };
    const result = p.double();
    out_x_c0.* = result.x.u0.value;
    out_x_c1.* = result.x.u1.value;
    out_y_c0.* = result.y.u0.value;
    out_y_c1.* = result.y.u1.value;
    out_z_c0.* = result.z.u0.value;
    out_z_c1.* = result.z.u1.value;
}

export fn bn254_g2_negate(
    x_c0: u256,
    x_c1: u256,
    y_c0: u256,
    y_c1: u256,
    z_c0: u256,
    z_c1: u256,
    out_x_c0: *u256,
    out_x_c1: *u256,
    out_y_c0: *u256,
    out_y_c1: *u256,
    out_z_c0: *u256,
    out_z_c1: *u256,
) void {
    const p = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x_c0, x_c1),
        .y = bn254.Fp2Mont.initFromInt(y_c0, y_c1),
        .z = bn254.Fp2Mont.initFromInt(z_c0, z_c1),
    };
    const result = p.neg();
    out_x_c0.* = result.x.u0.value;
    out_x_c1.* = result.x.u1.value;
    out_y_c0.* = result.y.u0.value;
    out_y_c1.* = result.y.u1.value;
    out_z_c0.* = result.z.u0.value;
    out_z_c1.* = result.z.u1.value;
}

export fn bn254_g2_mul(
    x_c0: u256,
    x_c1: u256,
    y_c0: u256,
    y_c1: u256,
    z_c0: u256,
    z_c1: u256,
    scalar: u256,
    out_x_c0: *u256,
    out_x_c1: *u256,
    out_y_c0: *u256,
    out_y_c1: *u256,
    out_z_c0: *u256,
    out_z_c1: *u256,
) i32 {
    const p = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x_c0, x_c1),
        .y = bn254.Fp2Mont.initFromInt(y_c0, y_c1),
        .z = bn254.Fp2Mont.initFromInt(z_c0, z_c1),
    };
    const s = bn254.Fr.init(scalar);
    const result = p.mul(&s);
    out_x_c0.* = result.x.u0.value;
    out_x_c1.* = result.x.u1.value;
    out_y_c0.* = result.y.u0.value;
    out_y_c1.* = result.y.u1.value;
    out_z_c0.* = result.z.u0.value;
    out_z_c1.* = result.z.u1.value;
    return 0;
}

export fn bn254_g2_is_zero(x_c0: u256, x_c1: u256, y_c0: u256, y_c1: u256, z_c0: u256, z_c1: u256) bool {
    const p = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x_c0, x_c1),
        .y = bn254.Fp2Mont.initFromInt(y_c0, y_c1),
        .z = bn254.Fp2Mont.initFromInt(z_c0, z_c1),
    };
    return p.isInfinity();
}

export fn bn254_g2_is_on_curve(x_c0: u256, x_c1: u256, y_c0: u256, y_c1: u256, z_c0: u256, z_c1: u256) bool {
    const p = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x_c0, x_c1),
        .y = bn254.Fp2Mont.initFromInt(y_c0, y_c1),
        .z = bn254.Fp2Mont.initFromInt(z_c0, z_c1),
    };
    return p.isOnCurve();
}

export fn bn254_g2_is_in_subgroup(x_c0: u256, x_c1: u256, y_c0: u256, y_c1: u256, z_c0: u256, z_c1: u256) bool {
    const p = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x_c0, x_c1),
        .y = bn254.Fp2Mont.initFromInt(y_c0, y_c1),
        .z = bn254.Fp2Mont.initFromInt(z_c0, z_c1),
    };
    return p.isInSubgroup();
}

export fn bn254_g2_equal(
    x1_c0: u256,
    x1_c1: u256,
    y1_c0: u256,
    y1_c1: u256,
    z1_c0: u256,
    z1_c1: u256,
    x2_c0: u256,
    x2_c1: u256,
    y2_c0: u256,
    y2_c1: u256,
    z2_c0: u256,
    z2_c1: u256,
) bool {
    const p1 = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x1_c0, x1_c1),
        .y = bn254.Fp2Mont.initFromInt(y1_c0, y1_c1),
        .z = bn254.Fp2Mont.initFromInt(z1_c0, z1_c1),
    };
    const p2 = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x2_c0, x2_c1),
        .y = bn254.Fp2Mont.initFromInt(y2_c0, y2_c1),
        .z = bn254.Fp2Mont.initFromInt(z2_c0, z2_c1),
    };
    return p1.equal(&p2);
}

export fn bn254_g2_to_affine(
    x_c0: u256,
    x_c1: u256,
    y_c0: u256,
    y_c1: u256,
    z_c0: u256,
    z_c1: u256,
    out_x_c0: *u256,
    out_x_c1: *u256,
    out_y_c0: *u256,
    out_y_c1: *u256,
    out_z_c0: *u256,
    out_z_c1: *u256,
) i32 {
    const p = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(x_c0, x_c1),
        .y = bn254.Fp2Mont.initFromInt(y_c0, y_c1),
        .z = bn254.Fp2Mont.initFromInt(z_c0, z_c1),
    };
    const affine = p.toAffine() catch return -1;
    out_x_c0.* = affine.x.u0.value;
    out_x_c1.* = affine.x.u1.value;
    out_y_c0.* = affine.y.u0.value;
    out_y_c1.* = affine.y.u1.value;
    out_z_c0.* = affine.z.u0.value;
    out_z_c1.* = affine.z.u1.value;
    return 0;
}

export fn bn254_g2_from_affine(
    x_c0: u256,
    x_c1: u256,
    y_c0: u256,
    y_c1: u256,
    out_x_c0: *u256,
    out_x_c1: *u256,
    out_y_c0: *u256,
    out_y_c1: *u256,
    out_z_c0: *u256,
    out_z_c1: *u256,
) i32 {
    const x = bn254.Fp2Mont.initFromInt(x_c0, x_c1);
    const y = bn254.Fp2Mont.initFromInt(y_c0, y_c1);
    const z = bn254.Fp2Mont.ONE;
    const p = bn254.G2.init(&x, &y, &z) catch return -1;
    out_x_c0.* = p.x.u0.value;
    out_x_c1.* = p.x.u1.value;
    out_y_c0.* = p.y.u0.value;
    out_y_c1.* = p.y.u1.value;
    out_z_c0.* = p.z.u0.value;
    out_z_c1.* = p.z.u1.value;
    return 0;
}

// ============================================================================
// Fr Operations
// ============================================================================

export fn bn254_fr_add(a: u256, b: u256) u256 {
    const a_fr = bn254.Fr.init(a);
    const b_fr = bn254.Fr.init(b);
    const result = a_fr.add(&b_fr);
    return result.value;
}

export fn bn254_fr_mul(a: u256, b: u256) u256 {
    const a_fr = bn254.Fr.init(a);
    const b_fr = bn254.Fr.init(b);
    const result = a_fr.mul(&b_fr);
    return result.value;
}

export fn bn254_fr_inv(a: u256) u256 {
    const a_fr = bn254.Fr.init(a);
    const result = a_fr.inv();
    return result.value;
}

// ============================================================================
// Pairing Operations
// ============================================================================

export fn bn254_pairing(
    g1_x: u256,
    g1_y: u256,
    g1_z: u256,
    g2_x_c0: u256,
    g2_x_c1: u256,
    g2_y_c0: u256,
    g2_y_c1: u256,
    g2_z_c0: u256,
    g2_z_c1: u256,
    out_c0_c0_c0: *u256,
) i32 {
    const p = bn254.G1{
        .x = bn254.FpMont.init(g1_x),
        .y = bn254.FpMont.init(g1_y),
        .z = bn254.FpMont.init(g1_z),
    };
    const q = bn254.G2{
        .x = bn254.Fp2Mont.initFromInt(g2_x_c0, g2_x_c1),
        .y = bn254.Fp2Mont.initFromInt(g2_y_c0, g2_y_c1),
        .z = bn254.Fp2Mont.initFromInt(g2_z_c0, g2_z_c1),
    };
    const result = bn254.pairing(&p, &q) catch return -1;
    out_c0_c0_c0.* = result.c0.c0.u0.value;
    return 0;
}

export fn bn254_pairing_check(
    input_ptr: [*]const u8,
    input_len: usize,
) i32 {
    const input = input_ptr[0..input_len];
    const result = bn254.bn254Pairing(input) catch return -1;
    return if (result) 1 else 0;
}
