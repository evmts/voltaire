const std = @import("std");
const root = @import("root.zig");
<<<<<<< HEAD
const timing = @import("timing.zig");
const Evm = root.Evm;
const primitives = root.primitives;

// Transaction related imports
const BlobTransaction = Evm.transaction.BlobTransaction;
const BlobTransactionValidator = Evm.transaction.BlobTransactionValidator;
const blob_types = Evm.blob.blob_types;
const blob_gas_market = Evm.blob.blob_gas_market;
const AccessList = Evm.access_list.AccessList;
const Context = Evm.access_list.Context;

/// Transaction type constants for benchmarking
pub const LEGACY_TX_TYPE = 0x00;
pub const ACCESS_LIST_TX_TYPE = 0x01;
pub const EIP1559_TX_TYPE = 0x02;
pub const BLOB_TX_TYPE = 0x03;

/// Benchmark transaction type detection performance
pub fn transaction_type_detection_benchmark(allocator: std.mem.Allocator) !void {
    _ = allocator;
    std.log.info("=== Transaction Type Detection Benchmark ===", .{});

    const tx_types = [_]u8{ LEGACY_TX_TYPE, ACCESS_LIST_TX_TYPE, EIP1559_TX_TYPE, BLOB_TX_TYPE };
    const iterations = 100000;

    var total_time: u64 = 0;

    const start_time = timing.nanoTimestamp();

    for (0..iterations) |_| {
        for (tx_types) |tx_type| {
            // Simulate type detection logic
            const detected_type = detect_transaction_type(tx_type);
            std.mem.doNotOptimizeAway(detected_type);
        }
    }

    const end_time = timing.nanoTimestamp();
    total_time = end_time - start_time;

    const total_detections = iterations * tx_types.len;
    const avg_time = total_time / total_detections;
    const throughput = @as(f64, @floatFromInt(total_detections * 1000000000)) / @as(f64, @floatFromInt(total_time));

    std.log.info("  {} type detections completed", .{total_detections});
    std.log.info("  Average detection time: {d:.2f}ns", .{@as(f64, @floatFromInt(avg_time))});
    std.log.info("  Throughput: {d:.2f} detections/sec", .{throughput});
}

/// Benchmark blob transaction parsing performance
pub fn blob_transaction_parsing_benchmark(allocator: std.mem.Allocator) !void {
    std.log.info("=== Blob Transaction Parsing Benchmark ===", .{});

    const blob_counts = [_]u32{ 1, 2, 3, 6 };
    const iterations = 1000;

    for (blob_counts) |blob_count| {
        std.log.info("Benchmarking parsing with {} blobs", .{blob_count});

        var total_time: u64 = 0;

        const start_time = timing.nanoTimestamp();

        for (0..iterations) |i| {
            // Create a transaction to parse
            var transaction = BlobTransaction.init(allocator);
            defer transaction.deinit();

            // Simulate filling transaction fields (parsing)
            transaction.chain_id = 1;
            transaction.nonce = i;
            transaction.max_fee_per_gas = 20000000000;
            transaction.max_priority_fee_per_gas = 2000000000;
            transaction.gas_limit = 21000;
            transaction.to = create_test_address(i);
            transaction.value = 1000000000000000000;
            transaction.max_fee_per_blob_gas = 5000000;

            // Create blob sidecar data
            var blobs = try allocator.alloc(blob_types.Blob, blob_count);
            defer allocator.free(blobs);

            var commitments = try allocator.alloc(blob_types.KZGCommitment, blob_count);
            defer allocator.free(commitments);

            var proofs = try allocator.alloc(blob_types.KZGProof, blob_count);
            defer allocator.free(proofs);

            for (0..blob_count) |j| {
                blobs[j] = create_test_blob(i + j);
                commitments[j] = create_test_commitment(i + j);
                proofs[j] = create_test_proof(i + j);
            }

            // Set blob sidecar (parsing step)
            try transaction.set_blob_sidecar(blobs, commitments, proofs);
            try transaction.set_versioned_hashes_from_commitments(commitments);

            // Simulate additional parsing steps
            _ = transaction.get_blob_count();
            _ = transaction.get_blob_gas_used();
            _ = transaction.has_valid_sidecar();

            std.mem.doNotOptimizeAway(&transaction);
        }

        const end_time = timing.nanoTimestamp();
        total_time = end_time - start_time;

        const avg_time = total_time / iterations;
        const throughput = @as(f64, @floatFromInt(iterations * 1000000000)) / @as(f64, @floatFromInt(total_time));

        std.log.info("  {} blobs: {d:.2f}μs avg, {d:.2f} parses/sec", .{
            blob_count,
            @as(f64, @floatFromInt(avg_time)) / 1000.0,
            throughput,
        });
    }
}

/// Benchmark transaction validation performance
pub fn transaction_validation_benchmark(allocator: std.mem.Allocator) !void {
    std.log.info("=== Transaction Validation Benchmark ===", .{});

    const validation_scenarios = [_]struct {
        name: []const u8,
        blob_count: u32,
        should_pass: bool,
        blob_base_fee: u256,
        max_blob_fee: u256,
    }{
        .{ .name = "Valid 1 blob", .blob_count = 1, .should_pass = true, .blob_base_fee = 1000000, .max_blob_fee = 5000000 },
        .{ .name = "Valid 3 blobs", .blob_count = 3, .should_pass = true, .blob_base_fee = 2000000, .max_blob_fee = 10000000 },
        .{ .name = "Valid max blobs", .blob_count = 6, .should_pass = true, .blob_base_fee = 3000000, .max_blob_fee = 15000000 },
        .{ .name = "Invalid blob count", .blob_count = 7, .should_pass = false, .blob_base_fee = 1000000, .max_blob_fee = 5000000 },
        .{ .name = "Insufficient fee", .blob_count = 2, .should_pass = false, .blob_base_fee = 10000000, .max_blob_fee = 5000000 },
    };

    const iterations = 1000;

    for (validation_scenarios) |scenario| {
        std.log.info("Benchmarking validation: {s}", .{scenario.name});

        var successful_validations: u32 = 0;
        var total_time: u64 = 0;

        const start_time = timing.nanoTimestamp();

        for (0..iterations) |i| {
            var transaction = BlobTransaction.init(allocator);
            defer transaction.deinit();

            // Set up transaction
            transaction.chain_id = 1;
            transaction.nonce = i;
            transaction.max_fee_per_gas = 20000000000;
            transaction.max_priority_fee_per_gas = 2000000000;
            transaction.gas_limit = 21000;
            transaction.to = create_test_address(i);
            transaction.value = 1000000000000000000;
            transaction.max_fee_per_blob_gas = scenario.max_blob_fee;

            if (scenario.blob_count <= blob_types.MAX_BLOBS_PER_TRANSACTION) {
                // Create blob sidecar data
                var blobs = try allocator.alloc(blob_types.Blob, scenario.blob_count);
                defer allocator.free(blobs);

                var commitments = try allocator.alloc(blob_types.KZGCommitment, scenario.blob_count);
                defer allocator.free(commitments);

                var proofs = try allocator.alloc(blob_types.KZGProof, scenario.blob_count);
                defer allocator.free(proofs);

                for (0..scenario.blob_count) |j| {
                    blobs[j] = create_test_blob(i + j);
                    commitments[j] = create_test_commitment(i + j);
                    proofs[j] = create_test_proof(i + j);
                }

                try transaction.set_blob_sidecar(blobs, commitments, proofs);
                try transaction.set_versioned_hashes_from_commitments(commitments);
            } else {
                // Create invalid versioned hashes for blob count > MAX
                var versioned_hashes = try allocator.alloc(blob_types.VersionedHash, scenario.blob_count);
                defer allocator.free(versioned_hashes);

                for (0..scenario.blob_count) |j| {
                    const commitment = create_test_commitment(i + j);
                    versioned_hashes[j] = blob_types.VersionedHash.compute_versioned_hash(&commitment);
                }

                // This will be cleaned up by deinit
                if (transaction.blob_versioned_hashes.len > 0) {
                    allocator.free(transaction.blob_versioned_hashes);
                }
                transaction.blob_versioned_hashes = versioned_hashes;
            }

            // Validate transaction
            const validation_result = transaction.validate(scenario.blob_base_fee);
            if (validation_result) |_| {
                if (scenario.should_pass) {
                    successful_validations += 1;
                }
            } else |_| {
                if (!scenario.should_pass) {
                    successful_validations += 1;
                }
            }

            std.mem.doNotOptimizeAway(&transaction);
        }

        const end_time = timing.nanoTimestamp();
        total_time = end_time - start_time;

        const avg_time = total_time / iterations;
        const throughput = @as(f64, @floatFromInt(iterations * 1000000000)) / @as(f64, @floatFromInt(total_time));
        const success_rate = @as(f64, @floatFromInt(successful_validations)) / @as(f64, @floatFromInt(iterations)) * 100.0;

        std.log.info("  {s}:", .{scenario.name});
        std.log.info("    Average validation time: {d:.2f}μs", .{@as(f64, @floatFromInt(avg_time)) / 1000.0});
        std.log.info("    Throughput: {d:.2f} validations/sec", .{throughput});
        std.log.info("    Success rate: {d:.1f}%", .{success_rate});
    }
}

/// Benchmark block-level transaction validation
pub fn block_validation_benchmark(allocator: std.mem.Allocator) !void {
    std.log.info("=== Block-level Transaction Validation Benchmark ===", .{});

    const block_scenarios = [_]struct {
        name: []const u8,
        transaction_count: u32,
        avg_blob_count: u32,
    }{
        .{ .name = "Small block", .transaction_count = 10, .avg_blob_count = 2 },
        .{ .name = "Medium block", .transaction_count = 50, .avg_blob_count = 3 },
        .{ .name = "Large block", .transaction_count = 100, .avg_blob_count = 2 },
        .{ .name = "Max blob block", .transaction_count = 20, .avg_blob_count = 6 },
    };

    const iterations = 10;

    for (block_scenarios) |scenario| {
        std.log.info("Benchmarking block validation: {s}", .{scenario.name});

        var total_time: u64 = 0;
        var total_transactions_processed: u32 = 0;

        const start_time = timing.nanoTimestamp();

        for (0..iterations) |block_num| {
            var current_block_blob_gas: u64 = 0;
            const current_blob_base_fee: u256 = 2000000 + @as(u256, @intCast(block_num)) * 100000;

            // Process transactions in the block
            for (0..scenario.transaction_count) |tx_idx| {
                var transaction = BlobTransaction.init(allocator);
                defer transaction.deinit();

                // Set up transaction
                transaction.chain_id = 1;
                transaction.nonce = tx_idx;
                transaction.max_fee_per_gas = 20000000000;
                transaction.max_priority_fee_per_gas = 2000000000;
                transaction.gas_limit = 21000;
                transaction.to = create_test_address(tx_idx);
                transaction.value = 1000000000000000000;
                transaction.max_fee_per_blob_gas = current_blob_base_fee + 1000000;

                const blob_count = scenario.avg_blob_count;

                // Create blob data
                var blobs = try allocator.alloc(blob_types.Blob, blob_count);
                defer allocator.free(blobs);

                var commitments = try allocator.alloc(blob_types.KZGCommitment, blob_count);
                defer allocator.free(commitments);

                var proofs = try allocator.alloc(blob_types.KZGProof, blob_count);
                defer allocator.free(proofs);

                for (0..blob_count) |j| {
                    blobs[j] = create_test_blob(tx_idx + j);
                    commitments[j] = create_test_commitment(tx_idx + j);
                    proofs[j] = create_test_proof(tx_idx + j);
                }

                try transaction.set_blob_sidecar(blobs, commitments, proofs);
                try transaction.set_versioned_hashes_from_commitments(commitments);

                // Validate for block inclusion
                const validation_result = BlobTransactionValidator.validate_for_block(
                    &transaction,
                    current_blob_base_fee,
                    current_block_blob_gas,
                );

                if (validation_result) |_| {
                    current_block_blob_gas += transaction.get_blob_gas_used();
                    total_transactions_processed += 1;
                } else |_| {
                    // Transaction rejected
                }

                std.mem.doNotOptimizeAway(&transaction);
            }
        }

        const end_time = timing.nanoTimestamp();
        total_time = end_time - start_time;

        const total_tx_attempts = iterations * scenario.transaction_count;
        const avg_time_per_block = total_time / iterations;
        const avg_time_per_tx = total_time / total_tx_attempts;
        const block_throughput = @as(f64, @floatFromInt(iterations * 1000000000)) / @as(f64, @floatFromInt(total_time));
        const tx_throughput = @as(f64, @floatFromInt(total_tx_attempts * 1000000000)) / @as(f64, @floatFromInt(total_time));
        const success_rate = @as(f64, @floatFromInt(total_transactions_processed)) / @as(f64, @floatFromInt(total_tx_attempts)) * 100.0;

        std.log.info("  {s}:", .{scenario.name});
        std.log.info("    Average block validation time: {d:.2f}ms", .{@as(f64, @floatFromInt(avg_time_per_block)) / 1000000.0});
        std.log.info("    Average transaction validation time: {d:.2f}μs", .{@as(f64, @floatFromInt(avg_time_per_tx)) / 1000.0});
        std.log.info("    Block throughput: {d:.2f} blocks/sec", .{block_throughput});
        std.log.info("    Transaction throughput: {d:.2f} tx/sec", .{tx_throughput});
        std.log.info("    Transaction success rate: {d:.1f}%", .{success_rate});
    }
}

/// Benchmark gas price calculations for different transaction types
pub fn gas_price_calculations_benchmark(allocator: std.mem.Allocator) !void {
    _ = allocator;
    std.log.info("=== Gas Price Calculations Benchmark ===", .{});

    const price_scenarios = [_]struct {
        name: []const u8,
        blob_count: u32,
        base_fee: u256,
        blob_base_fee: u256,
    }{
        .{ .name = "Low fees", .blob_count = 2, .base_fee = 1000000000, .blob_base_fee = 1000000 },
        .{ .name = "Medium fees", .blob_count = 3, .base_fee = 20000000000, .blob_base_fee = 5000000 },
        .{ .name = "High fees", .blob_count = 4, .base_fee = 50000000000, .blob_base_fee = 20000000 },
        .{ .name = "Very high fees", .blob_count = 6, .base_fee = 100000000000, .blob_base_fee = 100000000 },
    };

    const iterations = 50000;

    for (price_scenarios) |scenario| {
        std.log.info("Benchmarking gas price calculations: {s}", .{scenario.name});

        var total_time: u64 = 0;
        var total_blob_fee: u256 = 0;
        var total_blob_gas: u64 = 0;

        const start_time = timing.nanoTimestamp();

        for (0..iterations) |_| {
            // Calculate blob gas used
            const blob_gas_used = blob_gas_market.BlobGasMarket.calculate_blob_gas_used(scenario.blob_count);
            total_blob_gas += blob_gas_used;

            // Calculate blob fee
            const blob_fee = blob_gas_market.BlobGasMarket.calculate_blob_fee(scenario.blob_count, scenario.blob_base_fee);
            total_blob_fee += blob_fee;

            // Validate blob gas limit
            _ = blob_gas_market.BlobGasMarket.validate_blob_gas_limit(scenario.blob_count);

            // Validate fee affordability
            const max_fee = scenario.blob_base_fee + 2000000;
            _ = blob_gas_market.BlobGasMarket.validate_blob_fee_affordability(max_fee, scenario.blob_base_fee);

            // Simulate additional gas calculations
            const priority_fee: u256 = 2000000000;
            const max_fee_per_gas = scenario.base_fee + priority_fee;
            const gas_limit: u64 = 21000;
            const total_gas_fee = max_fee_per_gas * gas_limit;

            // Prevent optimization
            std.mem.doNotOptimizeAway(total_gas_fee);
        }

        const end_time = timing.nanoTimestamp();
        total_time = end_time - start_time;

        const avg_time = total_time / iterations;
        const throughput = @as(f64, @floatFromInt(iterations * 1000000000)) / @as(f64, @floatFromInt(total_time));
        const avg_blob_fee = total_blob_fee / iterations;
        const avg_blob_gas = total_blob_gas / iterations;

        std.log.info("  {s}:", .{scenario.name});
        std.log.info("    Average calculation time: {d:.2f}ns", .{@as(f64, @floatFromInt(avg_time))});
        std.log.info("    Throughput: {d:.2f} calculations/sec", .{throughput});
        std.log.info("    Average blob fee: {} wei", .{avg_blob_fee});
        std.log.info("    Average blob gas: {} gas", .{avg_blob_gas});
    }
}

// Helper functions
fn detect_transaction_type(tx_type: u8) u8 {
    return switch (tx_type) {
        LEGACY_TX_TYPE => LEGACY_TX_TYPE,
        ACCESS_LIST_TX_TYPE => ACCESS_LIST_TX_TYPE,
        EIP1559_TX_TYPE => EIP1559_TX_TYPE,
        BLOB_TX_TYPE => BLOB_TX_TYPE,
        else => LEGACY_TX_TYPE, // Default fallback
    };
}

fn create_test_address(seed: usize) primitives.Address.Address {
    var address: primitives.Address.Address = undefined;
    var prng = std.Random.DefaultPrng.init(@intCast(seed));
    const random = prng.random();

    for (0..address.len) |i| {
        address[i] = random.int(u8);
    }

    return address;
}

fn create_test_blob(seed: usize) blob_types.Blob {
    var blob: blob_types.Blob = undefined;
    var prng = std.Random.DefaultPrng.init(@intCast(seed));
    const random = prng.random();

    for (0..blob_types.FIELD_ELEMENTS_PER_BLOB) |i| {
        for (0..32) |j| {
            blob.data[i * 32 + j] = random.int(u8);
        }
    }

    return blob;
}

fn create_test_commitment(seed: usize) blob_types.KZGCommitment {
    var commitment: blob_types.KZGCommitment = undefined;
    var prng = std.Random.DefaultPrng.init(@intCast(seed));
    const random = prng.random();

    for (0..commitment.bytes.len) |i| {
        commitment.bytes[i] = random.int(u8);
    }

    return commitment;
}

fn create_test_proof(seed: usize) blob_types.KZGProof {
    var proof: blob_types.KZGProof = undefined;
    var prng = std.Random.DefaultPrng.init(@intCast(seed));
    const random = prng.random();

    for (0..proof.bytes.len) |i| {
        proof.bytes[i] = random.int(u8);
    }

    return proof;
}

// Tests to ensure benchmark functions compile
test "transaction benchmark compilation" {
    // Test that all benchmark functions compile
    _ = transaction_type_detection_benchmark;
    _ = blob_transaction_parsing_benchmark;
    _ = transaction_validation_benchmark;
    _ = block_validation_benchmark;
    _ = gas_price_calculations_benchmark;

    // Test helper functions
    const detected_type = detect_transaction_type(BLOB_TX_TYPE);
    try std.testing.expectEqual(BLOB_TX_TYPE, detected_type);

    const test_address = create_test_address(42);
    _ = test_address;

    const test_blob = create_test_blob(42);
    _ = test_blob;

    const test_commitment = create_test_commitment(42);
    _ = test_commitment;

    const test_proof = create_test_proof(42);
    _ = test_proof;
=======
const Evm = root.Evm;
const primitives = root.primitives;
const Allocator = std.mem.Allocator;

/// Transaction Processing Benchmarks
/// 
/// Measures performance of:
/// - Transaction type detection
/// - Blob transaction parsing  
/// - Transaction validation
/// - Gas price calculations
/// - Access list integration

pub fn transaction_type_detection_benchmark(allocator: Allocator) void {
    transaction_type_detection_benchmark_impl(allocator) catch |err| {
        std.log.err("Transaction type detection benchmark failed: {}", .{err});
    };
}

fn transaction_type_detection_benchmark_impl(allocator: Allocator) !void {
    _ = allocator;
    
    // Create test transaction data for different types
    const legacy_tx_data = &[_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 }; // Simple legacy transaction
    const eip1559_tx_data = &[_]u8{ 0x02, 0xf8, 0x6f }; // EIP-1559 transaction prefix
    const eip2930_tx_data = &[_]u8{ 0x01, 0xf8, 0x6f }; // EIP-2930 transaction prefix  
    const eip4844_tx_data = &[_]u8{ 0x03, 0xf8, 0x6f }; // EIP-4844 transaction prefix

    const test_data = [_][]const u8{
        legacy_tx_data,
        eip1559_tx_data,
        eip2930_tx_data,
        eip4844_tx_data,
    };

    // Benchmark transaction type detection
    for (0..1000) |_| {
        for (test_data) |tx_data| {
            const tx_type = primitives.Transaction.detect_transaction_type(tx_data);
            std.mem.doNotOptimizeAway(tx_type);
        }
    }
}

pub fn blob_transaction_parsing_benchmark(allocator: Allocator) void {
    blob_transaction_parsing_benchmark_impl(allocator) catch |err| {
        std.log.err("Blob transaction parsing benchmark failed: {}", .{err});
    };
}

fn blob_transaction_parsing_benchmark_impl(allocator: Allocator) !void {
    // Create a mock EIP-4844 blob transaction structure
    var tx_builder = primitives.Transaction.Builder.init(allocator);
    defer tx_builder.deinit();

    // Set transaction type to EIP-4844
    try tx_builder.set_transaction_type(.Eip4844);
    try tx_builder.set_chain_id(1); // Mainnet
    try tx_builder.set_nonce(42);
    try tx_builder.set_max_priority_fee_per_gas(2000000000); // 2 gwei
    try tx_builder.set_max_fee_per_gas(20000000000); // 20 gwei
    try tx_builder.set_gas_limit(21000);
    try tx_builder.set_to(primitives.Address.from_u256(0x1234567890abcdef));
    try tx_builder.set_value(1000000000000000000); // 1 ETH
    try tx_builder.set_data(&[_]u8{});

    // Add blob-specific fields
    try tx_builder.set_max_fee_per_blob_gas(1000000000); // 1 gwei
    
    // Create versioned hashes for blobs
    var versioned_hashes = std.ArrayList(Evm.blob.VersionedHash).init(allocator);
    defer versioned_hashes.deinit();
    
    for (0..3) |i| { // 3 blobs
        var hash_bytes: [32]u8 = undefined;
        hash_bytes[0] = 0x01; // Version byte
        for (1..32) |j| {
            hash_bytes[j] = @intCast((i * 31 + j) % 256);
        }
        try versioned_hashes.append(Evm.blob.VersionedHash{ .hash = hash_bytes });
    }
    
    try tx_builder.set_blob_versioned_hashes(try versioned_hashes.toOwnedSlice());

    // Build the transaction
    const transaction = try tx_builder.build();
    defer transaction.deinit(allocator);

    // Serialize transaction to bytes
    const tx_bytes = try transaction.serialize(allocator);
    defer allocator.free(tx_bytes);

    // Benchmark parsing
    for (0..100) |_| {
        var parsed_tx = try primitives.Transaction.parse(allocator, tx_bytes);
        defer parsed_tx.deinit(allocator);
        
        // Validate it's a blob transaction
        if (parsed_tx.transaction_type == .Eip4844) {
            const blob_tx = parsed_tx.eip4844.?;
            std.mem.doNotOptimizeAway(blob_tx.blob_versioned_hashes.len);
            std.mem.doNotOptimizeAway(blob_tx.max_fee_per_blob_gas);
        }
    }
}

pub fn transaction_validation_with_access_list_benchmark(allocator: Allocator) void {
    transaction_validation_with_access_list_benchmark_impl(allocator) catch |err| {
        std.log.err("Transaction validation with access list benchmark failed: {}", .{err});
    };
}

fn transaction_validation_with_access_list_benchmark_impl(allocator: Allocator) !void {
    // Create EVM instance
    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var evm_instance = try Evm.Evm.init(allocator, db_interface, null, null);
    defer evm_instance.deinit();

    // Create transaction with access list
    var tx_builder = primitives.Transaction.Builder.init(allocator);
    defer tx_builder.deinit();

    try tx_builder.set_transaction_type(.Eip2930);
    try tx_builder.set_chain_id(1);
    try tx_builder.set_nonce(1);
    try tx_builder.set_gas_price(20000000000); // 20 gwei
    try tx_builder.set_gas_limit(100000);
    try tx_builder.set_to(primitives.Address.from_u256(0x5555));
    try tx_builder.set_value(0);

    // Create access list
    var access_list = primitives.AccessList.init(allocator);
    defer access_list.deinit();

    // Add entries to access list
    for (0..10) |i| {
        const addr = primitives.Address.from_u256(@as(u256, 0x10000 + i));
        
        var storage_keys = std.ArrayList(primitives.U256).init(allocator);
        defer storage_keys.deinit();
        
        for (0..5) |j| {
            try storage_keys.append(@as(u256, i * 100 + j));
        }

        try access_list.append(.{
            .address = addr,
            .storage_keys = try storage_keys.toOwnedSlice(),
        });
    }

    try tx_builder.set_access_list(try access_list.toOwnedSlice());

    // Contract bytecode that uses multiple addresses and storage slots
    const contract_bytecode = &[_]u8{
        // Access multiple addresses and storage slots
        0x60, 0x01, // PUSH1 1
        0x60, 0x00, // PUSH1 0  
        0x55,       // SSTORE (slot 0 = 1)
        
        0x60, 0x02, // PUSH1 2
        0x60, 0x01, // PUSH1 1
        0x55,       // SSTORE (slot 1 = 2)
        
        // Load from storage
        0x60, 0x00, // PUSH1 0
        0x54,       // SLOAD
        0x60, 0x01, // PUSH1 1 
        0x54,       // SLOAD
        0x01,       // ADD
        
        // Return result
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x00, // PUSH1 0
        0x60, 0x20, // PUSH1 32
        0xf3,       // RETURN
    };

    try tx_builder.set_data(contract_bytecode);
    
    const transaction = try tx_builder.build();
    defer transaction.deinit(allocator);

    // Benchmark transaction execution with access list
    const caller = primitives.Address.from_u256(0x1111);
    const contract_addr = primitives.Address.from_u256(0x5555);
    
    try evm_instance.state.set_balance(caller, 10000000000000000000); // 10 ETH
    try evm_instance.state.set_code(contract_addr, contract_bytecode);

    for (0..50) |_| {
        // Create contract execution context with access list
        var contract = Evm.Contract.init_at_address(
            caller,
            contract_addr,
            0,
            100000,
            contract_bytecode,
            &[_]u8{},
            false,
        );
        defer contract.deinit(allocator, null);

        // Execute with access list pre-warming
        const result = try evm_instance.interpret(&contract, &[_]u8{});
        defer if (result.output) |output| allocator.free(output);
        
        std.mem.doNotOptimizeAway(result.gas_used);
    }
}

pub fn gas_price_calculation_benchmark(allocator: Allocator) void {
    gas_price_calculation_benchmark_impl(allocator) catch |err| {
        std.log.err("Gas price calculation benchmark failed: {}", .{err});
    };
}

fn gas_price_calculation_benchmark_impl(allocator: Allocator) !void {
    _ = allocator;
    
    // Test data for different transaction types and market conditions
    const base_fees = [_]u64{ 10, 50, 100, 200, 500, 1000 }; // gwei
    const priority_fees = [_]u64{ 1, 2, 5, 10, 50 }; // gwei
    const blob_base_fees = [_]u64{ 1, 10, 100, 1000 }; // wei
    
    // Benchmark EIP-1559 gas price calculations
    for (base_fees) |base_fee| {
        for (priority_fees) |priority_fee| {
            const max_fee = base_fee + priority_fee + 10; // Add buffer
            
            // Calculate effective gas price
            const effective_price = @min(max_fee, base_fee + priority_fee);
            std.mem.doNotOptimizeAway(effective_price);
            
            // Calculate gas cost
            const gas_cost = effective_price * 21000; // Standard transfer
            std.mem.doNotOptimizeAway(gas_cost);
        }
    }

    // Benchmark blob gas price calculations  
    for (blob_base_fees) |blob_base_fee| {
        const max_blob_fee = blob_base_fee * 2; // Max willing to pay
        
        // Calculate blob fee
        const blob_fee = @min(max_blob_fee, blob_base_fee);
        std.mem.doNotOptimizeAway(blob_fee);
        
        // Calculate total blob cost (for max blobs)
        const blob_gas_used = Evm.blob.GAS_PER_BLOB * Evm.blob.MAX_BLOBS_PER_TRANSACTION;
        const total_blob_cost = blob_fee * blob_gas_used;
        std.mem.doNotOptimizeAway(total_blob_cost);
    }
}

pub fn integrated_eip4844_transaction_benchmark(allocator: Allocator) void {
    integrated_eip4844_transaction_benchmark_impl(allocator) catch |err| {
        std.log.err("Integrated EIP-4844 transaction benchmark failed: {}", .{err});
    };
}

fn integrated_eip4844_transaction_benchmark_impl(allocator: Allocator) !void {
    // This benchmark simulates the full pipeline for EIP-4844 blob transaction processing
    
    // Create EVM instance
    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var evm_instance = try Evm.Evm.init(allocator, db_interface, null, null);
    defer evm_instance.deinit();

    // Initialize KZG verifier for blob validation
    var kzg_verifier = try Evm.blob.KZGVerifier.init(allocator);
    defer kzg_verifier.deinit();

    // Create test blob
    var blob = Evm.blob.Blob{};
    for (0..Evm.blob.FIELD_ELEMENTS_PER_BLOB) |i| {
        const pattern = (@as(u64, i) * 0x123456789ABCDEF) % 256;
        for (0..31) |j| {
            blob.data[i * 32 + j] = @intCast((pattern + j) % 256);
        }
    }

    // Generate KZG commitment and proof
    const commitment = try kzg_verifier.blob_to_kzg_commitment(&blob);
    const proof = try kzg_verifier.compute_blob_kzg_proof(&blob, &commitment.bytes);
    const versioned_hash = Evm.blob.blob_types.commitment_to_versioned_hash(&commitment.bytes);

    // Benchmark the complete EIP-4844 transaction processing pipeline
    for (0..10) |_| {
        // 1. Transaction parsing and validation
        const tx_type = primitives.Transaction.TransactionType.Eip4844;
        std.mem.doNotOptimizeAway(tx_type);

        // 2. Blob validation
        const blob_valid = try kzg_verifier.validate_blob_data(&blob);
        std.mem.doNotOptimizeAway(blob_valid);

        // 3. Hash validation
        const hash_valid = Evm.blob.validate_commitment_hash(&commitment.bytes, &versioned_hash.hash);
        std.mem.doNotOptimizeAway(hash_valid);

        // 4. KZG proof verification
        const proof_valid = try kzg_verifier.verify_blob_kzg_proof(&blob, &commitment.bytes, &proof.bytes);
        std.mem.doNotOptimizeAway(proof_valid);

        // 5. Blob gas market calculation
        var gas_market = Evm.blob.BlobGasMarket.init();
        const blob_base_fee = gas_market.calculate_blob_base_fee(Evm.blob.GAS_PER_BLOB);
        const data_gas_fee = gas_market.calculate_data_gas_fee(Evm.blob.GAS_PER_BLOB);
        std.mem.doNotOptimizeAway(blob_base_fee);
        std.mem.doNotOptimizeAway(data_gas_fee);

        // 6. Access list operations
        const context = Evm.access_list.Context{
            .caller = primitives.Address.from_u256(0x1111),
            .tx_origin = primitives.Address.from_u256(0x1111),
            .coinbase = primitives.Address.from_u256(0x2222),
            .contract_address = primitives.Address.from_u256(0x3333),
        };

        var access_list = Evm.access_list.AccessList.init(allocator, context);
        defer access_list.deinit();

        const test_addr = primitives.Address.from_u256(0x4444);
        const addr_cost = try access_list.access_address(test_addr);
        const storage_cost = try access_list.access_storage_slot(test_addr, 123);
        std.mem.doNotOptimizeAway(addr_cost);
        std.mem.doNotOptimizeAway(storage_cost);
    }
}

test "transaction benchmarks compile and basic execution" {
    const allocator = std.testing.allocator;
    
    // Basic compilation and execution test
    transaction_type_detection_benchmark(allocator);
    gas_price_calculation_benchmark(allocator);
    
    // Note: More complex benchmarks may require full EVM setup
>>>>>>> 5bde325 (feat: Add EIP-4844 blob transaction and access list benchmarks)
}