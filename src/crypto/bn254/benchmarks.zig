const std = @import("std");
const Fp = @import("Fp.zig").Fp;
const Fp2 = @import("Fp2.zig").Fp2;
const Fp6 = @import("Fp6.zig").Fp6;
const Fp12 = @import("Fp12.zig").Fp12;
const Fr = @import("Fr.zig").Fr;
const G1 = @import("g1.zig").G1;
const G2 = @import("g2.zig").G2;
const pairing_mod = @import("pairing.zig");

// Constants
const FP_MOD = @import("Fp.zig").FP_MOD;
const FR_MOD = @import("Fr.zig").FR_MOD;

// Time formatting function to use appropriate scale
fn formatTime(ns: u64) struct { value: f64, unit: []const u8 } {
    if (ns < 1000) {
        return .{ .value = @as(f64, @floatFromInt(ns)), .unit = "ns" };
    } else if (ns < 1000_000) {
        return .{ .value = @as(f64, @floatFromInt(ns)) / 1000.0, .unit = "μs" };
    } else if (ns < 1000_000_000) {
        return .{ .value = @as(f64, @floatFromInt(ns)) / 1000_000.0, .unit = "ms" };
    } else {
        return .{ .value = @as(f64, @floatFromInt(ns)) / 1000_000_000.0, .unit = "s" };
    }
}

// Random element generators - using simple PRNG approach
var random_state: u64 = 12345;

fn nextRandom() u256 {
    random_state = random_state *% 1103515245 +% 12345;
    const high = @as(u256, random_state) << 192;
    random_state = random_state *% 1103515245 +% 12345;
    const mid_high = @as(u256, random_state) << 128;
    random_state = random_state *% 1103515245 +% 12345;
    const mid_low = @as(u256, random_state) << 64;
    random_state = random_state *% 1103515245 +% 12345;
    const low = @as(u256, random_state);
    return high | mid_high | mid_low | low;
}

fn randomFp() Fp {
    return Fp.init(nextRandom());
}

fn randomFp2() Fp2 {
    return Fp2.init_from_int(nextRandom(), nextRandom());
}

fn randomFp6() Fp6 {
    return Fp6.init_from_int(nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom());
}

fn randomFp12() Fp12 {
    return Fp12.init_from_int(nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom(), nextRandom());
}

fn randomFr() Fr {
    return Fr.init(nextRandom());
}

fn randomG1() G1 {
    const scalar = randomFr();
    return G1.GENERATOR.mul(&scalar);
}

fn randomG2() G2 {
    const scalar = randomFr();
    return G2.GENERATOR.mul(&scalar);
}

// =============================================================================
// BASE FIELD OPERATIONS (Fp)
// =============================================================================

test "benchmark Fp.add" {
    const n = 50000;

    var inputs_a = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp();
        inputs_b[i] = randomFp();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].add(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp.add n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp.sub" {
    const n = 50000;

    var inputs_a = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp();
        inputs_b[i] = randomFp();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].sub(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp.sub n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp.mul" {
    const n = 50000;

    var inputs_a = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp();
        inputs_b[i] = randomFp();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].mul(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp.mul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp.pow" {
    const n = 5000;

    var inputs = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(inputs);
    var exponents = try std.testing.allocator.alloc(u256, n);
    defer std.testing.allocator.free(exponents);

    for (0..n) |i| {
        inputs[i] = randomFp();
        exponents[i] = nextRandom();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].pow(exponents[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp.pow n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp.inv" {
    const n = 5000;

    var inputs = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp();
        if (inputs[i].value == 0) inputs[i] = Fp.ONE;
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].inv();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp.inv n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

// =============================================================================
// QUADRATIC EXTENSION FIELD OPERATIONS (Fp2)
// =============================================================================

test "benchmark Fp2.add" {
    const n = 10000;

    var inputs_a = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp2();
        inputs_b[i] = randomFp2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].add(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.add n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.sub" {
    const n = 10000;
    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp2();
        inputs_b[i] = randomFp2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].sub(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.sub n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.mul" {
    const n = 5000;

    var inputs_a = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp2();
        inputs_b[i] = randomFp2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].mul(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.mul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.pow" {
    const n = 1000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs);
    var exponents = try std.testing.allocator.alloc(u256, n);
    defer std.testing.allocator.free(exponents);

    for (0..n) |i| {
        inputs[i] = randomFp2();
        exponents[i] = nextRandom();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].pow(exponents[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.pow n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.inv" {
    const n = 500;

    var inputs = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp2();
        if (inputs[i].u0.value == 0 and inputs[i].u1.value == 0) {
            inputs[i] = Fp2.ONE;
        }
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].inv();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.inv n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.neg" {
    const n = 10000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].neg();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.neg n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.norm" {
    const n = 10000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].norm();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.norm n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.conj" {
    const n = 10000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].conj();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.conj n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.scalarMul" {
    const n = 1000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs);
    var scalars = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(scalars);

    for (0..n) |i| {
        inputs[i] = randomFp2();
        scalars[i] = randomFp();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].scalarMul(&scalars[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.scalarMul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp2.frobeniusMap" {
    const n = 10000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].frobeniusMap();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp2.frobeniusMap n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

// =============================================================================
// SEXTIC EXTENSION FIELD OPERATIONS (Fp6)
// =============================================================================

test "benchmark Fp6.add" {
    const n = 1000;

    var inputs_a = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp6();
        inputs_b[i] = randomFp6();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].add(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp6.add n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp6.sub" {
    const n = 1000;

    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp6();
        inputs_b[i] = randomFp6();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].sub(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp6.sub n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp6.mul" {
    const n = 1000;

    var inputs_a = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp6();
        inputs_b[i] = randomFp6();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].mul(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;

    const time = formatTime(avg_ns);
    std.debug.print("Fp6.mul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp6.pow" {
    const n = 500;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs);
    var exponents = try std.testing.allocator.alloc(u256, n);
    defer std.testing.allocator.free(exponents);

    for (0..n) |i| {
        inputs[i] = randomFp6();
        exponents[i] = nextRandom();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].pow(exponents[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp6.pow n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp6.inv" {
    const n = 500;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp6();
        // Ensure non-zero
        if (inputs[i].v0.u0.value == 0 and inputs[i].v0.u1.value == 0 and
            inputs[i].v1.u0.value == 0 and inputs[i].v1.u1.value == 0 and
            inputs[i].v2.u0.value == 0 and inputs[i].v2.u1.value == 0)
        {
            inputs[i] = Fp6.ONE;
        }
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].inv();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp6.inv n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp6.neg" {
    const n = 1000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp6();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].neg();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp6.neg n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp6.norm" {
    const n = 1000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp6();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].norm();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp6.norm n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp6.scalarMul" {
    const n = 1000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp6, n);
    defer std.testing.allocator.free(inputs);
    var scalars = try std.testing.allocator.alloc(Fp, n);
    defer std.testing.allocator.free(scalars);

    for (0..n) |i| {
        inputs[i] = randomFp6();
        scalars[i] = randomFp();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].scalarMul(&scalars[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp6.scalarMul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

// =============================================================================
// DODECIC EXTENSION FIELD OPERATIONS (Fp12)
// =============================================================================

test "benchmark Fp12.add" {
    const n = 500;

    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp12();
        inputs_b[i] = randomFp12();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].add(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp12.add n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp12.sub" {
    const sample_sizes = [_]usize{ 5, 50, 500 };

    for (sample_sizes) |n| {
        // Random number generation
        // Using deterministic PRNG

        var inputs_a = try std.testing.allocator.alloc(Fp12, n);
        defer std.testing.allocator.free(inputs_a);
        var inputs_b = try std.testing.allocator.alloc(Fp12, n);
        defer std.testing.allocator.free(inputs_b);

        for (0..n) |i| {
            inputs_a[i] = randomFp12();
            inputs_b[i] = randomFp12();
        }

        const start = std.time.nanoTimestamp();
        for (0..n) |i| {
            const result = inputs_a[i].sub(&inputs_b[i]);
            std.mem.doNotOptimizeAway(result);
        }
        const end = std.time.nanoTimestamp();

        const duration_ns = @as(u64, @intCast(end - start));
        const avg_ns = duration_ns / n;
        // ops_per_sec calculation removed

        const time = formatTime(avg_ns);
        std.debug.print("Fp12.sub n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
    }
}

test "benchmark Fp12.mul" {
    const n = 250;

    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFp12();
        inputs_b[i] = randomFp12();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].mul(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp12.mul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp12.pow" {
    const n = 100;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(inputs);
    var exponents = try std.testing.allocator.alloc(u256, n);
    defer std.testing.allocator.free(exponents);

    for (0..n) |i| {
        inputs[i] = randomFp12();
        exponents[i] = nextRandom();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].pow(exponents[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp12.pow n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp12.inv" {
    const n = 100;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp12();
        // Ensure non-zero (simplified check)
        if (inputs[i].w0.v0.u0.value == 0 and inputs[i].w0.v0.u1.value == 0 and
            inputs[i].w0.v1.u0.value == 0 and inputs[i].w0.v1.u1.value == 0 and
            inputs[i].w0.v2.u0.value == 0 and inputs[i].w0.v2.u1.value == 0 and
            inputs[i].w1.v0.u0.value == 0 and inputs[i].w1.v0.u1.value == 0 and
            inputs[i].w1.v1.u0.value == 0 and inputs[i].w1.v1.u1.value == 0 and
            inputs[i].w1.v2.u0.value == 0 and inputs[i].w1.v2.u1.value == 0)
        {
            inputs[i] = Fp12.ONE;
        }
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].inv();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp12.inv n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fp12.neg" {
    const n = 500;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp12();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].neg();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fp12.neg n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

// =============================================================================
// SCALAR FIELD OPERATIONS (Fr)
// =============================================================================

test "benchmark Fr.add" {
    const n = 10000;

    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFr();
        inputs_b[i] = randomFr();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].add(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fr.add n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fr.sub" {
    const n = 10000;

    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFr();
        inputs_b[i] = randomFr();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].sub(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fr.sub n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fr.mul" {
    const n = 10000;

    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomFr();
        inputs_b[i] = randomFr();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].mul(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fr.mul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fr.pow" {
    const n = 1000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs);
    var exponents = try std.testing.allocator.alloc(u256, n);
    defer std.testing.allocator.free(exponents);

    for (0..n) |i| {
        inputs[i] = randomFr();
        exponents[i] = nextRandom();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].pow(exponents[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fr.pow n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fr.inv" {
    const n = 1000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFr();
        // Ensure non-zero
        if (inputs[i].value == 0) inputs[i] = Fr.ONE;
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].inv();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fr.inv n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark Fr.neg" {
    const n = 10000;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFr();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].neg();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("Fr.neg n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

// =============================================================================
// GROUP OPERATIONS (G1)
// =============================================================================

test "benchmark G1.add" {
    const n = 200;

    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomG1();
        inputs_b[i] = randomG1();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].add(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G1.add n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G1.double" {
    const n = 200;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomG1();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].double();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G1.double n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G1.mul" {
    const n = 250;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(inputs);
    var scalars = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(scalars);

    for (0..n) |i| {
        inputs[i] = randomG1();
        scalars[i] = randomFr();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].mul(&scalars[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G1.mul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G1.neg" {
    const n = 500;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomG1();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].neg();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G1.neg n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G1.toAffine" {
    const n = 200;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomG1();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].toAffine();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G1.toAffine n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G1.isOnCurve" {
    const n = 300;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomG1();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].isOnCurve();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G1.isOnCurve n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

// =============================================================================
// GROUP OPERATIONS (G2)
// =============================================================================

test "benchmark G2.add" {
    const n = 100;

    // Random number generation
    // Using deterministic PRNG

    var inputs_a = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(inputs_a);
    var inputs_b = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(inputs_b);

    for (0..n) |i| {
        inputs_a[i] = randomG2();
        inputs_b[i] = randomG2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs_a[i].add(&inputs_b[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G2.add n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G2.double" {
    const n = 100;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomG2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].double();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G2.double n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G2.mul" {
    const n = 50;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(inputs);
    var scalars = try std.testing.allocator.alloc(Fr, n);
    defer std.testing.allocator.free(scalars);

    for (0..n) |i| {
        inputs[i] = randomG2();
        scalars[i] = randomFr();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].mul(&scalars[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G2.mul n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G2.neg" {
    const n = 200;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomG2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].neg();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G2.neg n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G2.toAffine" {
    const n = 100;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomG2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].toAffine();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G2.toAffine n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark G2.isOnCurve" {
    const n = 100;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomG2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = inputs[i].isOnCurve();
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("G2.isOnCurve n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

// =============================================================================
// PAIRING OPERATIONS
// =============================================================================

test "benchmark pairing.pairing" {
    const n = 5;

    // Random number generation
    // Using deterministic PRNG

    var g1_inputs = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(g1_inputs);
    var g2_inputs = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(g2_inputs);

    for (0..n) |i| {
        g1_inputs[i] = randomG1();
        g2_inputs[i] = randomG2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = pairing_mod.pairing(&g1_inputs[i], &g2_inputs[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("pairing.pairing n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark pairing.miller_loop" {
    const n = 25;

    // Random number generation
    // Using deterministic PRNG

    var g1_inputs = try std.testing.allocator.alloc(G1, n);
    defer std.testing.allocator.free(g1_inputs);
    var g2_inputs = try std.testing.allocator.alloc(G2, n);
    defer std.testing.allocator.free(g2_inputs);

    for (0..n) |i| {
        g1_inputs[i] = randomG1();
        g2_inputs[i] = randomG2();
    }

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        const result = pairing_mod.miller_loop(&g1_inputs[i], &g2_inputs[i]);
        std.mem.doNotOptimizeAway(result);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("pairing.miller_loop n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

test "benchmark pairing.final_exponentiation" {
    const n = 10;

    // Random number generation
    // Using deterministic PRNG

    var inputs = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(inputs);

    for (0..n) |i| {
        inputs[i] = randomFp12();
    }

    var results = try std.testing.allocator.alloc(Fp12, n);
    defer std.testing.allocator.free(results);

    const start = std.time.nanoTimestamp();
    for (0..n) |i| {
        results[i] = pairing_mod.final_exponentiation(&inputs[i]);
        std.mem.doNotOptimizeAway(results[i]);
    }
    const end = std.time.nanoTimestamp();

    const duration_ns = @as(u64, @intCast(end - start));
    const avg_ns = duration_ns / n;
    // ops_per_sec calculation removed

    const time = formatTime(avg_ns);
    std.debug.print("pairing.final_exponentiation n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
}

// =============================================================================
// SPECIAL CASES AND EDGE CASE BENCHMARKS
// =============================================================================

test "benchmark Fp.mul with identity elements" {
    const sample_sizes = [_]usize{ 100, 1000, 10000 };

    for (sample_sizes) |n| {
        // Random number generation
        // Using deterministic PRNG

        var inputs = try std.testing.allocator.alloc(Fp, n);
        defer std.testing.allocator.free(inputs);

        for (0..n) |i| {
            inputs[i] = randomFp();
        }

        const start = std.time.nanoTimestamp();
        for (0..n) |i| {
            const result = inputs[i].mul(&Fp.ONE);
            std.mem.doNotOptimizeAway(result);
        }
        const end = std.time.nanoTimestamp();

        const duration_ns = @as(u64, @intCast(end - start));
        const avg_ns = duration_ns / n;
        // ops_per_sec calculation removed

        const time = formatTime(avg_ns);
        std.debug.print("Fp.mul_identity n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
    }
}

test "benchmark Fp.mul near modulus boundary" {
    const sample_sizes = [_]usize{ 10, 100, 1000 };

    for (sample_sizes) |n| {
        var inputs_a = try std.testing.allocator.alloc(Fp, n);
        defer std.testing.allocator.free(inputs_a);
        var inputs_b = try std.testing.allocator.alloc(Fp, n);
        defer std.testing.allocator.free(inputs_b);

        for (0..n) |i| {
            inputs_a[i] = Fp.init(FP_MOD - 1 - @as(u256, @intCast(i % 100)));
            inputs_b[i] = Fp.init(FP_MOD - 1 - @as(u256, @intCast((i + 50) % 100)));
        }

        const start = std.time.nanoTimestamp();
        for (0..n) |i| {
            const result = inputs_a[i].mul(&inputs_b[i]);
            std.mem.doNotOptimizeAway(result);
        }
        const end = std.time.nanoTimestamp();

        const duration_ns = @as(u64, @intCast(end - start));
        const avg_ns = duration_ns / n;
        // ops_per_sec calculation removed

        const time = formatTime(avg_ns);
        std.debug.print("Fp.mul_boundary n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
    }
}

test "benchmark G1.add with infinity" {
    const sample_sizes = [_]usize{ 5, 50, 500 };

    for (sample_sizes) |n| {
        // Random number generation
        // Using deterministic PRNG

        var inputs = try std.testing.allocator.alloc(G1, n);
        defer std.testing.allocator.free(inputs);

        for (0..n) |i| {
            inputs[i] = randomG1();
        }

        const start = std.time.nanoTimestamp();
        for (0..n) |i| {
            const result = inputs[i].add(&G1.INFINITY);
            std.mem.doNotOptimizeAway(result);
        }
        const end = std.time.nanoTimestamp();

        const duration_ns = @as(u64, @intCast(end - start));
        const avg_ns = duration_ns / n;
        // ops_per_sec calculation removed

        const time = formatTime(avg_ns);
        std.debug.print("G1.add_infinity n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
    }
}

test "benchmark Fp12.mul with sparse elements" {
    const sample_sizes = [_]usize{ 5, 50, 500 };

    for (sample_sizes) |n| {
        // Random number generation
        // Using deterministic PRNG

        var inputs_a = try std.testing.allocator.alloc(Fp12, n);
        defer std.testing.allocator.free(inputs_a);
        var inputs_b = try std.testing.allocator.alloc(Fp12, n);
        defer std.testing.allocator.free(inputs_b);

        for (0..n) |i| {
            // Create sparse Fp12 elements (most components are zero)
            inputs_a[i] = Fp12.init_from_int(nextRandom(), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            inputs_b[i] = Fp12.init_from_int(0, 0, 0, 0, 0, 0, nextRandom(), 0, 0, 0, 0, 0);
        }

        const start = std.time.nanoTimestamp();
        for (0..n) |i| {
            const result = inputs_a[i].mul(&inputs_b[i]);
            std.mem.doNotOptimizeAway(result);
        }
        const end = std.time.nanoTimestamp();

        const duration_ns = @as(u64, @intCast(end - start));
        const avg_ns = duration_ns / n;
        // ops_per_sec calculation removed

        const time = formatTime(avg_ns);
        std.debug.print("Fp12.mul_sparse n={}: {d:.2} {s}/op\n", .{ n, time.value, time.unit });
    }
}
