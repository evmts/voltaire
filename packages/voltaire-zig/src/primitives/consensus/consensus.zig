//! Consensus helper functions for light client
//!
//! Utility functions for sync period calculations and proof validation

const ConsensusSpec = @import("../ConsensusSpec/ConsensusSpec.zig");
const Ssz = @import("../Ssz/root.zig");

/// Calculate the sync period for a given slot
pub fn calcSyncPeriod(slot: u64) u64 {
    return slot / (ConsensusSpec.SLOTS_PER_EPOCH * ConsensusSpec.EPOCHS_PER_SYNC_COMMITTEE_PERIOD);
}

/// Calculate the expected current slot based on genesis time
pub fn expectedCurrentSlot(genesis_time: u64) u64 {
    const current_timestamp = @as(u64, @intCast(std.time.timestamp()));
    const seconds_since_genesis = current_timestamp - genesis_time;
    return seconds_since_genesis / ConsensusSpec.SECONDS_PER_SLOT;
}

/// Validate that the current sync committee proof is valid
pub fn isCurrentCommitteeProofValid(
    state_root: [32]u8,
    committee_root: [32]u8,
    branch: []const [32]u8,
) bool {
    return isValidMerkleBranch(committee_root, state_root, branch, 5);
}

/// Validate that the next sync committee proof is valid
pub fn isNextCommitteeProofValid(
    state_root: [32]u8,
    committee_root: [32]u8,
    branch: []const [32]u8,
) bool {
    return isValidMerkleBranch(committee_root, state_root, branch, 5);
}

/// Validate that the finality proof is valid
pub fn isFinalityProofValid(
    state_root: [32]u8,
    finalized_root: [32]u8,
    branch: []const [32]u8,
) bool {
    return isValidMerkleBranch(finalized_root, state_root, branch, 6);
}

/// Validate that the execution payload proof is valid
pub fn isExecutionPayloadProofValid(
    body_root: [32]u8,
    execution_root: [32]u8,
    branch: [4][32]u8,
) bool {
    return isValidMerkleBranch(execution_root, body_root, &branch, 4);
}

/// Validate a Merkle branch
fn isValidMerkleBranch(
    leaf: [32]u8,
    root: [32]u8,
    branch: []const [32]u8,
    depth: usize,
) bool {
    if (branch.len != depth) return false;

    var current = leaf;
    for (branch) |sibling| {
        current = Ssz.merkle.hashPair(current, sibling);
    }

    return std.mem.eql(u8, &current, &root);
}

const std = @import("std");

test "calcSyncPeriod computes sync committee period not epoch" {
    try std.testing.expectEqual(@as(u64, 0), calcSyncPeriod(0));
    try std.testing.expectEqual(@as(u64, 0), calcSyncPeriod(64));
    try std.testing.expectEqual(@as(u64, 0), calcSyncPeriod(96));
    try std.testing.expectEqual(@as(u64, 0), calcSyncPeriod(8191));
    try std.testing.expectEqual(@as(u64, 1), calcSyncPeriod(8192));
    try std.testing.expectEqual(@as(u64, 1), calcSyncPeriod(16383));
    try std.testing.expectEqual(@as(u64, 2), calcSyncPeriod(16384));
}
