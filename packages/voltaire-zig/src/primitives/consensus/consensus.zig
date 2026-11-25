const std = @import("std");
const primitives = @import("primitives");
const crypto = @import("crypto");

pub fn isValidMerkleBranch(
    leaf: [32]u8,
    branch: []const [32]u8,
    depth: u6,
    index: u64,
    root: [32]u8,
) bool {
    if (branch.len != @as(usize, depth)) {
        return false;
    }

    var derived_root = leaf;
    var i: u6 = 0;
    while (i < depth) : (i += 1) {
        if (((index >> i) & 1) == 1) {
            derived_root = primitives.Ssz.merkle.hashPair(branch[@as(usize, i)], derived_root);
        } else {
            derived_root = primitives.Ssz.merkle.hashPair(derived_root, branch[@as(usize, i)]);
        }
    }

    return std.mem.eql(u8, &derived_root, &root);
}

pub fn isExecutionPayloadProofValid(
    body_root: [32]u8,
    execution_hash: [32]u8,
    execution_branch: [4][32]u8,
) bool {
    return isValidMerkleBranch(execution_hash, execution_branch[0..], 4, 25, body_root);
}

pub fn isFinalityProofValid(
    attested_state_root: [32]u8,
    finality_root: [32]u8,
    finality_branch: []const [32]u8,
) bool {
    return isValidMerkleBranch(finality_root, finality_branch, 6, 105, attested_state_root);
}

pub fn isNextCommitteeProofValid(
    attested_state_root: [32]u8,
    committee_root: [32]u8,
    branch: []const [32]u8,
) bool {
    return isValidMerkleBranch(committee_root, branch, 5, 55, attested_state_root);
}

pub fn isCurrentCommitteeProofValid(
    attested_state_root: [32]u8,
    committee_root: [32]u8,
    branch: []const [32]u8,
) bool {
    return isValidMerkleBranch(committee_root, branch, 5, 54, attested_state_root);
}

pub fn calcSyncPeriod(slot: u64) u64 {
    return slot / 32 / 256;
}

fn expectedCurrentSlotAtTime(current_unix_time: u64, genesis_time: u64) u64 {
    if (current_unix_time <= genesis_time) {
        return 0;
    }
    return (current_unix_time - genesis_time) / 12;
}

pub fn expectedCurrentSlot(io: std.Io, genesis_time: u64) u64 {
    const now = std.Io.Timestamp.now(io, .real).toSeconds();
    if (now <= 0) {
        return 0;
    }
    return expectedCurrentSlotAtTime(@as(u64, @intCast(now)), genesis_time);
}

pub fn verifySyncCommitteeSignatureStub(
    signing_root: [32]u8,
    sync_committee_root: [32]u8,
    signature: [96]u8,
    public_keys: []const [48]u8,
) bool {
    _ = signing_root;
    _ = sync_committee_root;
    _ = signature;
    _ = public_keys;
    _ = crypto.bls12_381.DST.ETH2_SIGNATURE;
    // TODO: Implement BLS aggregate signature verification for sync committee signatures.
    return true;
}

fn filled32(value: u8) [32]u8 {
    return @as([32]u8, @splat(value));
}

test "isValidMerkleBranch with known good proof" {
    const leaf = filled32(0x11);
    const sibling_0 = filled32(0x22);
    const sibling_1 = filled32(0x33);
    const index: u64 = 2;

    const level_1 = primitives.Ssz.merkle.hashPair(leaf, sibling_0);
    const root = primitives.Ssz.merkle.hashPair(sibling_1, level_1);

    const branch = [_][32]u8{ sibling_0, sibling_1 };
    try std.testing.expect(isValidMerkleBranch(leaf, &branch, 2, index, root));
}

test "isValidMerkleBranch rejects bad proof" {
    const leaf = filled32(0x11);
    const sibling_0 = filled32(0x22);
    const sibling_1 = filled32(0x33);
    const index: u64 = 2;

    const level_1 = primitives.Ssz.merkle.hashPair(leaf, sibling_0);
    const root = primitives.Ssz.merkle.hashPair(sibling_1, level_1);

    var bad_branch = [_][32]u8{ sibling_0, sibling_1 };
    bad_branch[0][0] ^= 0x01;
    try std.testing.expect(!isValidMerkleBranch(leaf, &bad_branch, 2, index, root));
}

test "calcSyncPeriod for known slots" {
    try std.testing.expectEqual(@as(u64, 0), calcSyncPeriod(0));
    try std.testing.expectEqual(@as(u64, 0), calcSyncPeriod(31));
    try std.testing.expectEqual(@as(u64, 0), calcSyncPeriod(8191));
    try std.testing.expectEqual(@as(u64, 1), calcSyncPeriod(8192));
    try std.testing.expectEqual(@as(u64, 3), calcSyncPeriod(24640));
}

test "expectedCurrentSlot basic test" {
    const now = std.Io.Timestamp.now(std.testing.io, .real).toSeconds();
    if (now <= 0) {
        return;
    }

    const now_u64 = @as(u64, @intCast(now));
    const genesis_time = if (now_u64 > 120) now_u64 - 120 else 0;
    const expected = expectedCurrentSlotAtTime(now_u64, genesis_time);
    const actual = expectedCurrentSlot(std.testing.io, genesis_time);

    try std.testing.expect(actual == expected or actual == expected + 1);
}
