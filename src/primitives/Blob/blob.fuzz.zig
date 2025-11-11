//! Comprehensive fuzz tests for EIP-4844 blob operations
//!
//! Tests all blob-related functions with arbitrary inputs to ensure:
//! - No panics on invalid data
//! - Proper error handling for malformed inputs
//! - Deterministic behavior
//! - Correct blob/commitment/proof validation
//! - Gas calculation accuracy
//! - Versioned hash format compliance
//!
//! Run fuzz tests:
//!   Linux: zig build test --fuzz
//!   macOS: docker run --rm -it -v $(pwd):/workspace -w /workspace \
//!          ziglang/zig:0.15.1 zig build test --fuzz=300s

const std = @import("std");
const testing = std.testing;
const blob = @import("blob.zig");

// ===== Blob Validation Tests =====

fn fuzzBlobSizeValidation(_: void, input: []const u8) !void {
    // Any input other than exactly BYTES_PER_BLOB should be handled gracefully
    if (input.len == blob.BYTES_PER_BLOB) {
        // Valid blob size - should not panic
        var valid_blob: blob.Blob = undefined;
        @memcpy(&valid_blob, input[0..blob.BYTES_PER_BLOB]);

        // Verify it's the right size
        try testing.expectEqual(@as(usize, blob.BYTES_PER_BLOB), valid_blob.len);
        try testing.expectEqual(@as(usize, 131072), valid_blob.len);
    }
}

test "fuzz blob size validation" {
    try testing.fuzz({}, fuzzBlobSizeValidation, .{});
}

fn fuzzEncodeBlobDataLengthLimits(_: void, input: []const u8) !void {
    const allocator = testing.allocator;

    const result = blob.encodeBlobData(allocator, input) catch |err| {
        // Only expected error is DataTooLarge
        try testing.expectEqual(blob.BlobError.DataTooLarge, err);
        try testing.expect(input.len > blob.BYTES_PER_BLOB - 1);
        return;
    };

    // If successful, should be exactly BYTES_PER_BLOB size
    try testing.expectEqual(@as(usize, blob.BYTES_PER_BLOB), result.len);
    try testing.expect(input.len <= blob.BYTES_PER_BLOB - 1);
}

test "fuzz encodeBlobData length limits" {
    try testing.fuzz({}, fuzzEncodeBlobDataLengthLimits, .{});
}

fn fuzzDecodeBlobDataInvalidLengths(_: void, input: []const u8) !void {
    if (input.len < blob.BYTES_PER_BLOB) return;

    const allocator = testing.allocator;
    var test_blob: blob.Blob = undefined;
    @memcpy(&test_blob, input[0..blob.BYTES_PER_BLOB]);

    const result = blob.decodeBlobData(allocator, test_blob) catch |err| {
        // Expected errors
        try testing.expect(err == blob.BlobError.InvalidBlobData or
            err == error.OutOfMemory);
        return;
    };
    defer allocator.free(result);

    // If successful, decoded data should be valid
    try testing.expect(result.len <= blob.BYTES_PER_BLOB - 8);
}

test "fuzz decodeBlobData invalid lengths" {
    try testing.fuzz({}, fuzzDecodeBlobDataInvalidLengths, .{});
}

fn fuzzBlobEncodingRoundtrip(_: void, input: []const u8) !void {
    if (input.len > blob.BYTES_PER_BLOB - 9) return; // Need room for length prefix

    const allocator = testing.allocator;

    const encoded = blob.encodeBlobData(allocator, input) catch return;
    const decoded = blob.decodeBlobData(allocator, encoded) catch return;
    defer allocator.free(decoded);

    // Roundtrip should preserve data
    try testing.expectEqualSlices(u8, input, decoded);
}

test "fuzz blob encoding roundtrip" {
    try testing.fuzz({}, fuzzBlobEncodingRoundtrip, .{});
}

fn fuzzBlobFieldElementBoundaries(_: void, input: []const u8) !void {
    if (input.len < 32) return;

    // Each field element is 32 bytes
    // Test that we respect FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT
    const elements_count = blob.FIELD_ELEMENTS_PER_BLOB;
    const bytes_per_element = blob.BYTES_PER_FIELD_ELEMENT;
    const total_bytes = elements_count * bytes_per_element;

    try testing.expectEqual(@as(usize, 4096), elements_count);
    try testing.expectEqual(@as(usize, 32), bytes_per_element);
    try testing.expectEqual(@as(usize, 131072), total_bytes);
    try testing.expectEqual(blob.BYTES_PER_BLOB, total_bytes);
}

test "fuzz blob field element boundaries" {
    try testing.fuzz({}, fuzzBlobFieldElementBoundaries, .{});
}

// ===== Commitment and Versioned Hash Tests =====

fn fuzzCommitmentToVersionedHashDeterminism(_: void, input: []const u8) !void {
    if (input.len < 48) return;

    var commitment: blob.BlobCommitment = undefined;
    @memcpy(&commitment, input[0..48]);

    // Same commitment should always produce same versioned hash
    const hash1 = blob.commitmentToVersionedHash(commitment);
    const hash2 = blob.commitmentToVersionedHash(commitment);

    try testing.expectEqual(hash1.bytes, hash2.bytes);
}

test "fuzz commitmentToVersionedHash determinism" {
    try testing.fuzz({}, fuzzCommitmentToVersionedHashDeterminism, .{});
}

fn fuzzCommitmentToVersionedHashVersionByte(_: void, input: []const u8) !void {
    if (input.len < 48) return;

    var commitment: blob.BlobCommitment = undefined;
    @memcpy(&commitment, input[0..48]);

    const versioned_hash = blob.commitmentToVersionedHash(commitment);

    // First byte must be BLOB_COMMITMENT_VERSION_KZG
    try testing.expectEqual(blob.BLOB_COMMITMENT_VERSION_KZG, versioned_hash.bytes[0]);
    try testing.expectEqual(@as(u8, 0x01), versioned_hash.bytes[0]);

    // Should be valid
    try testing.expect(blob.isValidVersionedHash(versioned_hash));
}

test "fuzz commitmentToVersionedHash version byte" {
    try testing.fuzz({}, fuzzCommitmentToVersionedHashVersionByte, .{});
}

fn fuzzIsValidVersionedHash(_: void, input: []const u8) !void {
    if (input.len < 32) return;

    var hash: blob.VersionedHash = undefined;
    @memcpy(&hash.bytes, input[0..32]);

    const valid = blob.isValidVersionedHash(hash);

    // Valid only if first byte is BLOB_COMMITMENT_VERSION_KZG
    const expected = hash.bytes[0] == blob.BLOB_COMMITMENT_VERSION_KZG;
    try testing.expectEqual(expected, valid);
}

test "fuzz isValidVersionedHash" {
    try testing.fuzz({}, fuzzIsValidVersionedHash, .{});
}

fn fuzzInvalidVersionedHashVersions(_: void, input: []const u8) !void {
    if (input.len < 32) return;

    var hash: blob.VersionedHash = undefined;
    @memcpy(&hash.bytes, input[0..32]);

    // Force invalid version
    if (hash.bytes[0] == blob.BLOB_COMMITMENT_VERSION_KZG) {
        hash.bytes[0] = 0x00; // Change to invalid
    }

    const valid = blob.isValidVersionedHash(hash);
    try testing.expect(!valid);
}

test "fuzz invalid versioned hash versions" {
    try testing.fuzz({}, fuzzInvalidVersionedHashVersions, .{});
}

fn fuzzBlobSidecarVersionedHashConsistency(_: void, input: []const u8) !void {
    if (input.len < blob.BYTES_PER_BLOB + 48 + 48) return;

    var sidecar: blob.BlobSidecar = undefined;
    @memcpy(&sidecar.blob, input[0..blob.BYTES_PER_BLOB]);
    @memcpy(&sidecar.commitment, input[blob.BYTES_PER_BLOB .. blob.BYTES_PER_BLOB + 48]);
    @memcpy(&sidecar.proof, input[blob.BYTES_PER_BLOB + 48 .. blob.BYTES_PER_BLOB + 96]);

    const hash = sidecar.versionedHash();

    // Should match direct commitment hashing
    const expected = blob.commitmentToVersionedHash(sidecar.commitment);
    try testing.expectEqual(expected.bytes, hash.bytes);
    try testing.expect(blob.isValidVersionedHash(hash));
}

test "fuzz BlobSidecar versionedHash consistency" {
    try testing.fuzz({}, fuzzBlobSidecarVersionedHashConsistency, .{});
}

fn fuzzCommitmentAndProofSizes(_: void, input: []const u8) !void {
    if (input.len < 96) return;

    var commitment: blob.BlobCommitment = undefined;
    var proof: blob.BlobProof = undefined;
    @memcpy(&commitment, input[0..48]);
    @memcpy(&proof, input[48..96]);

    // Verify sizes are correct
    try testing.expectEqual(@as(usize, 48), commitment.len);
    try testing.expectEqual(@as(usize, 48), proof.len);
}

test "fuzz commitment and proof sizes" {
    try testing.fuzz({}, fuzzCommitmentAndProofSizes, .{});
}

// ===== Blob Gas Calculation Tests =====

fn fuzzCalculateBlobGasPriceMonotonicity(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    const excess1 = std.mem.readInt(u64, input[0..8], .big);
    const excess2 = std.mem.readInt(u64, input[8..16], .big);

    const price1 = blob.calculateBlobGasPrice(excess1);
    const price2 = blob.calculateBlobGasPrice(excess2);

    // Price should be monotonically increasing with excess gas
    if (excess1 < excess2) {
        try testing.expect(price1 <= price2);
    } else if (excess1 > excess2) {
        try testing.expect(price1 >= price2);
    } else {
        try testing.expectEqual(price1, price2);
    }

    // Price should never be less than MIN_BLOB_BASE_FEE
    try testing.expect(price1 >= blob.MIN_BLOB_BASE_FEE);
    try testing.expect(price2 >= blob.MIN_BLOB_BASE_FEE);
}

test "fuzz calculateBlobGasPrice monotonicity" {
    try testing.fuzz({}, fuzzCalculateBlobGasPriceMonotonicity, .{});
}

fn fuzzCalculateBlobGasPriceDeterminism(_: void, input: []const u8) !void {
    if (input.len < 8) return;

    const excess = std.mem.readInt(u64, input[0..8], .big);

    // Same excess should always produce same price
    const price1 = blob.calculateBlobGasPrice(excess);
    const price2 = blob.calculateBlobGasPrice(excess);

    try testing.expectEqual(price1, price2);
}

test "fuzz calculateBlobGasPrice determinism" {
    try testing.fuzz({}, fuzzCalculateBlobGasPriceDeterminism, .{});
}

fn fuzzCalculateBlobGasPriceZeroExcess(_: void, input: []const u8) !void {
    if (input.len == 0 or input[0] != 0) return;

    const price = blob.calculateBlobGasPrice(0);
    try testing.expectEqual(blob.MIN_BLOB_BASE_FEE, price);
}

test "fuzz calculateBlobGasPrice zero excess" {
    try testing.fuzz({}, fuzzCalculateBlobGasPriceZeroExcess, .{});
}

fn fuzzCalculateExcessBlobGasBoundary(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    const parent_excess = std.mem.readInt(u64, input[0..8], .big);
    const parent_used = std.mem.readInt(u64, input[8..16], .big);

    const excess = blob.calculateExcessBlobGas(parent_excess, parent_used);

    const target = 393216; // 3 * BLOB_GAS_PER_BLOB

    // If total < target, excess should be 0
    if (parent_excess + parent_used < target) {
        try testing.expectEqual(@as(u64, 0), excess);
    } else {
        // Otherwise, excess = total - target
        try testing.expectEqual(parent_excess + parent_used - target, excess);
    }
}

test "fuzz calculateExcessBlobGas boundary" {
    try testing.fuzz({}, fuzzCalculateExcessBlobGasBoundary, .{});
}

fn fuzzCalculateExcessBlobGasNoOverflow(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    const parent_excess = std.mem.readInt(u64, input[0..8], .big);
    const parent_used = std.mem.readInt(u64, input[8..16], .big);

    // Should handle any values without overflow/panic
    const excess = blob.calculateExcessBlobGas(parent_excess, parent_used);

    // Result should never be negative (it's unsigned, but verify logic)
    _ = excess;
}

test "fuzz calculateExcessBlobGas no overflow" {
    try testing.fuzz({}, fuzzCalculateExcessBlobGasNoOverflow, .{});
}

fn fuzzBlobGasConstants(_: void, input: []const u8) !void {
    _ = input;

    // Verify EIP-4844 constants are correct
    try testing.expectEqual(@as(usize, 4096), blob.FIELD_ELEMENTS_PER_BLOB);
    try testing.expectEqual(@as(usize, 32), blob.BYTES_PER_FIELD_ELEMENT);
    try testing.expectEqual(@as(usize, 131072), blob.BYTES_PER_BLOB);
    try testing.expectEqual(@as(usize, 6), blob.MAX_BLOBS_PER_TRANSACTION);
    try testing.expectEqual(@as(u8, 0x01), blob.BLOB_COMMITMENT_VERSION_KZG);
    try testing.expectEqual(@as(u64, 3338477), blob.BLOB_BASE_FEE_UPDATE_FRACTION);
    try testing.expectEqual(@as(u64, 1), blob.MIN_BLOB_BASE_FEE);
    try testing.expectEqual(@as(u64, 131072), blob.BLOB_GAS_PER_BLOB);
}

test "fuzz blob gas constants" {
    try testing.fuzz({}, fuzzBlobGasConstants, .{});
}

// ===== BlobTransaction Validation Tests =====

fn fuzzBlobTransactionValidateBlobCount(_: void, input: []const u8) !void {
    if (input.len < 8) return;

    // Create a random number of versioned hashes
    const count = @min(input[0] % 20, 20); // Cap at 20 to avoid huge allocations
    var hashes: [20]blob.VersionedHash = undefined;

    for (0..count) |i| {
        const offset = (i * 32) % (input.len - 31);
        if (offset + 32 <= input.len) {
            @memcpy(&hashes[i].bytes, input[offset .. offset + 32]);
            // Ensure valid version
            hashes[i].bytes[0] = blob.BLOB_COMMITMENT_VERSION_KZG;
        } else {
            hashes[i].bytes = [_]u8{0x01} ++ [_]u8{0x00} ** 31;
        }
    }

    const max_fee = if (input.len >= 16) std.mem.readInt(u64, input[8..16], .big) else 1;
    const max_fee_nonzero = if (max_fee == 0) 1 else max_fee;

    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = max_fee_nonzero,
        .blob_versioned_hashes = hashes[0..count],
    };

    const result = tx.validate() catch |err| {
        // Expected errors
        try testing.expect(err == blob.BlobError.NoBlobs or
            err == blob.BlobError.TooManyBlobs or
            err == blob.BlobError.InvalidVersionedHash);

        if (err == blob.BlobError.NoBlobs) {
            try testing.expectEqual(@as(usize, 0), count);
        }
        if (err == blob.BlobError.TooManyBlobs) {
            try testing.expect(count > blob.MAX_BLOBS_PER_TRANSACTION);
        }
        return;
    };

    _ = result;

    // If successful, verify constraints
    try testing.expect(count > 0);
    try testing.expect(count <= blob.MAX_BLOBS_PER_TRANSACTION);
}

test "fuzz BlobTransaction validate blob count" {
    try testing.fuzz({}, fuzzBlobTransactionValidateBlobCount, .{});
}

fn fuzzBlobTransactionValidateMaxFee(_: void, input: []const u8) !void {
    if (input.len < 40) return;

    var hash: blob.VersionedHash = undefined;
    @memcpy(&hash.bytes, input[0..32]);
    hash.bytes[0] = blob.BLOB_COMMITMENT_VERSION_KZG; // Ensure valid

    const hashes = [_]blob.VersionedHash{hash};
    const max_fee = std.mem.readInt(u64, input[32..40], .big);

    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = max_fee,
        .blob_versioned_hashes = &hashes,
    };

    const result = tx.validate() catch |err| {
        try testing.expectEqual(blob.BlobError.ZeroMaxFeePerBlobGas, err);
        try testing.expectEqual(@as(u64, 0), max_fee);
        return;
    };

    _ = result;
    try testing.expect(max_fee > 0);
}

test "fuzz BlobTransaction validate max fee" {
    try testing.fuzz({}, fuzzBlobTransactionValidateMaxFee, .{});
}

fn fuzzBlobTransactionValidateInvalidHashes(_: void, input: []const u8) !void {
    if (input.len < 32) return;

    var hash: blob.VersionedHash = undefined;
    @memcpy(&hash.bytes, input[0..32]);

    // Force invalid version
    hash.bytes[0] = if (hash.bytes[0] == blob.BLOB_COMMITMENT_VERSION_KZG)
        0x00
    else
        hash.bytes[0];

    const hashes = [_]blob.VersionedHash{hash};
    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    const result = tx.validate();
    try testing.expectError(blob.BlobError.InvalidVersionedHash, result);
}

test "fuzz BlobTransaction validate invalid hashes" {
    try testing.fuzz({}, fuzzBlobTransactionValidateInvalidHashes, .{});
}

fn fuzzBlobTransactionBlobGasUsedCalculation(_: void, input: []const u8) !void {
    if (input.len < 8) return;

    const count = @min((input[0] % 6) + 1, 6); // 1-6 blobs
    var hashes: [6]blob.VersionedHash = undefined;

    for (0..count) |i| {
        hashes[i].bytes = [_]u8{blob.BLOB_COMMITMENT_VERSION_KZG} ++ [_]u8{@intCast(i)} ** 31;
    }

    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = 1000,
        .blob_versioned_hashes = hashes[0..count],
    };

    const gas_used = tx.blobGasUsed();

    // Should be count * BLOB_GAS_PER_BLOB
    const expected = count * blob.BLOB_GAS_PER_BLOB;
    try testing.expectEqual(expected, gas_used);
}

test "fuzz BlobTransaction blobGasUsed calculation" {
    try testing.fuzz({}, fuzzBlobTransactionBlobGasUsedCalculation, .{});
}

fn fuzzBlobTransactionBlobGasCostCalculation(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    const count = @min((input[0] % 6) + 1, 6);
    const base_fee = std.mem.readInt(u64, input[8..16], .big);

    var hashes: [6]blob.VersionedHash = undefined;
    for (0..count) |i| {
        hashes[i].bytes = [_]u8{blob.BLOB_COMMITMENT_VERSION_KZG} ++ [_]u8{@intCast(i)} ** 31;
    }

    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = 1000,
        .blob_versioned_hashes = hashes[0..count],
    };

    const cost = tx.blobGasCost(base_fee);

    // Should be gas_used * base_fee
    const gas_used = count * blob.BLOB_GAS_PER_BLOB;
    const expected = gas_used * base_fee;
    try testing.expectEqual(expected, cost);
}

test "fuzz BlobTransaction blobGasCost calculation" {
    try testing.fuzz({}, fuzzBlobTransactionBlobGasCostCalculation, .{});
}

fn fuzzBlobTransactionMaxBlobsBoundary(_: void, input: []const u8) !void {
    if (input.len < 1) return;

    // Test exactly at MAX_BLOBS_PER_TRANSACTION
    var hashes: [blob.MAX_BLOBS_PER_TRANSACTION]blob.VersionedHash = undefined;
    for (0..blob.MAX_BLOBS_PER_TRANSACTION) |i| {
        hashes[i].bytes = [_]u8{blob.BLOB_COMMITMENT_VERSION_KZG} ++ [_]u8{@intCast(i % 255)} ** 31;
    }

    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    // Should be valid
    try tx.validate();

    // Gas used should be max
    const expected_gas = blob.MAX_BLOBS_PER_TRANSACTION * blob.BLOB_GAS_PER_BLOB;
    try testing.expectEqual(expected_gas, tx.blobGasUsed());
}

test "fuzz BlobTransaction max blobs boundary" {
    try testing.fuzz({}, fuzzBlobTransactionMaxBlobsBoundary, .{});
}

fn fuzzBlobTransactionOneOverMaxBlobs(_: void, input: []const u8) !void {
    _ = input;

    var hashes: [blob.MAX_BLOBS_PER_TRANSACTION + 1]blob.VersionedHash = undefined;
    for (0..hashes.len) |i| {
        hashes[i].bytes = [_]u8{blob.BLOB_COMMITMENT_VERSION_KZG} ++ [_]u8{@intCast(i % 255)} ** 31;
    }

    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    // Should fail with TooManyBlobs
    const result = tx.validate();
    try testing.expectError(blob.BlobError.TooManyBlobs, result);
}

test "fuzz BlobTransaction one over max blobs" {
    try testing.fuzz({}, fuzzBlobTransactionOneOverMaxBlobs, .{});
}

// ===== Gas Economics Simulation Tests =====

fn fuzzBlobEconomicsSimulation(_: void, input: []const u8) !void {
    if (input.len < 32) return;

    var excess_blob_gas: u64 = 0;

    // Simulate multiple blocks with varying blob usage
    for (0..@min(input.len / 8, 10)) |i| {
        const offset = i * 8;
        if (offset + 8 > input.len) break;

        const blobs_used = @min(input[offset] % 7, 6); // 0-6 blobs
        const blob_gas_used = blobs_used * blob.BLOB_GAS_PER_BLOB;

        // Calculate price before update
        const price = blob.calculateBlobGasPrice(excess_blob_gas);
        try testing.expect(price >= blob.MIN_BLOB_BASE_FEE);

        // Update excess for next block
        excess_blob_gas = blob.calculateExcessBlobGas(excess_blob_gas, blob_gas_used);
    }
}

test "fuzz blob economics simulation" {
    try testing.fuzz({}, fuzzBlobEconomicsSimulation, .{});
}

fn fuzzExcessBlobGasAccumulation(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    var excess: u64 = 0;

    // Use more than target consistently
    for (0..@min(input.len / 8, 5)) |i| {
        const offset = i * 8;
        if (offset + 8 > input.len) break;

        const usage = std.mem.readInt(u64, input[offset .. offset + 8], .big) % (6 * blob.BLOB_GAS_PER_BLOB);
        const prev_excess = excess;
        excess = blob.calculateExcessBlobGas(excess, usage);

        // If usage is high, excess should not decrease
        if (usage >= 4 * blob.BLOB_GAS_PER_BLOB) {
            try testing.expect(excess >= prev_excess or excess == 0);
        }
    }
}

test "fuzz excess blob gas accumulation" {
    try testing.fuzz({}, fuzzExcessBlobGasAccumulation, .{});
}

fn fuzzExcessBlobGasDecay(_: void, input: []const u8) !void {
    if (input.len < 8) return;

    // Start with high excess
    var excess = std.mem.readInt(u64, input[0..8], .big) % (100 * blob.BLOB_GAS_PER_BLOB);
    if (excess == 0) return;

    const initial_excess = excess;

    // Use minimal blobs consistently
    for (0..20) |_| {
        excess = blob.calculateExcessBlobGas(excess, blob.BLOB_GAS_PER_BLOB);
        if (excess == 0) break;
    }

    // Should have decreased or reached zero
    try testing.expect(excess <= initial_excess);
}

test "fuzz excess blob gas decay" {
    try testing.fuzz({}, fuzzExcessBlobGasDecay, .{});
}

// ===== Property-Based Tests =====

fn fuzzVersionedHashIsAlways32Bytes(_: void, input: []const u8) !void {
    if (input.len < 48) return;

    var commitment: blob.BlobCommitment = undefined;
    @memcpy(&commitment, input[0..48]);

    const hash = blob.commitmentToVersionedHash(commitment);
    try testing.expectEqual(@as(usize, 32), hash.bytes.len);
}

test "fuzz versioned hash is always 32 bytes" {
    try testing.fuzz({}, fuzzVersionedHashIsAlways32Bytes, .{});
}

fn fuzzBlobGasPriceNeverDecreasesWithMoreExcess(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    var excess1 = std.mem.readInt(u64, input[0..8], .big);
    var excess2 = std.mem.readInt(u64, input[8..16], .big);

    // Sort to ensure excess1 <= excess2
    if (excess1 > excess2) {
        const tmp = excess1;
        excess1 = excess2;
        excess2 = tmp;
    }

    const price1 = blob.calculateBlobGasPrice(excess1);
    const price2 = blob.calculateBlobGasPrice(excess2);

    // Price should be monotonic
    try testing.expect(price2 >= price1);
}

test "fuzz blob gas price never decreases with more excess" {
    try testing.fuzz({}, fuzzBlobGasPriceNeverDecreasesWithMoreExcess, .{});
}

fn fuzzBlobTransactionGasCalculationsAreConsistent(_: void, input: []const u8) !void {
    if (input.len < 16) return;

    const count = @min((input[0] % 6) + 1, 6);
    const base_fee = std.mem.readInt(u64, input[8..16], .big);

    var hashes: [6]blob.VersionedHash = undefined;
    for (0..count) |i| {
        hashes[i].bytes = [_]u8{blob.BLOB_COMMITMENT_VERSION_KZG} ++ [_]u8{@intCast(i)} ** 31;
    }

    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = 1000,
        .blob_versioned_hashes = hashes[0..count],
    };

    // Gas used should match count
    try testing.expectEqual(count * blob.BLOB_GAS_PER_BLOB, tx.blobGasUsed());

    // Cost should be gas * fee
    try testing.expectEqual(tx.blobGasUsed() * base_fee, tx.blobGasCost(base_fee));
}

test "fuzz blob transaction gas calculations are consistent" {
    try testing.fuzz({}, fuzzBlobTransactionGasCalculationsAreConsistent, .{});
}

fn fuzzCommitmentHashingIsDeterministic(_: void, input: []const u8) !void {
    if (input.len < 48) return;

    var commitment: blob.BlobCommitment = undefined;
    @memcpy(&commitment, input[0..48]);

    // Hash multiple times
    const hash1 = blob.commitmentToVersionedHash(commitment);
    const hash2 = blob.commitmentToVersionedHash(commitment);
    const hash3 = blob.commitmentToVersionedHash(commitment);

    try testing.expectEqual(hash1.bytes, hash2.bytes);
    try testing.expectEqual(hash2.bytes, hash3.bytes);
}

test "fuzz commitment hashing is deterministic" {
    try testing.fuzz({}, fuzzCommitmentHashingIsDeterministic, .{});
}

fn fuzzBlobEncodingPreservesLengthInfo(_: void, input: []const u8) !void {
    if (input.len > blob.BYTES_PER_BLOB - 9) return;

    const allocator = testing.allocator;

    const encoded = blob.encodeBlobData(allocator, input) catch return;

    // First 8 bytes should be length
    const stored_len = std.mem.bytesToValue(usize, encoded[0..8]);
    try testing.expectEqual(input.len, stored_len);

    // Decode and verify
    const decoded = blob.decodeBlobData(allocator, encoded) catch return;
    defer allocator.free(decoded);

    try testing.expectEqual(input.len, decoded.len);
}

test "fuzz blob encoding preserves length info" {
    try testing.fuzz({}, fuzzBlobEncodingPreservesLengthInfo, .{});
}

fn fuzzZeroExcessGivesMinimumPrice(_: void, input: []const u8) !void {
    _ = input;

    const price = blob.calculateBlobGasPrice(0);
    try testing.expectEqual(blob.MIN_BLOB_BASE_FEE, price);
}

test "fuzz zero excess gives minimum price" {
    try testing.fuzz({}, fuzzZeroExcessGivesMinimumPrice, .{});
}

fn fuzzMaxBlobsPerTransactionConstantIsEnforced(_: void, input: []const u8) !void {
    if (input.len < 1) return;

    const count = input[0] % 20;

    var hashes: [20]blob.VersionedHash = undefined;
    for (0..@min(count, 20)) |i| {
        hashes[i].bytes = [_]u8{blob.BLOB_COMMITMENT_VERSION_KZG} ++ [_]u8{@intCast(i)} ** 31;
    }

    const tx = blob.BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = hashes[0..@min(count, 20)],
    };

    const result = tx.validate();

    if (count > blob.MAX_BLOBS_PER_TRANSACTION) {
        try testing.expectError(blob.BlobError.TooManyBlobs, result);
    } else if (count == 0) {
        try testing.expectError(blob.BlobError.NoBlobs, result);
    } else {
        try result catch |err| {
            try testing.expect(false); // Should not error
            _ = err;
        };
    }
}

test "fuzz max blobs per transaction constant is enforced" {
    try testing.fuzz({}, fuzzMaxBlobsPerTransactionConstantIsEnforced, .{});
}
