const std = @import("std");
const timing = @import("timing.zig");
const BenchmarkSuite = timing.BenchmarkSuite;
const BenchmarkConfig = timing.BenchmarkConfig;

// Import our Zig implementations
const Fp = @import("crypto").bn254.Fp;
const Fr = @import("crypto").bn254.Fr;
const Fp2 = @import("crypto").bn254.Fp2;
const G1 = @import("crypto").bn254.G1;
const G2 = @import("crypto").bn254.G2;
const pairing = @import("crypto").bn254.pairing;

// Import precompiles
const ecmul_precompile = @import("evm").ecmul;
const ecpairing_precompile = @import("evm").ecpairing;

// Test vectors for benchmarking
const TEST_VECTORS = struct {
    // G1 generator point coordinates
    const G1_GEN_X = 0x1;
    const G1_GEN_Y = 0x2;
    
    // Scalar for multiplication
    const SCALAR = 0x123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF;
    
    // Test inputs for ECMUL (96 bytes: x, y, scalar)
    const ECMUL_INPUT = blk: {
        var input: [96]u8 = undefined;
        // Set x coordinate (32 bytes)
        std.mem.writeInt(u256, input[0..32], G1_GEN_X, .big);
        // Set y coordinate (32 bytes)
        std.mem.writeInt(u256, input[32..64], G1_GEN_Y, .big);
        // Set scalar (32 bytes)
        std.mem.writeInt(u256, input[64..96], SCALAR, .big);
        break :blk input;
    };
    
    // Test inputs for ECPAIRING (192 bytes per pair)
    // Using simple test vectors that fit in u256
    const ECPAIRING_INPUT = blk: {
        var input: [192]u8 = undefined;
        // G1 point (64 bytes) - using generator
        std.mem.writeInt(u256, input[0..32], G1_GEN_X, .big);
        std.mem.writeInt(u256, input[32..64], G1_GEN_Y, .big);
        // G2 point (128 bytes) - using test values that fit in u256
        // Real G2 coordinates would need special encoding
        // For now using simplified test values
        std.mem.writeInt(u256, input[64..96], 0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF, .big);
        std.mem.writeInt(u256, input[96..128], 0xFEDCBA0987654321FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321, .big);
        std.mem.writeInt(u256, input[128..160], 0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890, .big);
        std.mem.writeInt(u256, input[160..192], 0x7654321FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321FEDCBA098, .big);
        break :blk input;
    };
};

pub fn runBn254Benchmarks(allocator: std.mem.Allocator) !void {
    std.debug.print("\n=== BN254 Precompile vs Native Zig Implementation Benchmarks ===\n", .{});
    
    var suite = BenchmarkSuite.init(allocator);
    defer suite.deinit();
    
    // Benchmark ECMUL operations
    std.debug.print("\n--- ECMUL Benchmarks ---\n", .{});
    
    // Precompile ECMUL benchmark
    const PrecompileEcmulBench = struct {
        fn bench() !void {
            var output: [64]u8 = undefined;
            const chain_rules_mod = @import("evm").hardforks.chain_rules;
            const Hardfork = @import("evm").hardforks.hardfork.Hardfork;
            const chain_rules = chain_rules_mod.for_hardfork(Hardfork.ISTANBUL); // Use Istanbul for lower gas costs
            const result = ecmul_precompile.execute(
                &TEST_VECTORS.ECMUL_INPUT,
                &output,
                1000000, // gas limit
                chain_rules,
            );
            if (result != .success) {
                return error.PrecompileFailed;
            }
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "ECMUL (Precompile)",
        .iterations = 1000,
        .warmup_iterations = 100,
    }, PrecompileEcmulBench.bench);
    
    // Native Zig ECMUL benchmark
    const ZigEcmulBench = struct {
        fn bench() !void {
            // Parse input
            const x = TEST_VECTORS.G1_GEN_X;
            const y = TEST_VECTORS.G1_GEN_Y;
            const scalar = TEST_VECTORS.SCALAR;
            
            // Create field elements
            const x_fp = Fp.init(x);
            const y_fp = Fp.init(y);
            const z_fp = Fp.ONE;
            
            // Create G1 point
            const g1_point = try G1.init(&x_fp, &y_fp, &z_fp);
            
            // Perform scalar multiplication
            const fr_scalar = Fr.init(scalar);
            _ = g1_point.mul(&fr_scalar);
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "ECMUL (Zig native)",
        .iterations = 1000,
        .warmup_iterations = 100,
    }, ZigEcmulBench.bench);
    
    // Benchmark ECPAIRING operations
    std.debug.print("\n--- ECPAIRING Benchmarks ---\n", .{});
    
    // Precompile ECPAIRING benchmark
    const PrecompileEcpairingBench = struct {
        fn bench() !void {
            var output: [32]u8 = undefined;
            const chain_rules_mod = @import("evm").hardforks.chain_rules;
            const Hardfork = @import("evm").hardforks.hardfork.Hardfork;
            const chain_rules = chain_rules_mod.for_hardfork(Hardfork.ISTANBUL); // Use Istanbul for lower gas costs
            const result = ecpairing_precompile.execute(
                &TEST_VECTORS.ECPAIRING_INPUT,
                &output,
                1000000, // gas limit
                chain_rules,
            );
            if (result != .success) {
                return error.PrecompileFailed;
            }
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "ECPAIRING (Precompile)",
        .iterations = 100,
        .warmup_iterations = 10,
    }, PrecompileEcpairingBench.bench);
    
    // Native Zig ECPAIRING benchmark
    const ZigEcpairingBench = struct {
        fn bench() !void {
            // Parse G1 point
            const g1_x = TEST_VECTORS.G1_GEN_X;
            const g1_y = TEST_VECTORS.G1_GEN_Y;
            
            // Create field elements
            const x_fp = Fp.init(g1_x);
            const y_fp = Fp.init(g1_y);
            const z_fp = Fp.ONE;
            
            // Create G1 point
            const g1_point = try G1.init(&x_fp, &y_fp, &z_fp);
            
            // Use G2 generator
            const g2_point = G2.GENERATOR;
            
            // Perform pairing
            _ = pairing(&g1_point, &g2_point);
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "ECPAIRING (Zig native)",
        .iterations = 100,
        .warmup_iterations = 10,
    }, ZigEcpairingBench.bench);
    
    // Component benchmarks
    std.debug.print("\n--- Component Operation Benchmarks ---\n", .{});
    
    // Field multiplication benchmark
    const FieldMulBench = struct {
        fn bench() void {
            const a = Fp.init(0x123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF);
            const b = Fp.init(0xFEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210);
            _ = a.mul(&b);
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "Field multiplication (Fp)",
        .iterations = 10000,
        .warmup_iterations = 1000,
    }, FieldMulBench.bench);
    
    // Field inversion benchmark
    const FieldInvBench = struct {
        fn bench() void {
            const a = Fp.init(0x123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF);
            _ = a.inv();
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "Field inversion (Fp)",
        .iterations = 1000,
        .warmup_iterations = 100,
    }, FieldInvBench.bench);
    
    // G1 point addition benchmark
    const G1AddBench = struct {
        fn bench() !void {
            const p1 = G1.GENERATOR;
            const p2 = G1.GENERATOR.double();
            _ = p1.add(&p2);
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "G1 point addition",
        .iterations = 5000,
        .warmup_iterations = 500,
    }, G1AddBench.bench);
    
    // G1 point doubling benchmark
    const G1DoubleBench = struct {
        fn bench() void {
            const p = G1.GENERATOR;
            _ = p.double();
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "G1 point doubling",
        .iterations = 5000,
        .warmup_iterations = 500,
    }, G1DoubleBench.bench);
    
    // Print results
    suite.print_results();
    
    // Print comparison summary
    std.debug.print("\n--- Performance Comparison Summary ---\n", .{});
    
    // Find and compare ECMUL results
    var precompile_ecmul_time: ?f64 = null;
    var zig_ecmul_time: ?f64 = null;
    var precompile_ecpairing_time: ?f64 = null;
    var zig_ecpairing_time: ?f64 = null;
    
    for (suite.results.items) |result| {
        if (std.mem.eql(u8, result.name, "ECMUL (Precompile)")) {
            precompile_ecmul_time = result.mean_time_ms();
        } else if (std.mem.eql(u8, result.name, "ECMUL (Zig native)")) {
            zig_ecmul_time = result.mean_time_ms();
        } else if (std.mem.eql(u8, result.name, "ECPAIRING (Precompile)")) {
            precompile_ecpairing_time = result.mean_time_ms();
        } else if (std.mem.eql(u8, result.name, "ECPAIRING (Zig native)")) {
            zig_ecpairing_time = result.mean_time_ms();
        }
    }
    
    if (precompile_ecmul_time != null and zig_ecmul_time != null) {
        const speedup = precompile_ecmul_time.? / zig_ecmul_time.?;
        std.debug.print("ECMUL: ", .{});
        if (speedup > 1.0) {
            std.debug.print("Zig native is {d:.2}x faster than precompile\n", .{speedup});
        } else {
            std.debug.print("Precompile is {d:.2}x faster than Zig native\n", .{1.0 / speedup});
        }
    }
    
    if (precompile_ecpairing_time != null and zig_ecpairing_time != null) {
        const speedup = precompile_ecpairing_time.? / zig_ecpairing_time.?;
        std.debug.print("ECPAIRING: ", .{});
        if (speedup > 1.0) {
            std.debug.print("Zig native is {d:.2}x faster than precompile\n", .{speedup});
        } else {
            std.debug.print("Precompile is {d:.2}x faster than Zig native\n", .{1.0 / speedup});
        }
    }
    
    std.debug.print("\nNote: The precompile may use either Rust (arkworks) or native Zig implementation depending on build configuration.\n", .{});
    std.debug.print("Use --no-bn254 build flag to force native Zig implementation in precompiles.\n", .{});
    
    std.debug.print("\n=== BN254 Benchmark Complete ===\n", .{});
}

// Standalone main for running just these benchmarks
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    try runBn254Benchmarks(allocator);
}