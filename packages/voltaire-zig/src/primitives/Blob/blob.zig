const std = @import("std");
const testing = std.testing;
const hex = @import("../Hex/Hex.zig");
const Hardfork = @import("../Hardfork/hardfork.zig").Hardfork;
const Hash = [32]u8;
const Sha256 = std.crypto.hash.sha2.Sha256;
const Allocator = std.mem.Allocator;

// EIP-4844 Blob Transaction Constants
pub const FIELD_ELEMENTS_PER_BLOB = 4096;
pub const BYTES_PER_FIELD_ELEMENT = 32;
pub const BYTES_PER_BLOB = FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT; // 131072
/// Cancun (EIP-4844) blob limit. Later forks change it: see
/// `BlobSchedule` and `BlobTransaction.validateForHardfork`.
pub const MAX_BLOBS_PER_TRANSACTION = 6;
/// EIP-7594 (Osaka): a single transaction carries at most 6 blobs, whatever
/// the block limit of the active blob schedule.
pub const MAX_BLOBS_PER_TRANSACTION_EIP7594 = 6;
pub const BLOB_COMMITMENT_VERSION_KZG = 0x01;
pub const BLOB_BASE_FEE_UPDATE_FRACTION = 3338477;
pub const MIN_BLOB_BASE_FEE = 1;
pub const BLOB_GAS_PER_BLOB = 131072; // 2^17
pub const GAS_PER_BLOB: u64 = BLOB_GAS_PER_BLOB;

/// EIP-7918 execution cost bound per blob, in units of base fee (2^13 = 8,192).
pub const BLOB_BASE_COST: u64 = 8192;

// Blob error types
pub const BlobError = error{
    BlobsNotSupported,
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
pub const VersionedHash = struct { bytes: [32]u8 };

// Create versioned hash from commitment
pub fn commitmentToVersionedHash(commitment: BlobCommitment) VersionedHash {
    // versioned_hash = BLOB_COMMITMENT_VERSION_KZG ++ sha256(commitment)[1:]
    var hash_input: [48]u8 = commitment;
    var sha256_hash: [32]u8 = undefined;
    Sha256.hash(&hash_input, &sha256_hash, .{});

    var versioned = VersionedHash{ .bytes = undefined };
    versioned.bytes[0] = BLOB_COMMITMENT_VERSION_KZG;
    @memcpy(versioned.bytes[1..32], sha256_hash[1..32]);

    return versioned;
}

// Validate versioned hash
pub fn isValidVersionedHash(h: VersionedHash) bool {
    return h.bytes[0] == BLOB_COMMITMENT_VERSION_KZG;
}

// Calculate blob gas price
pub fn calculateBlobGasPrice(excess_blob_gas: u64) u64 {
    // fakeExponential(MIN_BLOB_BASE_FEE, excess_blob_gas, BLOB_BASE_FEE_UPDATE_FRACTION)
    return fakeExponential(MIN_BLOB_BASE_FEE, excess_blob_gas, BLOB_BASE_FEE_UPDATE_FRACTION);
}

/// Exact EIP-4844 `fake_exponential(factor, numerator, denominator)` capped at
/// `max_result`.
///
/// Uses `u512` intermediate arithmetic with no arbitrary iteration cap. Every
/// term is non-negative, so stopping once `output >= max_result * denominator`
/// is 100% mathematically exact and guarantees termination in O(log(max_result))
/// iterations even for `numerator == maxInt(u64)`.
fn fakeExponentialCapped(factor: u64, numerator: u64, denominator: u64, max_result: u256) u256 {
    std.debug.assert(denominator != 0);
    const denom: u512 = denominator;
    const cap: u512 = @as(u512, max_result) * denom;

    var output: u512 = 0;
    var numerator_accum: u512 = @as(u512, factor) * denom;
    var i: u512 = 1;

    while (numerator_accum > 0) {
        output += numerator_accum;
        if (output >= cap) return max_result;
        numerator_accum = (numerator_accum * numerator) / (denom * i);
        i += 1;
    }

    return @intCast(output / denom);
}

// Fake exponential from EIP-4844, clamped to [1, maxInt(u64)] for legacy u64 callers.
fn fakeExponential(factor: u64, numerator: u64, denominator: u64) u64 {
    const result = fakeExponentialCapped(factor, numerator, denominator, std.math.maxInt(u64));
    // Per EIP-4844: minimum blob gas price is 1 (MIN_BLOB_BASE_FEE)
    return if (result == 0) 1 else @intCast(result);
}

// Calculate excess blob gas for next block (legacy Cancun 2-arg API, overflow-safe)
pub fn calculateExcessBlobGas(parent_excess_blob_gas: u64, parent_blob_gas_used: u64) u64 {
    return calculateExcessBlobGasForSchedule(parent_excess_blob_gas, parent_blob_gas_used, BlobSchedule.cancun);
}

// ============================================================================
// Fork-aware Blob Fee Market: EIP-7691 (Prague), EIP-7892 (BPO), EIP-7918 (Osaka)
// ============================================================================

/// Per-fork blob fee market parameters (EIP-7840 / EIP-7691 / EIP-7892).
/// `target` and `max` count blobs per block.
pub const BlobSchedule = struct {
    /// Target number of blobs per block
    target: u64,
    /// Maximum number of blobs per block
    max: u64,
    /// Blob base fee update fraction (denominator of the exponential fee formula)
    base_fee_update_fraction: u64,

    /// Cancun (EIP-4844): target 3, max 6
    pub const cancun = BlobSchedule{ .target = 3, .max = 6, .base_fee_update_fraction = 3_338_477 };
    /// Prague (EIP-7691): target 6, max 9
    pub const prague = BlobSchedule{ .target = 6, .max = 9, .base_fee_update_fraction = 5_007_716 };
    /// Osaka initial (prior to BPO1): same parameters as Prague
    pub const osaka = prague;
    /// EIP-7892 BPO1: target 10, max 15
    pub const bpo1 = BlobSchedule{ .target = 10, .max = 15, .base_fee_update_fraction = 8_346_193 };
    /// EIP-7892 BPO2: target 14, max 21
    pub const bpo2 = BlobSchedule{ .target = 14, .max = 21, .base_fee_update_fraction = 11_684_671 };

    /// Mainnet activation timestamps (Unix seconds)
    pub const CANCUN_TIMESTAMP: u64 = 1_710_338_135;
    pub const PRAGUE_TIMESTAMP: u64 = 1_746_612_311;
    pub const OSAKA_TIMESTAMP: u64 = 1_764_798_551;
    pub const BPO1_TIMESTAMP: u64 = 1_765_290_071;
    pub const BPO2_TIMESTAMP: u64 = 1_767_747_671;

    /// Target blob gas per block (`GAS_PER_BLOB * target`).
    pub fn targetBlobGas(self: BlobSchedule) u64 {
        return self.target * BLOB_GAS_PER_BLOB;
    }

    /// Maximum blob gas per block (`GAS_PER_BLOB * max`).
    pub fn maxBlobGas(self: BlobSchedule) u64 {
        return self.max * BLOB_GAS_PER_BLOB;
    }

    /// Resolve the blob schedule for an execution hardfork.
    ///
    /// Returns `null` before Cancun (no blobs). Uses `isAtLeast` rather than an
    /// exhaustive switch so future forks (e.g. `.AMSTERDAM`) map cleanly to `.bpo2`
    /// without breaking the build.
    pub fn forHardfork(hardfork: Hardfork) ?BlobSchedule {
        if (!hardfork.isAtLeast(.CANCUN)) return null;
        if (!hardfork.isAtLeast(.PRAGUE)) return cancun;
        if (!hardfork.isAtLeast(.OSAKA)) return prague;
        if (hardfork == .OSAKA) return osaka;
        return bpo2;
    }

    /// Resolve the Ethereum mainnet blob schedule active at `timestamp` (Unix seconds),
    /// accounting for EIP-7892 BPO1 (`1765290071`) and BPO2 (`1767747671`).
    /// Returns `null` before Cancun (`1710338135`).
    pub fn forTimestamp(timestamp: u64) ?BlobSchedule {
        if (timestamp >= BPO2_TIMESTAMP) return bpo2;
        if (timestamp >= BPO1_TIMESTAMP) return bpo1;
        if (timestamp >= OSAKA_TIMESTAMP) return osaka;
        if (timestamp >= PRAGUE_TIMESTAMP) return prague;
        if (timestamp >= CANCUN_TIMESTAMP) return cancun;
        return null;
    }
};

/// Calculate exact blob base fee for `schedule` (EIP-4844 / EIP-7691 / EIP-7892).
/// Saturates at `maxInt(u256)` if the mathematical fee exceeds `u256`.
pub fn calculateBlobBaseFeeForSchedule(excess_blob_gas: u64, schedule: BlobSchedule) u256 {
    return fakeExponentialCapped(
        MIN_BLOB_BASE_FEE,
        excess_blob_gas,
        schedule.base_fee_update_fraction,
        std.math.maxInt(u256),
    );
}

/// Calculate excess blob gas for `schedule` without EIP-7918 reserve pricing
/// (Cancun / Prague EIP-7691). Uses `u128` intermediates and saturates to `u64`.
pub fn calculateExcessBlobGasForSchedule(
    parent_excess_blob_gas: u64,
    parent_blob_gas_used: u64,
    schedule: BlobSchedule,
) u64 {
    const parent_blob_gas: u128 = @as(u128, parent_excess_blob_gas) + parent_blob_gas_used;
    const target_blob_gas: u128 = @as(u128, BLOB_GAS_PER_BLOB) * schedule.target;
    if (parent_blob_gas < target_blob_gas) return 0;
    return std.math.cast(u64, parent_blob_gas - target_blob_gas) orelse std.math.maxInt(u64);
}

/// Calculate excess blob gas with the EIP-7918 reserve price (Osaka / BPO1 / BPO2).
///
/// Mirrors `ethereum/execution-specs` `osaka/vm/gas.py::calculate_excess_blob_gas`:
/// ```
/// target = GAS_PER_BLOB * schedule.target
/// if parent_excess + parent_used < target: return 0
/// if BLOB_BASE_COST * parent_base_fee > GAS_PER_BLOB * blob_base_fee(parent_excess):
///     return parent_excess + parent_used * (max - target) / max
/// return parent_excess + parent_used - target
/// ```
///
/// Uses an exact `u512` ceiling-threshold early exit for the reserve inequality,
/// so both the inequality and gas sums are completely overflow-free and fast even
/// for `maxInt(u64)` excess and `maxInt(u256)` base fees.
pub fn calculateExcessBlobGasEip7918(
    parent_excess_blob_gas: u64,
    parent_blob_gas_used: u64,
    parent_base_fee_per_gas: u256,
    schedule: BlobSchedule,
) u64 {
    std.debug.assert(schedule.max != 0);
    std.debug.assert(schedule.target <= schedule.max);
    std.debug.assert(schedule.base_fee_update_fraction != 0);

    const target_blob_gas: u128 = @as(u128, BLOB_GAS_PER_BLOB) * schedule.target;
    const parent_blob_gas: u128 = @as(u128, parent_excess_blob_gas) + parent_blob_gas_used;
    if (parent_blob_gas < target_blob_gas) return 0;

    if (parent_base_fee_per_gas > 0) {
        // Exact strict '>' equivalence for positive integers:
        // BLOB_BASE_COST * base_fee > BLOB_GAS_PER_BLOB * fee
        //   <=> fee < ceil(BLOB_BASE_COST * base_fee / BLOB_GAS_PER_BLOB)
        // Since BLOB_BASE_COST (8192) < BLOB_GAS_PER_BLOB (131072), reserve < 2^252 <= maxInt(u256).
        const reserve: u256 = @intCast(
            (@as(u512, BLOB_BASE_COST) * parent_base_fee_per_gas + BLOB_GAS_PER_BLOB - 1) / BLOB_GAS_PER_BLOB,
        );
        const fee = fakeExponentialCapped(
            MIN_BLOB_BASE_FEE,
            parent_excess_blob_gas,
            schedule.base_fee_update_fraction,
            reserve,
        );
        if (fee < reserve) {
            const delta: u128 = schedule.max - schedule.target;
            const excess: u128 = @as(u128, parent_excess_blob_gas) + (@as(u128, parent_blob_gas_used) * delta) / schedule.max;
            return std.math.cast(u64, excess) orelse std.math.maxInt(u64);
        }
    }

    return std.math.cast(u64, parent_blob_gas - target_blob_gas) orelse std.math.maxInt(u64);
}

/// Fork-aware excess blob gas: EIP-4844 (Cancun), EIP-7691 (Prague), EIP-7918 (Osaka+).
/// Returns `null` before Cancun. `parent_base_fee_per_gas` is ignored pre-Osaka.
pub fn calculateExcessBlobGasForHardfork(
    parent_excess_blob_gas: u64,
    parent_blob_gas_used: u64,
    parent_base_fee_per_gas: u256,
    hardfork: Hardfork,
) ?u64 {
    const schedule = BlobSchedule.forHardfork(hardfork) orelse return null;
    if (hardfork.isAtLeast(.OSAKA)) {
        return calculateExcessBlobGasEip7918(parent_excess_blob_gas, parent_blob_gas_used, parent_base_fee_per_gas, schedule);
    }
    return calculateExcessBlobGasForSchedule(parent_excess_blob_gas, parent_blob_gas_used, schedule);
}

/// Mainnet timestamp-aware excess blob gas: resolves BPO1/BPO2 schedules and applies
/// EIP-7918 from `OSAKA_TIMESTAMP`. Returns `null` before Cancun.
pub fn calculateExcessBlobGasForTimestamp(
    parent_excess_blob_gas: u64,
    parent_blob_gas_used: u64,
    parent_base_fee_per_gas: u256,
    timestamp: u64,
) ?u64 {
    const schedule = BlobSchedule.forTimestamp(timestamp) orelse return null;
    if (timestamp >= BlobSchedule.OSAKA_TIMESTAMP) {
        return calculateExcessBlobGasEip7918(parent_excess_blob_gas, parent_blob_gas_used, parent_base_fee_per_gas, schedule);
    }
    return calculateExcessBlobGasForSchedule(parent_excess_blob_gas, parent_blob_gas_used, schedule);
}

// Blob transaction validation
pub const BlobTransaction = struct {
    max_fee_per_blob_gas: u64,
    blob_versioned_hashes: []const VersionedHash,

    /// Validate against the Cancun limit of 6 blobs.
    ///
    /// Use `validateForHardfork` or `validateForSchedule` for later forks.
    pub fn validate(self: *const BlobTransaction) BlobError!void {
        return self.validateWithMaxBlobs(MAX_BLOBS_PER_TRANSACTION);
    }

    /// Validate against the blob limit of `hardfork`.
    ///
    /// - Cancun: 6 (EIP-4844)
    /// - Prague: 9 (EIP-7691)
    /// - Osaka and later: 6 per transaction (EIP-7594), even when a BPO
    ///   schedule raises the block limit to 15 or 21
    ///
    /// Returns `BlobError.BlobsNotSupported` before Cancun.
    pub fn validateForHardfork(self: *const BlobTransaction, hardfork: Hardfork) BlobError!void {
        const schedule = BlobSchedule.forHardfork(hardfork) orelse return BlobError.BlobsNotSupported;
        const max = if (hardfork.isAtLeast(.OSAKA)) @min(schedule.max, MAX_BLOBS_PER_TRANSACTION_EIP7594) else schedule.max;
        return self.validateWithMaxBlobs(max);
    }

    /// Validate against the limit of an explicit blob schedule:
    /// `cancun` 6, `prague` 9, `bpo1` 15, `bpo2` 21.
    ///
    /// `schedule.max` is the block limit. From Osaka a transaction is also
    /// capped at 6 blobs (EIP-7594); `validateForHardfork` applies that cap.
    pub fn validateForSchedule(self: *const BlobTransaction, schedule: BlobSchedule) BlobError!void {
        return self.validateWithMaxBlobs(schedule.max);
    }

    fn validateWithMaxBlobs(self: *const BlobTransaction, max_blobs: u64) BlobError!void {
        // Must have at least one blob
        if (self.blob_versioned_hashes.len == 0) {
            return BlobError.NoBlobs;
        }

        // Cannot exceed max blobs
        if (self.blob_versioned_hashes.len > max_blobs) {
            return BlobError.TooManyBlobs;
        }

        // All hashes must be valid
        for (self.blob_versioned_hashes) |h| {
            if (!isValidVersionedHash(h)) {
                return BlobError.InvalidVersionedHash;
            }
        }

        // Max fee must be positive
        if (self.max_fee_per_blob_gas == 0) {
            return BlobError.ZeroMaxFeePerBlobGas;
        }
    }

    pub fn blobGasUsed(self: *const BlobTransaction) u64 {
        return self.blob_versioned_hashes.len * BLOB_GAS_PER_BLOB;
    }

    /// Blob fee in wei: `blob_gas_used * blob_base_fee`.
    ///
    /// Returns u256: the product of two u64 values does not fit in u64.
    pub fn blobGasCost(self: *const BlobTransaction, blob_base_fee: u64) u256 {
        return @as(u256, self.blobGasUsed()) * @as(u256, blob_base_fee);
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

// Blob data encoding (matches voltaire-ts Blob.fromData / Blob.toData byte for byte).
//
// Each 32-byte field element carries 31 usable bytes: byte 0 of every element
// stays 0x00 so every element is below the BLS12-381 scalar modulus. The usable
// byte stream starts with a 4-byte big-endian length prefix (blob offsets 1..4),
// followed by the data (from blob offset 5), skipping byte 0 of each element.

/// Usable bytes per field element (byte 0 is reserved as 0x00).
pub const USABLE_BYTES_PER_FIELD_ELEMENT = BYTES_PER_FIELD_ELEMENT - 1; // 31

/// Size of the big-endian length prefix at the start of the usable byte stream.
pub const BLOB_LENGTH_PREFIX_SIZE = 4;

/// Max data bytes per blob: 4096 * 31 - 4 = 126972.
pub const MAX_DATA_PER_BLOB = FIELD_ELEMENTS_PER_BLOB * USABLE_BYTES_PER_FIELD_ELEMENT - BLOB_LENGTH_PREFIX_SIZE;

/// Encode `data` into a field-element-safe blob. Returns DataTooLarge when
/// `data.len > MAX_DATA_PER_BLOB`.
pub fn encodeBlobData(allocator: Allocator, data: []const u8) !Blob {
    _ = allocator;

    if (data.len > MAX_DATA_PER_BLOB) {
        return BlobError.DataTooLarge;
    }

    var blob: Blob = @as([BYTES_PER_BLOB]u8, @splat(0x00));

    std.mem.writeInt(u32, blob[1..5], @intCast(data.len), .big);

    // First element: 31 usable bytes minus the 4-byte prefix = 27 data bytes at offset 5.
    var remaining = data;
    var element: usize = 0;
    var offset: usize = 1 + BLOB_LENGTH_PREFIX_SIZE;
    while (remaining.len > 0) {
        const room = (element + 1) * BYTES_PER_FIELD_ELEMENT - offset;
        const n = @min(room, remaining.len);
        @memcpy(blob[offset .. offset + n], remaining[0..n]);
        remaining = remaining[n..];
        element += 1;
        offset = element * BYTES_PER_FIELD_ELEMENT + 1;
    }

    return blob;
}

/// Read and validate the length prefix. Returns InvalidBlobData when the
/// declared length exceeds MAX_DATA_PER_BLOB.
fn blobDataLen(blob: *const Blob) BlobError!usize {
    const len = std.mem.readInt(u32, blob[1..5], .big);
    if (len > MAX_DATA_PER_BLOB) {
        return BlobError.InvalidBlobData;
    }
    return len;
}

/// Copy `out.len` data bytes out of `blob`, skipping byte 0 of each element.
fn copyBlobData(blob: *const Blob, out: []u8) void {
    var written: usize = 0;
    var element: usize = 0;
    var offset: usize = 1 + BLOB_LENGTH_PREFIX_SIZE;
    while (written < out.len) {
        const room = (element + 1) * BYTES_PER_FIELD_ELEMENT - offset;
        const n = @min(room, out.len - written);
        @memcpy(out[written .. written + n], blob[offset .. offset + n]);
        written += n;
        element += 1;
        offset = element * BYTES_PER_FIELD_ELEMENT + 1;
    }
}

/// Decode data written by encodeBlobData. Caller owns the returned slice.
/// Like voltaire-ts Blob.toData, byte 0 of each element is ignored, not checked.
pub fn decodeBlobData(allocator: Allocator, blob: Blob) ![]u8 {
    const len = try blobDataLen(&blob);
    const data = try allocator.alloc(u8, len);
    copyBlobData(&blob, data);
    return data;
}

// Validate blob size
pub fn isValid(blob: []const u8) bool {
    return blob.len == BYTES_PER_BLOB;
}

// Estimate number of blobs needed for data size
pub fn estimateBlobCount(data_size: usize) usize {
    if (data_size == 0) return 0;
    // Ceiling division without `data_size + MAX_DATA_PER_BLOB - 1`, which
    // overflows usize near maxInt
    return (data_size - 1) / MAX_DATA_PER_BLOB + 1;
}

test "estimateBlobCount is overflow-safe at usize boundaries" {
    try testing.expectEqual(@as(usize, 0), estimateBlobCount(0));
    try testing.expectEqual(@as(usize, 1), estimateBlobCount(1));
    try testing.expectEqual(@as(usize, 1), estimateBlobCount(MAX_DATA_PER_BLOB - 1));
    try testing.expectEqual(@as(usize, 1), estimateBlobCount(MAX_DATA_PER_BLOB));
    try testing.expectEqual(@as(usize, 2), estimateBlobCount(MAX_DATA_PER_BLOB + 1));
    try testing.expectEqual(@as(usize, 2), estimateBlobCount(2 * MAX_DATA_PER_BLOB));
    try testing.expectEqual(@as(usize, 3), estimateBlobCount(2 * MAX_DATA_PER_BLOB + 1));

    // 32-bit usize maximum (the wasm32 boundary)
    const max32: usize = 0xffff_ffff;
    try testing.expectEqual((max32 - 1) / MAX_DATA_PER_BLOB + 1, estimateBlobCount(max32));
    try testing.expect(estimateBlobCount(max32) >= max32 / MAX_DATA_PER_BLOB);

    // Native usize maximum: the old `data_size + MAX - 1` form overflowed here
    const max = std.math.maxInt(usize);
    const want = max / MAX_DATA_PER_BLOB + @as(usize, @intFromBool(max % MAX_DATA_PER_BLOB != 0));
    try testing.expectEqual(want, estimateBlobCount(max));
    try testing.expectEqual(want, estimateBlobCount(max - 1));
    try testing.expect(estimateBlobCount(max) > MAX_BLOBS_PER_TRANSACTION);
}

// Calculate gas for blob count
pub fn calculateGas(blob_count: usize) !u64 {
    if (blob_count > MAX_BLOBS_PER_TRANSACTION) {
        return BlobError.TooManyBlobs;
    }
    return @as(u64, @intCast(blob_count)) * BLOB_GAS_PER_BLOB;
}

// Split data into MAX_DATA_PER_BLOB chunks, one blob each. Caller owns the slice.
pub fn splitData(allocator: Allocator, data: []const u8) ![]Blob {
    const blob_count = estimateBlobCount(data.len);

    if (blob_count > MAX_BLOBS_PER_TRANSACTION) {
        return BlobError.TooManyBlobs;
    }

    const blobs = try allocator.alloc(Blob, blob_count);
    errdefer allocator.free(blobs);

    for (0..blob_count) |i| {
        const start = i * MAX_DATA_PER_BLOB;
        const end = @min(start + MAX_DATA_PER_BLOB, data.len);
        blobs[i] = try encodeBlobData(allocator, data[start..end]);
    }

    return blobs;
}

// Join multiple blobs into single data buffer. Caller owns the slice.
pub fn joinData(allocator: Allocator, blobs: []const Blob) ![]u8 {
    var total_len: usize = 0;
    for (blobs) |*blob| {
        total_len += try blobDataLen(blob);
    }

    const result = try allocator.alloc(u8, total_len);
    errdefer allocator.free(result);

    var offset: usize = 0;
    for (blobs) |*blob| {
        const len = try blobDataLen(blob);
        copyBlobData(blob, result[offset .. offset + len]);
        offset += len;
    }

    return result;
}

// Tests

test "commitment to versioned hash" {
    const commitment: BlobCommitment = @as([48]u8, @splat(0x12));
    const versioned_hash = commitmentToVersionedHash(commitment);

    // Should start with version byte
    try testing.expectEqual(BLOB_COMMITMENT_VERSION_KZG, versioned_hash.bytes[0]);

    // Should be valid
    try testing.expect(isValidVersionedHash(versioned_hash));
}

test "invalid versioned hash" {
    var h: VersionedHash = undefined;
    h.bytes = @as([32]u8, @splat(0x00));
    h.bytes[0] = 0x02; // Invalid version

    try testing.expect(!isValidVersionedHash(h));
}

test "blob gas price calculation" {
    // Test with no excess gas
    const price_zero = calculateBlobGasPrice(0);
    try testing.expectEqual(@as(u64, 1), price_zero); // MIN_BLOB_BASE_FEE

    // One blob of excess: floor(e^(131072 / 3338477)) = floor(1.04) = 1
    const price_low = calculateBlobGasPrice(131072);
    try testing.expectEqual(@as(u64, 1), price_low);

    // Exact Cancun 1 -> 2 wei transition at excess = 2,314,058
    try testing.expectEqual(@as(u64, 1), calculateBlobGasPrice(2_314_057));
    try testing.expectEqual(@as(u64, 2), calculateBlobGasPrice(2_314_058));

    // High excess gas: 10,000,000 -> 19 wei
    const price_high = calculateBlobGasPrice(10_000_000);
    try testing.expectEqual(@as(u64, 19), price_high);
    try testing.expect(price_high > price_low);
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
    const hash1 = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hash2 = commitmentToVersionedHash(@as([48]u8, @splat(0x02)));

    const hashes = [_]VersionedHash{ hash1, hash2 };

    var tx = BlobTransaction{
        .max_fee_per_blob_gas = 1000,
        .blob_versioned_hashes = &hashes,
    };

    // Should be valid
    try tx.validate();

    // Test gas calculations
    try testing.expectEqual(@as(u64, 2 * BLOB_GAS_PER_BLOB), tx.blobGasUsed());
    try testing.expectEqual(@as(u64, 2 * BLOB_GAS_PER_BLOB * 10), tx.blobGasCost(10));
}

test "BlobTransaction validation follows the hardfork blob limit" {
    var hashes: [22]VersionedHash = undefined;
    for (0..hashes.len) |i| {
        hashes[i] = commitmentToVersionedHash(@as([48]u8, @splat(@intCast(i + 1))));
    }
    const withBlobs = struct {
        fn f(all: []const VersionedHash, n: usize) BlobTransaction {
            return .{ .max_fee_per_blob_gas = 1, .blob_versioned_hashes = all[0..n] };
        }
    }.f;

    // Hardfork limits: Cancun 6, Prague 9, Osaka and later 6 (EIP-7594)
    const forks = [_]struct { fork: Hardfork, max: usize }{
        .{ .fork = .CANCUN, .max = 6 },
        .{ .fork = .PRAGUE, .max = 9 },
        .{ .fork = .OSAKA, .max = 6 },
    };
    for (forks) |case| {
        try withBlobs(&hashes, case.max).validateForHardfork(case.fork);
        try testing.expectError(BlobError.TooManyBlobs, withBlobs(&hashes, case.max + 1).validateForHardfork(case.fork));
        try testing.expectError(BlobError.NoBlobs, withBlobs(&hashes, 0).validateForHardfork(case.fork));
    }
    try testing.expectError(BlobError.BlobsNotSupported, withBlobs(&hashes, 1).validateForHardfork(.SHANGHAI));

    // Explicit schedules: Cancun 6, Prague 9, Osaka 9 (block limit), BPO1 15, BPO2 21
    const schedules = [_]struct { schedule: BlobSchedule, max: usize }{
        .{ .schedule = BlobSchedule.cancun, .max = 6 },
        .{ .schedule = BlobSchedule.prague, .max = 9 },
        .{ .schedule = BlobSchedule.bpo1, .max = 15 },
        .{ .schedule = BlobSchedule.bpo2, .max = 21 },
    };
    for (schedules) |case| {
        try withBlobs(&hashes, case.max).validateForSchedule(case.schedule);
        try testing.expectError(BlobError.TooManyBlobs, withBlobs(&hashes, case.max + 1).validateForSchedule(case.schedule));
    }

    // The default stays at the Cancun limit
    try withBlobs(&hashes, 6).validate();
    try testing.expectError(BlobError.TooManyBlobs, withBlobs(&hashes, 7).validate());
}

test "blobGasCost returns u256 and cannot overflow" {
    var hashes: [6]VersionedHash = undefined;
    for (0..hashes.len) |i| {
        hashes[i] = commitmentToVersionedHash(@as([48]u8, @splat(@intCast(i + 1))));
    }
    const tx = BlobTransaction{ .max_fee_per_blob_gas = 1, .blob_versioned_hashes = &hashes };

    const max_fee: u64 = std.math.maxInt(u64);
    const cost = tx.blobGasCost(max_fee);
    try testing.expect(@TypeOf(cost) == u256);
    // 6 * 2^17 * (2^64 - 1) exceeds u64
    try testing.expectEqual(@as(u256, 6 * BLOB_GAS_PER_BLOB) * @as(u256, max_fee), cost);
    try testing.expect(cost > std.math.maxInt(u64));
}

test "blob transaction validation failures" {
    // No blobs
    var tx = BlobTransaction{
        .max_fee_per_blob_gas = 1000,
        .blob_versioned_hashes = &.{},
    };
    try testing.expectError(BlobError.NoBlobs, tx.validate());

    // Too many blobs
    var many_hashes: [MAX_BLOBS_PER_TRANSACTION + 1]VersionedHash = undefined;
    for (0..many_hashes.len) |i| {
        many_hashes[i] = commitmentToVersionedHash(@as([48]u8, @splat(@intCast(i))));
    }

    tx = BlobTransaction{
        .max_fee_per_blob_gas = 1000,
        .blob_versioned_hashes = &many_hashes,
    };
    try testing.expectError(BlobError.TooManyBlobs, tx.validate());

    // Invalid versioned hash
    var invalid_hash: VersionedHash = undefined;
    invalid_hash.bytes = @as([32]u8, @splat(0x00));
    invalid_hash.bytes[0] = 0xFF; // Invalid version

    tx = BlobTransaction{
        .max_fee_per_blob_gas = 1000,
        .blob_versioned_hashes = &[_]VersionedHash{invalid_hash},
    };
    try testing.expectError(BlobError.InvalidVersionedHash, tx.validate());

    // Zero max fee
    const valid_hash = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    tx = BlobTransaction{
        .max_fee_per_blob_gas = 0,
        .blob_versioned_hashes = &[_]VersionedHash{valid_hash},
    };
    try testing.expectError(BlobError.ZeroMaxFeePerBlobGas, tx.validate());
}

test "blob sidecar" {
    const sidecar = BlobSidecar{
        .blob = @as([BYTES_PER_BLOB]u8, @splat(0x00)),
        .commitment = @as([48]u8, @splat(0x12)),
        .proof = @as([48]u8, @splat(0x34)),
    };

    const h = sidecar.versionedHash();
    try testing.expect(isValidVersionedHash(h));
}

test "blob gas economics" {
    // Simulate block progression
    var excess_blob_gas: u64 = 0;

    // Block 1: 4 blobs used (above target)
    var blob_gas_used: u64 = 4 * BLOB_GAS_PER_BLOB;
    var blob_price = calculateBlobGasPrice(excess_blob_gas);
    try testing.expectEqual(@as(u64, 1), blob_price); // Min price initially

    excess_blob_gas = calculateExcessBlobGas(excess_blob_gas, blob_gas_used);
    try testing.expect(excess_blob_gas > 0); // Should increase

    // Block 2: One blob of excess still floors to 1 wei per EIP-4844
    blob_price = calculateBlobGasPrice(excess_blob_gas);
    try testing.expectEqual(@as(u64, 1), blob_price);

    // Block 3: Use only 1 blob (below target)
    blob_gas_used = BLOB_GAS_PER_BLOB;
    const old_excess = excess_blob_gas;
    excess_blob_gas = calculateExcessBlobGas(excess_blob_gas, blob_gas_used);
    try testing.expect(excess_blob_gas < old_excess); // Should decrease
}

test "blob data encoding and decoding" {
    const allocator = testing.allocator;

    const test_data = "Hello, blob world!";

    const blob = try encodeBlobData(allocator, test_data);

    const decoded = try decodeBlobData(allocator, blob);
    defer allocator.free(decoded);

    try testing.expectEqualStrings(test_data, decoded);
}

test "blob data too large" {
    const allocator = testing.allocator;

    const large_data = try allocator.alloc(u8, BYTES_PER_BLOB);
    defer allocator.free(large_data);
    @memset(large_data, 0xFF);

    const result = encodeBlobData(allocator, large_data);
    try testing.expectError(BlobError.DataTooLarge, result);
}

test "MAX_DATA_PER_BLOB is 4096 * 31 - 4" {
    try testing.expectEqual(@as(usize, 126_972), MAX_DATA_PER_BLOB);
}

test "encodeBlobData rejects former off-by-7 overflow lengths" {
    // Old encoder accepted up to BYTES_PER_BLOB - 1 bytes but wrote at offset 8,
    // running 7 bytes past the blob. Every such length must now be rejected.
    const allocator = testing.allocator;
    const data = try allocator.alloc(u8, BYTES_PER_BLOB - 1);
    defer allocator.free(data);
    @memset(data, 0xAB);

    var len: usize = BYTES_PER_BLOB - 8;
    while (len <= BYTES_PER_BLOB - 1) : (len += 1) {
        try testing.expectError(BlobError.DataTooLarge, encodeBlobData(allocator, data[0..len]));
    }
}

test "encodeBlobData writes big-endian length prefix at offsets 1..4" {
    const allocator = testing.allocator;
    var data: [300]u8 = undefined;
    @memset(&data, 0x11);

    const blob = try encodeBlobData(allocator, &data);
    try testing.expectEqual(@as(u8, 0x00), blob[0]);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x00, 0x00, 0x01, 0x2C }, blob[1..5]);
    try testing.expectEqual(@as(u8, 0x11), blob[5]);
}

test "encodeBlobData packs 27 bytes in element 0 then 31 per element" {
    const allocator = testing.allocator;
    var data: [27 + 31 + 1]u8 = undefined;
    for (&data, 0..) |*b, i| b.* = @intCast(i + 1);

    const blob = try encodeBlobData(allocator, &data);

    // Element 0: [0x00][len BE x4][data 0..27]
    try testing.expectEqualSlices(u8, data[0..27], blob[5..32]);
    // Element 1: [0x00][data 27..58]
    try testing.expectEqual(@as(u8, 0x00), blob[32]);
    try testing.expectEqualSlices(u8, data[27..58], blob[33..64]);
    // Element 2: [0x00][data 58]
    try testing.expectEqual(@as(u8, 0x00), blob[64]);
    try testing.expectEqual(data[58], blob[65]);
    // Rest zero
    for (blob[66..]) |b| try testing.expectEqual(@as(u8, 0x00), b);
}

test "encodeBlobData at capacity roundtrips and fills last byte" {
    const allocator = testing.allocator;
    const data = try allocator.alloc(u8, MAX_DATA_PER_BLOB);
    defer allocator.free(data);
    for (data, 0..) |*b, i| b.* = @intCast(i % 251);

    const blob = try encodeBlobData(allocator, data);
    try testing.expectEqual(data[data.len - 1], blob[BYTES_PER_BLOB - 1]);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x00, 0x01, 0xEF, 0xFC }, blob[1..5]); // 126972

    const decoded = try decodeBlobData(allocator, blob);
    defer allocator.free(decoded);
    try testing.expectEqualSlices(u8, data, decoded);
}

test "encodeBlobData at capacity plus one fails" {
    const allocator = testing.allocator;
    const data = try allocator.alloc(u8, MAX_DATA_PER_BLOB + 1);
    defer allocator.free(data);
    @memset(data, 0x01);
    try testing.expectError(BlobError.DataTooLarge, encodeBlobData(allocator, data));
}

test "encodeBlobData keeps byte 0 of every field element zero" {
    const allocator = testing.allocator;
    const data = try allocator.alloc(u8, MAX_DATA_PER_BLOB);
    defer allocator.free(data);
    @memset(data, 0xFF);

    const blob = try encodeBlobData(allocator, data);
    for (0..FIELD_ELEMENTS_PER_BLOB) |i| {
        try testing.expectEqual(@as(u8, 0x00), blob[i * BYTES_PER_FIELD_ELEMENT]);
    }
    // Every other byte past the prefix carries data
    for (0..FIELD_ELEMENTS_PER_BLOB) |i| {
        const start = i * BYTES_PER_FIELD_ELEMENT + if (i == 0) @as(usize, 5) else 1;
        for (blob[start .. (i + 1) * BYTES_PER_FIELD_ELEMENT]) |b| {
            try testing.expectEqual(@as(u8, 0xFF), b);
        }
    }
}

test "encodeBlobData empty data roundtrips" {
    const allocator = testing.allocator;
    const blob = try encodeBlobData(allocator, &[_]u8{});
    for (blob) |b| try testing.expectEqual(@as(u8, 0x00), b);

    const decoded = try decodeBlobData(allocator, blob);
    defer allocator.free(decoded);
    try testing.expectEqual(@as(usize, 0), decoded.len);
}

test "decodeBlobData rejects length prefix over capacity" {
    const allocator = testing.allocator;
    var blob: Blob = @as([BYTES_PER_BLOB]u8, @splat(0x00));

    std.mem.writeInt(u32, blob[1..5], MAX_DATA_PER_BLOB + 1, .big);
    try testing.expectError(BlobError.InvalidBlobData, decodeBlobData(allocator, blob));

    std.mem.writeInt(u32, blob[1..5], std.math.maxInt(u32), .big);
    try testing.expectError(BlobError.InvalidBlobData, decodeBlobData(allocator, blob));

    std.mem.writeInt(u32, blob[1..5], MAX_DATA_PER_BLOB, .big);
    const decoded = try decodeBlobData(allocator, blob);
    defer allocator.free(decoded);
    try testing.expectEqual(@as(usize, MAX_DATA_PER_BLOB), decoded.len);
}

test "decodeBlobData ignores field element high bytes like voltaire-ts toData" {
    const allocator = testing.allocator;
    var data: [40]u8 = undefined;
    for (&data, 0..) |*b, i| b.* = @intCast(i);

    var blob = try encodeBlobData(allocator, &data);
    blob[0] = 0xFF;
    blob[32] = 0xFF;

    const decoded = try decodeBlobData(allocator, blob);
    defer allocator.free(decoded);
    try testing.expectEqualSlices(u8, &data, decoded);
}

test "joinData rejects blob with length prefix over capacity" {
    const allocator = testing.allocator;
    var blobs = @as([2]Blob, @splat(@as([BYTES_PER_BLOB]u8, @splat(0x00))));
    std.mem.writeInt(u32, blobs[1][1..5], MAX_DATA_PER_BLOB + 1, .big);
    try testing.expectError(BlobError.InvalidBlobData, joinData(allocator, &blobs));
}

test "splitData chunks at MAX_DATA_PER_BLOB" {
    const allocator = testing.allocator;
    const data = try allocator.alloc(u8, MAX_DATA_PER_BLOB + 5);
    defer allocator.free(data);
    for (data, 0..) |*b, i| b.* = @intCast(i % 256);

    const blobs = try splitData(allocator, data);
    defer allocator.free(blobs);

    try testing.expectEqual(@as(usize, 2), blobs.len);
    try testing.expectEqual(@as(u32, MAX_DATA_PER_BLOB), std.mem.readInt(u32, blobs[0][1..5], .big));
    try testing.expectEqual(@as(u32, 5), std.mem.readInt(u32, blobs[1][1..5], .big));
    try testing.expectEqualSlices(u8, data[MAX_DATA_PER_BLOB..], blobs[1][5..10]);
}

test "splitData fails one byte over max blobs" {
    const allocator = testing.allocator;
    const data = try allocator.alloc(u8, MAX_DATA_PER_BLOB * MAX_BLOBS_PER_TRANSACTION + 1);
    defer allocator.free(data);
    @memset(data, 0x00);
    try testing.expectError(BlobError.TooManyBlobs, splitData(allocator, data));
}

// Comprehensive tests for isValidVersionedHash

test "isValidVersionedHash with correct version" {
    var h: VersionedHash = undefined;
    h.bytes = @as([32]u8, @splat(0x00));
    h.bytes[0] = BLOB_COMMITMENT_VERSION_KZG; // 0x01

    try testing.expect(isValidVersionedHash(h));
}

test "isValidVersionedHash with version zero" {
    var h: VersionedHash = undefined;
    h.bytes = @as([32]u8, @splat(0x00));
    h.bytes[0] = 0x00;

    try testing.expect(!isValidVersionedHash(h));
}

test "isValidVersionedHash with version two" {
    var h: VersionedHash = undefined;
    h.bytes = @as([32]u8, @splat(0x00));
    h.bytes[0] = 0x02;

    try testing.expect(!isValidVersionedHash(h));
}

test "isValidVersionedHash with max version byte" {
    var h: VersionedHash = undefined;
    h.bytes = @as([32]u8, @splat(0xFF));
    h.bytes[0] = 0xFF;

    try testing.expect(!isValidVersionedHash(h));
}

test "isValidVersionedHash with various invalid versions" {
    const invalid_versions = [_]u8{ 0x00, 0x02, 0x03, 0x10, 0xAA, 0xFF };

    for (invalid_versions) |version| {
        var h: VersionedHash = undefined;
        h.bytes = @as([32]u8, @splat(0x00));
        h.bytes[0] = version;

        try testing.expect(!isValidVersionedHash(h));
    }
}

// Comprehensive tests for calculateBlobGasPrice

test "calculateBlobGasPrice with zero excess gas" {
    const price = calculateBlobGasPrice(0);
    try testing.expectEqual(@as(u64, MIN_BLOB_BASE_FEE), price);
}

test "calculateBlobGasPrice with small excess gas" {
    const price = calculateBlobGasPrice(1000);
    try testing.expect(price >= MIN_BLOB_BASE_FEE);
}

test "calculateBlobGasPrice with one blob worth of excess" {
    // floor(e^(131072 / 3338477)) = 1
    const price = calculateBlobGasPrice(BLOB_GAS_PER_BLOB);
    try testing.expectEqual(@as(u64, 1), price);
}

test "calculateBlobGasPrice with target blob gas" {
    // floor(e^(393216 / 3338477)) = floor(1.125) = 1
    const target = 393216; // 3 * BLOB_GAS_PER_BLOB
    const price = calculateBlobGasPrice(target);
    try testing.expectEqual(@as(u64, 1), price);
}

test "calculateBlobGasPrice monotonically increases" {
    const price1 = calculateBlobGasPrice(0);
    const price2 = calculateBlobGasPrice(18 * BLOB_GAS_PER_BLOB); // 2 wei
    const price3 = calculateBlobGasPrice(30 * BLOB_GAS_PER_BLOB); // 3 wei
    const price4 = calculateBlobGasPrice(100 * BLOB_GAS_PER_BLOB); // 50 wei

    try testing.expectEqual(@as(u64, 1), price1);
    try testing.expectEqual(@as(u64, 2), price2);
    try testing.expect(price2 > price1);
    try testing.expect(price3 > price2);
    try testing.expect(price4 > price3);
}

test "calculateBlobGasPrice with various excess blob gas values" {
    const test_values = [_]u64{
        0,
        1,
        100,
        1000,
        BLOB_GAS_PER_BLOB,
        BLOB_GAS_PER_BLOB * 2,
        BLOB_GAS_PER_BLOB * 6, // Max blobs worth
        393216, // Target
        393216 * 2, // 2x target
    };

    for (test_values) |excess| {
        const price = calculateBlobGasPrice(excess);
        try testing.expect(price >= MIN_BLOB_BASE_FEE);
    }
}

test "calculateBlobGasPrice with high excess gas" {
    const price = calculateBlobGasPrice(100 * BLOB_GAS_PER_BLOB);
    try testing.expect(price > calculateBlobGasPrice(10 * BLOB_GAS_PER_BLOB));
}

// Comprehensive tests for calculateExcessBlobGas

test "calculateExcessBlobGas with no excess and no usage" {
    const excess = calculateExcessBlobGas(0, 0);
    try testing.expectEqual(@as(u64, 0), excess);
}

test "calculateExcessBlobGas with no excess and below target usage" {
    const target = 393216;
    const excess = calculateExcessBlobGas(0, target - 1);
    try testing.expectEqual(@as(u64, 0), excess);
}

test "calculateExcessBlobGas with no excess at exact target" {
    const target = 393216;
    const excess = calculateExcessBlobGas(0, target);
    try testing.expectEqual(@as(u64, 0), excess);
}

test "calculateExcessBlobGas with no excess above target" {
    const target = 393216;
    const excess = calculateExcessBlobGas(0, target + 1);
    try testing.expectEqual(@as(u64, 1), excess);
}

test "calculateExcessBlobGas with existing excess below target usage" {
    const existing_excess = BLOB_GAS_PER_BLOB;
    const usage = BLOB_GAS_PER_BLOB; // Total < target

    const excess = calculateExcessBlobGas(existing_excess, usage);
    try testing.expectEqual(@as(u64, 0), excess);
}

test "calculateExcessBlobGas with existing excess at target" {
    const existing_excess = BLOB_GAS_PER_BLOB;
    const usage = 393216 - existing_excess;

    const excess = calculateExcessBlobGas(existing_excess, usage);
    try testing.expectEqual(@as(u64, 0), excess);
}

test "calculateExcessBlobGas with existing excess above target" {
    const existing_excess = BLOB_GAS_PER_BLOB;
    const usage = 393216;

    const excess = calculateExcessBlobGas(existing_excess, usage);
    try testing.expectEqual(existing_excess, excess);
}

test "calculateExcessBlobGas rollover accumulation" {
    // Start with no excess
    var excess: u64 = 0;

    // Use 6 blobs (max) - above target
    excess = calculateExcessBlobGas(excess, 6 * BLOB_GAS_PER_BLOB);
    try testing.expect(excess > 0);

    // Use another 6 blobs - should accumulate
    const prev_excess = excess;
    excess = calculateExcessBlobGas(excess, 6 * BLOB_GAS_PER_BLOB);
    try testing.expect(excess > prev_excess);
}

test "calculateExcessBlobGas boundary at target minus one" {
    const target = 393216;
    const excess = calculateExcessBlobGas(0, target - 1);
    try testing.expectEqual(@as(u64, 0), excess);
}

test "calculateExcessBlobGas boundary at target plus one" {
    const target = 393216;
    const excess = calculateExcessBlobGas(0, target + 1);
    try testing.expectEqual(@as(u64, 1), excess);
}

// Comprehensive tests for fakeExponential

test "fakeExponential with zero numerator" {
    const result = fakeExponential(MIN_BLOB_BASE_FEE, 0, BLOB_BASE_FEE_UPDATE_FRACTION);
    try testing.expectEqual(@as(u64, MIN_BLOB_BASE_FEE), result);
}

test "fakeExponential never returns zero (minimum is 1)" {
    // Edge case: factor=0 would result in 0, but we enforce minimum of 1
    const result = fakeExponential(0, 0, BLOB_BASE_FEE_UPDATE_FRACTION);
    try testing.expectEqual(@as(u64, 1), result);
}

test "fakeExponential with zero factor returns minimum 1" {
    // Even with zero factor, result should be at least 1
    const result = fakeExponential(0, 1000, BLOB_BASE_FEE_UPDATE_FRACTION);
    try testing.expectEqual(@as(u64, 1), result);
}

test "calculateBlobGasPrice never returns zero" {
    // Edge case: even with 0 excess, minimum price is 1
    const price = calculateBlobGasPrice(0);
    try testing.expect(price >= 1);
}

test "fakeExponential handles large values without overflow" {
    // Test with very large excess that could cause overflow in u64
    // Using u128 internally should prevent this
    const result = fakeExponential(MIN_BLOB_BASE_FEE, 1000000000, BLOB_BASE_FEE_UPDATE_FRACTION);
    try testing.expect(result >= MIN_BLOB_BASE_FEE);
}

test "fakeExponential approximation accuracy small values" {
    // For small values, should approximate e^x well
    const result = fakeExponential(1, 1000, BLOB_BASE_FEE_UPDATE_FRACTION);
    try testing.expect(result >= 1);
}

test "fakeExponential does not overflow" {
    // floor(e^(1_000_000 / 3_338_477)) = floor(1.349) = 1
    try testing.expectEqual(@as(u64, 1), fakeExponential(MIN_BLOB_BASE_FEE, 1_000_000, BLOB_BASE_FEE_UPDATE_FRACTION));
    // floor(e^(10_000_000 / 3_338_477)) = 19
    try testing.expectEqual(@as(u64, 19), fakeExponential(MIN_BLOB_BASE_FEE, 10_000_000, BLOB_BASE_FEE_UPDATE_FRACTION));
}

test "fakeExponential iteration limit" {
    // Ensure iteration limit prevents infinite loop
    const result = fakeExponential(1, 100000000, 1);
    try testing.expect(result > 0);
}

test "fakeExponential consistency with calculateBlobGasPrice" {
    // Verify that calculateBlobGasPrice uses fakeExponential correctly
    const excess = BLOB_GAS_PER_BLOB;
    const price = calculateBlobGasPrice(excess);
    const direct = fakeExponential(MIN_BLOB_BASE_FEE, excess, BLOB_BASE_FEE_UPDATE_FRACTION);
    try testing.expectEqual(direct, price);
}

// Comprehensive tests for BlobTransaction.validate

test "BlobTransaction validate with single valid blob" {
    const hash = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hashes = [_]VersionedHash{hash};

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    try tx.validate();
}

test "BlobTransaction validate with max blobs exactly" {
    var hashes: [MAX_BLOBS_PER_TRANSACTION]VersionedHash = undefined;
    for (0..MAX_BLOBS_PER_TRANSACTION) |i| {
        hashes[i] = commitmentToVersionedHash(@as([48]u8, @splat(@intCast(i + 1))));
    }

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    try tx.validate();
}

test "BlobTransaction validate fails with zero blobs" {
    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &.{},
    };

    try testing.expectError(BlobError.NoBlobs, tx.validate());
}

test "BlobTransaction validate fails with max blobs plus one" {
    var hashes: [MAX_BLOBS_PER_TRANSACTION + 1]VersionedHash = undefined;
    for (0..hashes.len) |i| {
        hashes[i] = commitmentToVersionedHash(@as([48]u8, @splat(@intCast(i + 1))));
    }

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    try testing.expectError(BlobError.TooManyBlobs, tx.validate());
}

test "BlobTransaction validate fails with many blobs" {
    var hashes: [100]VersionedHash = undefined;
    for (0..hashes.len) |i| {
        hashes[i] = commitmentToVersionedHash(@as([48]u8, @splat(@intCast((i % 255) + 1))));
    }

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    try testing.expectError(BlobError.TooManyBlobs, tx.validate());
}

test "BlobTransaction validate fails with invalid versioned hash in middle" {
    const valid_hash1 = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    var invalid_hash: VersionedHash = undefined;
    invalid_hash.bytes = @as([32]u8, @splat(0x00));
    invalid_hash.bytes[0] = 0x00; // Invalid version
    const valid_hash2 = commitmentToVersionedHash(@as([48]u8, @splat(0x02)));

    const hashes = [_]VersionedHash{ valid_hash1, invalid_hash, valid_hash2 };

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    try testing.expectError(BlobError.InvalidVersionedHash, tx.validate());
}

test "BlobTransaction validate fails with zero max fee" {
    const hash = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hashes = [_]VersionedHash{hash};

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 0,
        .blob_versioned_hashes = &hashes,
    };

    try testing.expectError(BlobError.ZeroMaxFeePerBlobGas, tx.validate());
}

test "BlobTransaction validate succeeds with minimal max fee" {
    const hash = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hashes = [_]VersionedHash{hash};

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    try tx.validate();
}

test "BlobTransaction validate succeeds with high max fee" {
    const hash = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hashes = [_]VersionedHash{hash};

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 999999999999,
        .blob_versioned_hashes = &hashes,
    };

    try tx.validate();
}

// Tests for max blob count enforcement

test "max blob count is six" {
    try testing.expectEqual(@as(usize, 6), MAX_BLOBS_PER_TRANSACTION);
}

test "BlobTransaction with exactly max blobs is valid" {
    var hashes: [MAX_BLOBS_PER_TRANSACTION]VersionedHash = undefined;
    for (0..MAX_BLOBS_PER_TRANSACTION) |i| {
        hashes[i] = commitmentToVersionedHash(@as([48]u8, @splat(@intCast(i + 1))));
    }

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 100,
        .blob_versioned_hashes = &hashes,
    };

    try tx.validate();
    try testing.expectEqual(@as(u64, 6 * BLOB_GAS_PER_BLOB), tx.blobGasUsed());
}

test "BlobTransaction gas calculations with max blobs" {
    var hashes: [MAX_BLOBS_PER_TRANSACTION]VersionedHash = undefined;
    for (0..MAX_BLOBS_PER_TRANSACTION) |i| {
        hashes[i] = commitmentToVersionedHash(@as([48]u8, @splat(@intCast(i + 1))));
    }

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 100,
        .blob_versioned_hashes = &hashes,
    };

    const expected_gas = 6 * BLOB_GAS_PER_BLOB;
    try testing.expectEqual(expected_gas, tx.blobGasUsed());

    const blob_base_fee: u64 = 50;
    const expected_cost = expected_gas * blob_base_fee;
    try testing.expectEqual(expected_cost, tx.blobGasCost(blob_base_fee));
}

// Edge case tests near boundaries

test "blob gas calculation boundary with one blob" {
    const hash = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hashes = [_]VersionedHash{hash};

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    try testing.expectEqual(BLOB_GAS_PER_BLOB, tx.blobGasUsed());
}

test "blob gas calculation boundary with two blobs" {
    const hash1 = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hash2 = commitmentToVersionedHash(@as([48]u8, @splat(0x02)));
    const hashes = [_]VersionedHash{ hash1, hash2 };

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1,
        .blob_versioned_hashes = &hashes,
    };

    try testing.expectEqual(@as(u64, 2 * BLOB_GAS_PER_BLOB), tx.blobGasUsed());
}

test "excess blob gas at target boundary minus one blob" {
    const target = 393216;
    const excess = calculateExcessBlobGas(0, target - BLOB_GAS_PER_BLOB);
    try testing.expectEqual(@as(u64, 0), excess);
}

test "excess blob gas at target boundary plus one blob" {
    const target = 393216;
    const excess = calculateExcessBlobGas(0, target + BLOB_GAS_PER_BLOB);
    try testing.expectEqual(BLOB_GAS_PER_BLOB, excess);
}

test "blob price at target boundary" {
    const target = 393216;

    // Price with zero excess
    const price_zero = calculateBlobGasPrice(0);

    // Price with 1 target excess still floors to 1 wei (e^0.118 = 1.125)
    const price_target = calculateBlobGasPrice(target);

    try testing.expectEqual(@as(u64, 1), price_zero);
    try testing.expectEqual(@as(u64, 1), price_target);
}

test "blob gas cost calculation with zero base fee" {
    const hash = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hashes = [_]VersionedHash{hash};

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 100,
        .blob_versioned_hashes = &hashes,
    };

    const cost = tx.blobGasCost(0);
    try testing.expectEqual(@as(u64, 0), cost);
}

test "blob gas cost calculation with high base fee" {
    const hash = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hashes = [_]VersionedHash{hash};

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1000000,
        .blob_versioned_hashes = &hashes,
    };

    const base_fee: u64 = 1000000;
    const expected = BLOB_GAS_PER_BLOB * base_fee;
    const cost = tx.blobGasCost(base_fee);
    try testing.expectEqual(expected, cost);
}

// Gas price calculation edge cases

test "gas price with maximum practical excess" {
    // Test with very high excess (100 blobs worth)
    const high_excess = 100 * BLOB_GAS_PER_BLOB;
    const price = calculateBlobGasPrice(high_excess);
    try testing.expect(price > MIN_BLOB_BASE_FEE);
}

test "gas price progression with incremental excess" {
    var excess: u64 = 0;
    var prev_price = calculateBlobGasPrice(excess);

    for (0..10) |_| {
        excess += BLOB_GAS_PER_BLOB;
        const price = calculateBlobGasPrice(excess);
        try testing.expect(price >= prev_price); // Should never decrease
        prev_price = price;
    }
}

test "blob transaction cost realistic scenario" {
    const hash1 = commitmentToVersionedHash(@as([48]u8, @splat(0x01)));
    const hash2 = commitmentToVersionedHash(@as([48]u8, @splat(0x02)));
    const hash3 = commitmentToVersionedHash(@as([48]u8, @splat(0x03)));
    const hashes = [_]VersionedHash{ hash1, hash2, hash3 };

    const tx = BlobTransaction{
        .max_fee_per_blob_gas = 1000000,
        .blob_versioned_hashes = &hashes,
    };

    try tx.validate();

    // Calculate gas with current excess
    const excess_blob_gas: u64 = BLOB_GAS_PER_BLOB * 2;
    const blob_base_fee = calculateBlobGasPrice(excess_blob_gas);
    const total_cost = tx.blobGasCost(blob_base_fee);

    // Verify cost is reasonable
    try testing.expect(total_cost > 0);
    try testing.expectEqual(@as(u64, 3 * BLOB_GAS_PER_BLOB), tx.blobGasUsed());
}

test "excess blob gas converges to zero with low usage" {
    var excess: u64 = 10 * BLOB_GAS_PER_BLOB; // Start high

    // Use 1 blob per block (well below target of 3)
    for (0..20) |_| {
        const prev_excess = excess;
        excess = calculateExcessBlobGas(excess, BLOB_GAS_PER_BLOB);

        if (excess > 0) {
            try testing.expect(excess <= prev_excess); // Should decrease or stay zero
        }
    }

    // Should eventually reach zero
    try testing.expectEqual(@as(u64, 0), excess);
}

// Tests for isValid

test "isValid with correct size" {
    const blob: Blob = @as([BYTES_PER_BLOB]u8, @splat(0x00));
    try testing.expect(isValid(&blob));
}

test "isValid with wrong size too small" {
    const blob = @as([BYTES_PER_BLOB - 1]u8, @splat(0x00));
    try testing.expect(!isValid(&blob));
}

test "isValid with wrong size too large" {
    const blob = @as([BYTES_PER_BLOB + 1]u8, @splat(0x00));
    try testing.expect(!isValid(&blob));
}

test "isValid with zero size" {
    const blob = [_]u8{};
    try testing.expect(!isValid(&blob));
}

// Tests for estimateBlobCount

test "estimateBlobCount with zero data" {
    const count = estimateBlobCount(0);
    try testing.expectEqual(@as(usize, 0), count);
}

test "estimateBlobCount with small data" {
    const count = estimateBlobCount(100);
    try testing.expectEqual(@as(usize, 1), count);
}

test "estimateBlobCount at exact boundary" {
    const max_per_blob = MAX_DATA_PER_BLOB;
    const count = estimateBlobCount(max_per_blob);
    try testing.expectEqual(@as(usize, 1), count);
}

test "estimateBlobCount just over boundary" {
    const max_per_blob = MAX_DATA_PER_BLOB;
    const count = estimateBlobCount(max_per_blob + 1);
    try testing.expectEqual(@as(usize, 2), count);
}

test "estimateBlobCount boundaries at 126972" {
    try testing.expectEqual(@as(usize, 1), estimateBlobCount(1));
    try testing.expectEqual(@as(usize, 1), estimateBlobCount(126_972));
    try testing.expectEqual(@as(usize, 2), estimateBlobCount(126_973));
    try testing.expectEqual(@as(usize, 6), estimateBlobCount(126_972 * 6));
    try testing.expectEqual(@as(usize, 7), estimateBlobCount(126_972 * 6 + 1));
}

test "estimateBlobCount multiple blobs" {
    const max_per_blob = MAX_DATA_PER_BLOB;
    const count = estimateBlobCount(max_per_blob * 3 + 1000);
    try testing.expectEqual(@as(usize, 4), count);
}

// Tests for calculateGas

test "calculateGas with zero blobs" {
    const gas = try calculateGas(0);
    try testing.expectEqual(@as(u64, 0), gas);
}

test "calculateGas with one blob" {
    const gas = try calculateGas(1);
    try testing.expectEqual(BLOB_GAS_PER_BLOB, gas);
}

test "calculateGas with max blobs" {
    const gas = try calculateGas(MAX_BLOBS_PER_TRANSACTION);
    try testing.expectEqual(@as(u64, MAX_BLOBS_PER_TRANSACTION * BLOB_GAS_PER_BLOB), gas);
}

test "calculateGas fails with too many blobs" {
    const result = calculateGas(MAX_BLOBS_PER_TRANSACTION + 1);
    try testing.expectError(BlobError.TooManyBlobs, result);
}

test "calculateGas with multiple blobs" {
    const gas = try calculateGas(3);
    try testing.expectEqual(@as(u64, 3 * BLOB_GAS_PER_BLOB), gas);
}

// Tests for splitData and joinData

test "splitData and joinData round trip small data" {
    const allocator = testing.allocator;
    const data = "Hello, blob world!";

    const blobs = try splitData(allocator, data);
    defer allocator.free(blobs);

    const recovered = try joinData(allocator, blobs);
    defer allocator.free(recovered);

    try testing.expectEqualStrings(data, recovered);
}

test "splitData and joinData round trip large data" {
    const allocator = testing.allocator;
    const max_per_blob = MAX_DATA_PER_BLOB;
    const data_size = max_per_blob * 2 + 1000;

    const data = try allocator.alloc(u8, data_size);
    defer allocator.free(data);

    for (data, 0..) |*b, i| {
        b.* = @intCast(i % 256);
    }

    const blobs = try splitData(allocator, data);
    defer allocator.free(blobs);

    try testing.expectEqual(@as(usize, 3), blobs.len);

    const recovered = try joinData(allocator, blobs);
    defer allocator.free(recovered);

    try testing.expectEqualSlices(u8, data, recovered);
}

test "splitData at exact boundary" {
    const allocator = testing.allocator;
    const max_per_blob = MAX_DATA_PER_BLOB;

    const data = try allocator.alloc(u8, max_per_blob);
    defer allocator.free(data);
    @memset(data, 0x42);

    const blobs = try splitData(allocator, data);
    defer allocator.free(blobs);

    try testing.expectEqual(@as(usize, 1), blobs.len);

    const recovered = try joinData(allocator, blobs);
    defer allocator.free(recovered);

    try testing.expectEqualSlices(u8, data, recovered);
}

test "splitData just over boundary" {
    const allocator = testing.allocator;
    const max_per_blob = MAX_DATA_PER_BLOB;

    const data = try allocator.alloc(u8, max_per_blob + 1);
    defer allocator.free(data);
    @memset(data, 0x33);

    const blobs = try splitData(allocator, data);
    defer allocator.free(blobs);

    try testing.expectEqual(@as(usize, 2), blobs.len);

    const recovered = try joinData(allocator, blobs);
    defer allocator.free(recovered);

    try testing.expectEqualSlices(u8, data, recovered);
}

test "splitData fails with too many blobs needed" {
    const allocator = testing.allocator;
    const max_per_blob = MAX_DATA_PER_BLOB;
    const data_size = max_per_blob * (MAX_BLOBS_PER_TRANSACTION + 1);

    const data = try allocator.alloc(u8, data_size);
    defer allocator.free(data);

    const result = splitData(allocator, data);
    try testing.expectError(BlobError.TooManyBlobs, result);
}

test "splitData empty data" {
    const allocator = testing.allocator;
    const data = [_]u8{};

    const blobs = try splitData(allocator, &data);
    defer allocator.free(blobs);

    try testing.expectEqual(@as(usize, 0), blobs.len);

    const recovered = try joinData(allocator, blobs);
    defer allocator.free(recovered);

    try testing.expectEqual(@as(usize, 0), recovered.len);
}

test "splitData max blobs exactly" {
    const allocator = testing.allocator;
    const max_per_blob = MAX_DATA_PER_BLOB;
    const data_size = max_per_blob * MAX_BLOBS_PER_TRANSACTION;

    const data = try allocator.alloc(u8, data_size);
    defer allocator.free(data);

    for (data, 0..) |*b, i| {
        b.* = @intCast(i % 256);
    }

    const blobs = try splitData(allocator, data);
    defer allocator.free(blobs);

    try testing.expectEqual(@as(usize, MAX_BLOBS_PER_TRANSACTION), blobs.len);

    const recovered = try joinData(allocator, blobs);
    defer allocator.free(recovered);

    try testing.expectEqualSlices(u8, data, recovered);
}

test "joinData preserves data boundaries" {
    const allocator = testing.allocator;
    const max_per_blob = MAX_DATA_PER_BLOB;
    const data_size = max_per_blob * 2;

    const data = try allocator.alloc(u8, data_size);
    defer allocator.free(data);

    // Mark boundaries
    data[0] = 0x01; // Start of first blob
    data[max_per_blob - 1] = 0x02; // End of first blob
    data[max_per_blob] = 0x03; // Start of second blob
    data[data_size - 1] = 0x04; // End of second blob

    const blobs = try splitData(allocator, data);
    defer allocator.free(blobs);

    const recovered = try joinData(allocator, blobs);
    defer allocator.free(recovered);

    try testing.expectEqual(@as(u8, 0x01), recovered[0]);
    try testing.expectEqual(@as(u8, 0x02), recovered[max_per_blob - 1]);
    try testing.expectEqual(@as(u8, 0x03), recovered[max_per_blob]);
    try testing.expectEqual(@as(u8, 0x04), recovered[data_size - 1]);
}

// ============================================================================
// EIP-7691 / EIP-7892 (BPO1/BPO2) / EIP-7918 Blob Fee Market Tests
// ============================================================================

test "BlobSchedule - presets and constants" {
    try testing.expectEqual(@as(u64, 131_072), GAS_PER_BLOB);
    try testing.expectEqual(@as(u64, 8_192), BLOB_BASE_COST);
    try testing.expectEqual(@as(u64, 1), MIN_BLOB_BASE_FEE);

    try testing.expectEqual(@as(u64, 3), BlobSchedule.cancun.target);
    try testing.expectEqual(@as(u64, 6), BlobSchedule.cancun.max);
    try testing.expectEqual(@as(u64, 3_338_477), BlobSchedule.cancun.base_fee_update_fraction);
    try testing.expectEqual(@as(u64, 393_216), BlobSchedule.cancun.targetBlobGas());
    try testing.expectEqual(@as(u64, 786_432), BlobSchedule.cancun.maxBlobGas());

    try testing.expectEqual(@as(u64, 6), BlobSchedule.prague.target);
    try testing.expectEqual(@as(u64, 9), BlobSchedule.prague.max);
    try testing.expectEqual(@as(u64, 5_007_716), BlobSchedule.prague.base_fee_update_fraction);

    try testing.expectEqual(BlobSchedule.prague, BlobSchedule.osaka);

    try testing.expectEqual(@as(u64, 10), BlobSchedule.bpo1.target);
    try testing.expectEqual(@as(u64, 15), BlobSchedule.bpo1.max);
    try testing.expectEqual(@as(u64, 8_346_193), BlobSchedule.bpo1.base_fee_update_fraction);

    try testing.expectEqual(@as(u64, 14), BlobSchedule.bpo2.target);
    try testing.expectEqual(@as(u64, 21), BlobSchedule.bpo2.max);
    try testing.expectEqual(@as(u64, 11_684_671), BlobSchedule.bpo2.base_fee_update_fraction);
}

test "BlobSchedule - forHardfork and forTimestamp boundaries" {
    try testing.expectEqual(@as(?BlobSchedule, null), BlobSchedule.forHardfork(.FRONTIER));
    try testing.expectEqual(@as(?BlobSchedule, null), BlobSchedule.forHardfork(.SHANGHAI));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.cancun), BlobSchedule.forHardfork(.CANCUN));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.prague), BlobSchedule.forHardfork(.PRAGUE));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.osaka), BlobSchedule.forHardfork(.OSAKA));

    try testing.expectEqual(@as(?BlobSchedule, null), BlobSchedule.forTimestamp(0));
    try testing.expectEqual(@as(?BlobSchedule, null), BlobSchedule.forTimestamp(BlobSchedule.CANCUN_TIMESTAMP - 1));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.cancun), BlobSchedule.forTimestamp(BlobSchedule.CANCUN_TIMESTAMP));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.cancun), BlobSchedule.forTimestamp(BlobSchedule.PRAGUE_TIMESTAMP - 1));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.prague), BlobSchedule.forTimestamp(BlobSchedule.PRAGUE_TIMESTAMP));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.prague), BlobSchedule.forTimestamp(BlobSchedule.OSAKA_TIMESTAMP - 1));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.osaka), BlobSchedule.forTimestamp(BlobSchedule.OSAKA_TIMESTAMP));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.osaka), BlobSchedule.forTimestamp(BlobSchedule.BPO1_TIMESTAMP - 1));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.bpo1), BlobSchedule.forTimestamp(1_765_290_071));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.bpo1), BlobSchedule.forTimestamp(BlobSchedule.BPO2_TIMESTAMP - 1));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.bpo2), BlobSchedule.forTimestamp(1_767_747_671));
    try testing.expectEqual(@as(?BlobSchedule, BlobSchedule.bpo2), BlobSchedule.forTimestamp(std.math.maxInt(u64)));
}

test "calculateBlobBaseFeeForSchedule - exact cross-schedule vectors" {
    const Case = struct { schedule: BlobSchedule, excess: u64, expected: u256 };
    const cases = [_]Case{
        .{ .schedule = .cancun, .excess = 0, .expected = 1 },
        .{ .schedule = .cancun, .excess = 10_000_000, .expected = 19 },
        .{ .schedule = .cancun, .excess = 50_000_000, .expected = 3_194_333 },
        .{ .schedule = .cancun, .excess = 100_000_000, .expected = 10_203_769_476_395 },
        .{ .schedule = .cancun, .excess = 400_000_000, .expected = 10_840_331_274_704_280_429_132_033_759_016_842_817_414_750_029_778_539 },
        .{ .schedule = .prague, .excess = 0, .expected = 1 },
        .{ .schedule = .prague, .excess = 10_000_000, .expected = 7 },
        .{ .schedule = .prague, .excess = 50_000_000, .expected = 21_689 },
        .{ .schedule = .prague, .excess = 100_000_000, .expected = 470_442_149 },
        .{ .schedule = .prague, .excess = 250_385_800, .expected = 5_184_705_528_553_908_270_369 },
        .{ .schedule = .prague, .excess = 400_000_000, .expected = 48_980_690_787_953_896_757_236_758_600_209_812 },
        .{ .schedule = .bpo1, .excess = 0, .expected = 1 },
        .{ .schedule = .bpo1, .excess = 10_000_000, .expected = 3 },
        .{ .schedule = .bpo1, .excess = 50_000_000, .expected = 399 },
        .{ .schedule = .bpo1, .excess = 100_000_000, .expected = 159_773 },
        .{ .schedule = .bpo1, .excess = 400_000_000, .expected = 651_652_063_382_501_955_831 },
        .{ .schedule = .bpo2, .excess = 0, .expected = 1 },
        .{ .schedule = .bpo2, .excess = 10_000_000, .expected = 2 },
        .{ .schedule = .bpo2, .excess = 50_000_000, .expected = 72 },
        .{ .schedule = .bpo2, .excess = 100_000_000, .expected = 5_209 },
        .{ .schedule = .bpo2, .excess = 400_000_000, .expected = 736_466_686_905_748 },
    };
    for (cases) |c| {
        try testing.expectEqual(c.expected, calculateBlobBaseFeeForSchedule(c.excess, c.schedule));
    }
}

test "calculateExcessBlobGasEip7918 - strict '>' boundary (16 vs 17 wei), floor division, and BPO transitions" {
    const osaka_target = 6 * GAS_PER_BLOB;

    // Below target always returns 0 regardless of reserve price
    try testing.expectEqual(@as(u64, 0), calculateExcessBlobGasEip7918(0, osaka_target - 1, 1_000_000_000, .osaka));

    // At blob_base_fee = 1 wei:
    // BLOB_BASE_COST * 16 = 131_072 == GAS_PER_BLOB * 1 -> strict '>' is FALSE (normal rule)
    // BLOB_BASE_COST * 17 = 139_264 >  GAS_PER_BLOB * 1 -> strict '>' is TRUE  (reserve rule)
    try testing.expectEqual(@as(u64, 0), calculateExcessBlobGasEip7918(0, osaka_target, 15, .osaka));
    try testing.expectEqual(@as(u64, 0), calculateExcessBlobGasEip7918(0, osaka_target, 16, .osaka));
    try testing.expectEqual(@as(u64, 262_144), calculateExcessBlobGasEip7918(0, osaka_target, 17, .osaka));
    try testing.expectEqual(@as(u64, 0), calculateExcessBlobGasEip7918(0, osaka_target, 0, .osaka));

    // Existing excess = 1 blob, used = 6 blobs (target)
    try testing.expectEqual(@as(u64, GAS_PER_BLOB), calculateExcessBlobGasEip7918(GAS_PER_BLOB, osaka_target, 16, .osaka));
    try testing.expectEqual(@as(u64, 393_216), calculateExcessBlobGasEip7918(GAS_PER_BLOB, osaka_target, 17, .osaka));

    // Floor division check: 7 * 131072 * (9 - 6) / 9 = 305_834 (not 305_834.66...)
    try testing.expectEqual(@as(u64, 305_834), calculateExcessBlobGasEip7918(0, 7 * GAS_PER_BLOB, 17, .osaka));
    // Full block (9 blobs): 9 * 131072 * 3 / 9 = 393_216
    try testing.expectEqual(@as(u64, 393_216), calculateExcessBlobGasEip7918(0, 9 * GAS_PER_BLOB, 17, .osaka));

    // BPO1 transition (excess = 27 blobs, base_fee = 17 wei):
    // Under Osaka (fraction 5_007_716): fee = 2 > 17/16 -> normal rule: 27 - 6 = 21 blobs
    // Under BPO1  (fraction 8_346_193): fee = 1 < 17/16 -> reserve rule: 27 + 0 = 27 blobs
    const bpo1_excess = 27 * GAS_PER_BLOB;
    try testing.expectEqual(@as(u64, 21 * GAS_PER_BLOB), calculateExcessBlobGasEip7918(bpo1_excess, 0, 17, .osaka));
    try testing.expectEqual(@as(u64, bpo1_excess), calculateExcessBlobGasEip7918(bpo1_excess, 0, 17, .bpo1));

    // BPO2 transition (excess = 50 blobs, base_fee = 17 wei):
    // Under BPO1: fee = 2 -> normal rule: 50 - 10 = 40 blobs
    // Under BPO2: fee = 1 -> reserve rule: 50 blobs
    const bpo2_excess = 50 * GAS_PER_BLOB;
    try testing.expectEqual(@as(u64, 40 * GAS_PER_BLOB), calculateExcessBlobGasEip7918(bpo2_excess, 0, 17, .bpo1));
    try testing.expectEqual(@as(u64, bpo2_excess), calculateExcessBlobGasEip7918(bpo2_excess, 0, 17, .bpo2));

    // Custom schedule: target=2, max=5, used=3 blobs -> 3 * 131072 * 3 / 5 = 235_929
    const custom = BlobSchedule{ .target = 2, .max = 5, .base_fee_update_fraction = 3_000_000 };
    try testing.expectEqual(@as(u64, 235_929), calculateExcessBlobGasEip7918(0, 3 * GAS_PER_BLOB, 17, custom));
}

test "calculateExcessBlobGasEip7918 - overflow-safe u64/u256 extremes and fork/timestamp helpers" {
    const max_u64 = std.math.maxInt(u64);
    const max_u256 = std.math.maxInt(u256);
    const osaka_target = 6 * GAS_PER_BLOB;

    // Extreme inputs never overflow or hang
    try testing.expectEqual(max_u256, calculateBlobBaseFeeForSchedule(max_u64, .osaka));
    try testing.expectEqual(max_u64 - osaka_target, calculateExcessBlobGasEip7918(max_u64, 0, max_u256, .osaka));
    try testing.expectEqual(max_u64, calculateExcessBlobGasEip7918(max_u64, osaka_target, max_u256, .osaka));
    try testing.expectEqual(@as(u64, 262_144), calculateExcessBlobGasEip7918(0, osaka_target, max_u256, .osaka));

    // Hardfork and timestamp helpers
    try testing.expectEqual(@as(?u64, null), calculateExcessBlobGasForHardfork(0, osaka_target, 17, .SHANGHAI));
    try testing.expectEqual(@as(?u64, 3 * GAS_PER_BLOB), calculateExcessBlobGasForHardfork(0, osaka_target, 17, .CANCUN));
    try testing.expectEqual(@as(?u64, 0), calculateExcessBlobGasForHardfork(0, osaka_target, 17, .PRAGUE));
    try testing.expectEqual(@as(?u64, 262_144), calculateExcessBlobGasForHardfork(0, osaka_target, 17, .OSAKA));

    try testing.expectEqual(@as(?u64, null), calculateExcessBlobGasForTimestamp(0, osaka_target, 17, BlobSchedule.CANCUN_TIMESTAMP - 1));
    try testing.expectEqual(@as(?u64, 0), calculateExcessBlobGasForTimestamp(0, osaka_target, 17, BlobSchedule.PRAGUE_TIMESTAMP));
    try testing.expectEqual(@as(?u64, 262_144), calculateExcessBlobGasForTimestamp(0, osaka_target, 17, BlobSchedule.OSAKA_TIMESTAMP));
    // Exact BPO1 & BPO2 activation boundaries
    try testing.expectEqual(@as(?u64, 21 * GAS_PER_BLOB), calculateExcessBlobGasForTimestamp(27 * GAS_PER_BLOB, 0, 17, BlobSchedule.BPO1_TIMESTAMP - 1));
    try testing.expectEqual(@as(?u64, 27 * GAS_PER_BLOB), calculateExcessBlobGasForTimestamp(27 * GAS_PER_BLOB, 0, 17, BlobSchedule.BPO1_TIMESTAMP));
    try testing.expectEqual(@as(?u64, 40 * GAS_PER_BLOB), calculateExcessBlobGasForTimestamp(50 * GAS_PER_BLOB, 0, 17, BlobSchedule.BPO2_TIMESTAMP - 1));
    try testing.expectEqual(@as(?u64, 50 * GAS_PER_BLOB), calculateExcessBlobGasForTimestamp(50 * GAS_PER_BLOB, 0, 17, BlobSchedule.BPO2_TIMESTAMP));
}
