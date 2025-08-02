const std = @import("std");
const timing = @import("timing.zig");
const BenchmarkSuite = timing.BenchmarkSuite;
const BenchmarkConfig = timing.BenchmarkConfig;

// Import precompiles that use Rust wrapper
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
        std.mem.writeInt(u256, input[64..96], 0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF, .big);
        std.mem.writeInt(u256, input[96..128], 0xFEDCBA0987654321FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321, .big);
        std.mem.writeInt(u256, input[128..160], 0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890, .big);
        std.mem.writeInt(u256, input[160..192], 0x7654321FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321FEDCBA098, .big);
        break :blk input;
    };
};

pub fn runBn254RustBenchmarks(allocator: std.mem.Allocator) !void {
    std.debug.print("\n=== BN254 Rust Wrapper (Precompile) Benchmarks ===\n", .{});
    
    var suite = BenchmarkSuite.init(allocator);
    defer suite.deinit();
    
    // Chain rules are declared inline where needed
    
    // Benchmark ECMUL operations
    std.debug.print("\n--- ECMUL Benchmarks ---\n", .{});
    
    // Precompile ECMUL benchmark
    const PrecompileEcmulBench = struct {
        fn bench() !void {
            var output: [64]u8 = undefined;
            const chain_rules_mod = @import("evm").hardforks.chain_rules;
            const Hardfork = @import("evm").hardforks.hardfork.Hardfork;
            const rules = chain_rules_mod.for_hardfork(Hardfork.ISTANBUL);
            const result = ecmul_precompile.execute(
                &TEST_VECTORS.ECMUL_INPUT,
                &output,
                1000000, // gas limit
                rules,
            );
            if (result != .success) {
                return error.PrecompileFailed;
            }
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "ECMUL (Rust Wrapper)",
        .iterations = 1000,
        .warmup_iterations = 100,
    }, PrecompileEcmulBench.bench);
    
    // Benchmark ECPAIRING operations
    std.debug.print("\n--- ECPAIRING Benchmarks ---\n", .{});
    
    // Precompile ECPAIRING benchmark
    const PrecompileEcpairingBench = struct {
        fn bench() !void {
            var output: [32]u8 = undefined;
            const chain_rules_mod = @import("evm").hardforks.chain_rules;
            const Hardfork = @import("evm").hardforks.hardfork.Hardfork;
            const rules = chain_rules_mod.for_hardfork(Hardfork.ISTANBUL);
            const result = ecpairing_precompile.execute(
                &TEST_VECTORS.ECPAIRING_INPUT,
                &output,
                1000000, // gas limit
                rules,
            );
            if (result != .success) {
                return error.PrecompileFailed;
            }
        }
    };
    
    try suite.benchmark(BenchmarkConfig{
        .name = "ECPAIRING (Rust Wrapper)",
        .iterations = 100,
        .warmup_iterations = 10,
    }, PrecompileEcpairingBench.bench);
    
    // Print results
    suite.print_results();
    
    std.debug.print("\n=== BN254 Rust Wrapper Benchmark Complete ===\n", .{});
}

// Standalone main for running just these benchmarks
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    try runBn254RustBenchmarks(allocator);
}