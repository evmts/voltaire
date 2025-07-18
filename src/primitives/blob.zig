const std = @import("std");
const testing = std.testing;
const crypto_pkg = @import("crypto");
const hash = crypto_pkg.Hash;
const hex = @import("hex.zig");
const Hash = hash.Hash;
const Allocator = std.mem.Allocator;

// EIP-4844 Blob Transaction Constants
pub const FIELD_ELEMENTS_PER_BLOB = 4096;
pub const BYTES_PER_FIELD_ELEMENT = 32;
pub const BYTES_PER_BLOB = FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT; // 131072
pub const MAX_BLOBS_PER_TRANSACTION = 6;
pub const BLOB_COMMITMENT_VERSION_KZG = 0x01;
pub const BLOB_BASE_FEE_UPDATE_FRACTION = 3338477;
pub const MIN_BLOB_BASE_FEE = 1;
pub const BLOB_GAS_PER_BLOB = 131072; // 2^17

// Blob error types
pub const BlobError = error{
    NoBlobs,
    TooManyBlobs,
    InvalidVersionedHash,
    ZeroMaxFeePerBlobGas,
    DataTooLarge,
    InvalidBlobData,
    OutOfMemory,
};

// Blob types
pub const Blob = [BYTES_PER_BLOB]u8;
pub const BlobCommitment = [48]u8;
pub const BlobProof = [48]u8;
pub const VersionedHash = Hash;

// Create versioned hash from commitment
pub fn commitmentToVersionedHash(commitment: BlobCommitment) VersionedHash {
    // versioned_hash = BLOB_COMMITMENT_VERSION_KZG ++ sha256(commitment)[1:]
    var hashInput: [48]u8 = commitment;
    const sha256Hash = hash.sha256(&hashInput);

    var versioned: VersionedHash = undefined;
    versioned.bytes[0] = BLOB_COMMITMENT_VERSION_KZG;
    @memcpy(versioned.bytes[1..32], sha256Hash.bytes[1..32]);

    return versioned;
}

// Validate versioned hash
pub fn isValidVersionedHash(h: VersionedHash) bool {
    return h.bytes[0] == BLOB_COMMITMENT_VERSION_KZG;
}

// Calculate blob gas price
pub fn calculateBlobGasPrice(excessBlobGas: u64) u64 {
    // fake_exponential(MIN_BLOB_BASE_FEE, excess_blob_gas, BLOB_BASE_FEE_UPDATE_FRACTION)
    return fakeExponential(MIN_BLOB_BASE_FEE, excessBlobGas, BLOB_BASE_FEE_UPDATE_FRACTION);
}

// Fake exponential from EIP-4844
fn fakeExponential(factor: u64, numerator: u64, denominator: u64) u64 {
    var output: u64 = 0;
    var numeratorAccum = factor * denominator;
    var i: u64 = 1;

    while (numeratorAccum > 0) {
        output += numeratorAccum;
        numeratorAccum = (numeratorAccum * numerator) / (denominator * i);
        i += 1;

        // Prevent infinite loop
        if (i > 256) break;
    }

    return output / denominator;
}

// Calculate excess blob gas for next block
pub fn calculateExcessBlobGas(parentExcessBlobGas: u64, parentBlobGasUsed: u64) u64 {
    const targetBlobGasPerBlock = 393216; // 3 * BLOB_GAS_PER_BLOB

    if (parentExcessBlobGas + parentBlobGasUsed < targetBlobGasPerBlock) {
        return 0;
    } else {
        return parentExcessBlobGas + parentBlobGasUsed - targetBlobGasPerBlock;
    }
}

// Blob transaction validation
pub const BlobTransaction = struct {
    maxFeePerBlobGas: u64,
    blobVersionedHashes: []const VersionedHash,

    pub fn validate(self: *const BlobTransaction) !void {
        // Must have at least one blob
        if (self.blobVersionedHashes.len == 0) {
            return BlobError.NoBlobs;
        }

        // Cannot exceed max blobs
        if (self.blobVersionedHashes.len > MAX_BLOBS_PER_TRANSACTION) {
            return BlobError.TooManyBlobs;
        }

        // All hashes must be valid
        for (self.blobVersionedHashes) |h| {
            if (!isValidVersionedHash(h)) {
                return BlobError.InvalidVersionedHash;
            }
        }

        // Max fee must be positive
        if (self.maxFeePerBlobGas == 0) {
            return BlobError.ZeroMaxFeePerBlobGas;
        }
    }

    pub fn blobGasUsed(self: *const BlobTransaction) u64 {
        return self.blobVersionedHashes.len * BLOB_GAS_PER_BLOB;
    }

    pub fn blobGasCost(self: *const BlobTransaction, blobBaseFee: u64) u64 {
        return self.blobGasUsed() * blobBaseFee;
    }
};

// Blob sidecar for consensus layer
pub const BlobSidecar = struct {
    blob: Blob,
    commitment: BlobCommitment,
    proof: BlobProof,

    pub fn versionedHash(self: *const BlobSidecar) VersionedHash {
        return commitmentToVersionedHash(self.commitment);
    }
};

// Helpers for blob data encoding
pub fn encodeBlobData(allocator: Allocator, data: []const u8) !Blob {
    _ = allocator;

    if (data.len > BYTES_PER_BLOB - 1) {
        return BlobError.DataTooLarge;
    }

    var blob: Blob = [_]u8{0x00} ** BYTES_PER_BLOB;

    // Simple encoding: length prefix + data
    // In practice, this would use more sophisticated encoding
    const lenBytes = std.mem.toBytes(data.len);
    @memcpy(blob[0..8], &lenBytes);
    @memcpy(blob[8 .. 8 + data.len], data);

    return blob;
}

pub fn decodeBlobData(allocator: Allocator, blob: Blob) ![]u8 {
    // Decode length
    const len = std.mem.bytesToValue(usize, blob[0..8]);

    if (len > BYTES_PER_BLOB - 8) {
        return BlobError.InvalidBlobData;
    }

    const data = try allocator.alloc(u8, len);
    @memcpy(data, blob[8 .. 8 + len]);

    return data;
}

// Tests

test "commitment to versioned hash" {
    const commitment: BlobCommitment = [_]u8{0x12} ** 48;
    const versionedHash = commitmentToVersionedHash(commitment);

    // Should start with version byte
    try testing.expectEqual(BLOB_COMMITMENT_VERSION_KZG, versionedHash.bytes[0]);

    // Should be valid
    try testing.expect(isValidVersionedHash(versionedHash));
}

test "invalid versioned hash" {
    var h: VersionedHash = undefined;
    h.bytes = [_]u8{0x00} ** 32;
    h.bytes[0] = 0x02; // Invalid version

    try testing.expect(!isValidVersionedHash(h));
}

test "blob gas price calculation" {
    // Test with no excess gas
    const priceZero = calculateBlobGasPrice(0);
    try testing.expectEqual(@as(u64, 1), priceZero); // MIN_BLOB_BASE_FEE

    // Test with some excess gas
    const priceLow = calculateBlobGasPrice(131072); // 1 blob worth
    try testing.expect(priceLow > 1);

    // Test with high excess gas
    const priceHigh = calculateBlobGasPrice(10 * BLOB_GAS_PER_BLOB);
    try testing.expect(priceHigh > priceLow);
}

test "excess blob gas calculation" {
    const target = 393216; // 3 blobs

    // No blobs used, no excess
    var excess = calculateExcessBlobGas(0, 0);
    try testing.expectEqual(@as(u64, 0), excess);

    // Used exactly target
    excess = calculateExcessBlobGas(0, target);
    try testing.expectEqual(@as(u64, 0), excess);

    // Used more than target
    excess = calculateExcessBlobGas(0, target + BLOB_GAS_PER_BLOB);
    try testing.expectEqual(BLOB_GAS_PER_BLOB, excess);

    // With existing excess
    excess = calculateExcessBlobGas(BLOB_GAS_PER_BLOB, target);
    try testing.expectEqual(BLOB_GAS_PER_BLOB, excess);
}

test "blob transaction validation" {
    const hash1 = commitmentToVersionedHash([_]u8{0x01} ** 48);
    const hash2 = commitmentToVersionedHash([_]u8{0x02} ** 48);

    const hashes = [_]VersionedHash{ hash1, hash2 };

    var tx = BlobTransaction{
        .maxFeePerBlobGas = 1000,
        .blobVersionedHashes = &hashes,
    };

    // Should be valid
    try tx.validate();

    // Test gas calculations
    try testing.expectEqual(@as(u64, 2 * BLOB_GAS_PER_BLOB), tx.blobGasUsed());
    try testing.expectEqual(@as(u64, 2 * BLOB_GAS_PER_BLOB * 10), tx.blobGasCost(10));
}

test "blob transaction validation failures" {
    // No blobs
    var tx = BlobTransaction{
        .maxFeePerBlobGas = 1000,
        .blobVersionedHashes = &.{},
    };
    try testing.expectError(BlobError.NoBlobs, tx.validate());

    // Too many blobs
    var manyHashes: [MAX_BLOBS_PER_TRANSACTION + 1]VersionedHash = undefined;
    for (0..manyHashes.len) |i| {
        manyHashes[i] = commitmentToVersionedHash([_]u8{@intCast(i)} ** 48);
    }

    tx = BlobTransaction{
        .maxFeePerBlobGas = 1000,
        .blobVersionedHashes = &manyHashes,
    };
    try testing.expectError(BlobError.TooManyBlobs, tx.validate());

    // Invalid versioned hash
    var invalidHash: VersionedHash = undefined;
    invalidHash.bytes = [_]u8{0x00} ** 32;
    invalidHash.bytes[0] = 0xFF; // Invalid version

    tx = BlobTransaction{
        .maxFeePerBlobGas = 1000,
        .blobVersionedHashes = &[_]VersionedHash{invalidHash},
    };
    try testing.expectError(BlobError.InvalidVersionedHash, tx.validate());

    // Zero max fee
    const validHash = commitmentToVersionedHash([_]u8{0x01} ** 48);
    tx = BlobTransaction{
        .maxFeePerBlobGas = 0,
        .blobVersionedHashes = &[_]VersionedHash{validHash},
    };
    try testing.expectError(BlobError.ZeroMaxFeePerBlobGas, tx.validate());
}

test "blob sidecar" {
    const sidecar = BlobSidecar{
        .blob = [_]u8{0x00} ** BYTES_PER_BLOB,
        .commitment = [_]u8{0x12} ** 48,
        .proof = [_]u8{0x34} ** 48,
    };

    const h = sidecar.versionedHash();
    try testing.expect(isValidVersionedHash(h));
}

test "blob gas economics" {
    // Simulate block progression
    var excessBlobGas: u64 = 0;

    // Block 1: 4 blobs used (above target)
    var blobGasUsed = 4 * BLOB_GAS_PER_BLOB;
    var blobPrice = calculateBlobGasPrice(excessBlobGas);
    try testing.expectEqual(@as(u64, 1), blobPrice); // Min price initially

    excessBlobGas = calculateExcessBlobGas(excessBlobGas, blobGasUsed);
    try testing.expect(excessBlobGas > 0); // Should increase

    // Block 2: Price should have increased
    blobPrice = calculateBlobGasPrice(excessBlobGas);
    try testing.expect(blobPrice > 1);

    // Block 3: Use only 1 blob (below target)
    blobGasUsed = BLOB_GAS_PER_BLOB;
    const oldExcess = excessBlobGas;
    excessBlobGas = calculateExcessBlobGas(excessBlobGas, blobGasUsed);
    try testing.expect(excessBlobGas < oldExcess); // Should decrease
}

test "blob data encoding and decoding" {
    const allocator = testing.allocator;

    const testData = "Hello, blob world!";

    const blob = try encodeBlobData(allocator, testData);

    const decoded = try decodeBlobData(allocator, blob);
    defer allocator.free(decoded);

    try testing.expectEqualStrings(testData, decoded);
}

test "blob data too large" {
    const allocator = testing.allocator;

    const largeData = try allocator.alloc(u8, BYTES_PER_BLOB);
    defer allocator.free(largeData);
    @memset(largeData, 0xFF);

    const result = encodeBlobData(allocator, largeData);
    try testing.expectError(BlobError.DataTooLarge, result);
}
