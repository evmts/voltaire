const std = @import("std");
const primitives = @import("primitives");

pub const SYNC_COMMITTEE_SIZE: usize = 512;
pub const BLS_PUBLIC_KEY_SIZE: usize = 48;

pub const SyncCommittee = struct {
    pubkeys: [SYNC_COMMITTEE_SIZE][BLS_PUBLIC_KEY_SIZE]u8,
    aggregate_pubkey: [BLS_PUBLIC_KEY_SIZE]u8,

    pub fn equals(self: SyncCommittee, other: SyncCommittee) bool {
        return std.mem.eql(u8, std.mem.asBytes(&self.pubkeys), std.mem.asBytes(&other.pubkeys)) and
            std.mem.eql(u8, &self.aggregate_pubkey, &other.aggregate_pubkey);
    }

    pub fn hashTreeRoot(self: SyncCommittee, allocator: std.mem.Allocator) ![32]u8 {
        var pubkey_roots: [SYNC_COMMITTEE_SIZE][32]u8 = undefined;

        for (0..SYNC_COMMITTEE_SIZE) |i| {
            pubkey_roots[i] = try primitives.Ssz.hashTreeRoot(allocator, &self.pubkeys[i]);
        }

        const pubkeys_root = try primitives.Ssz.hashTreeRoot(
            allocator,
            std.mem.sliceAsBytes(pubkey_roots[0..]),
        );
        const aggregate_pubkey_root = try primitives.Ssz.hashTreeRoot(allocator, &self.aggregate_pubkey);

        var container_data: [64]u8 = undefined;
        @memcpy(container_data[0..32], &pubkeys_root);
        @memcpy(container_data[32..64], &aggregate_pubkey_root);

        return try primitives.Ssz.hashTreeRoot(allocator, &container_data);
    }
};

test "SyncCommittee: construction" {
    const committee = SyncCommittee{
        .pubkeys = @as([SYNC_COMMITTEE_SIZE][BLS_PUBLIC_KEY_SIZE]u8, @splat(@as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0)))),
        .aggregate_pubkey = @as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0)),
    };

    try std.testing.expectEqual(@as(usize, SYNC_COMMITTEE_SIZE), committee.pubkeys.len);
    try std.testing.expectEqual(@as(usize, BLS_PUBLIC_KEY_SIZE), committee.pubkeys[0].len);
    try std.testing.expectEqual(@as(usize, BLS_PUBLIC_KEY_SIZE), committee.aggregate_pubkey.len);
}

test "SyncCommittee: equals returns true for equal committees" {
    var pubkeys = @as([SYNC_COMMITTEE_SIZE][BLS_PUBLIC_KEY_SIZE]u8, @splat(@as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0))));
    pubkeys[0][0] = 1;
    pubkeys[SYNC_COMMITTEE_SIZE - 1][BLS_PUBLIC_KEY_SIZE - 1] = 2;

    var aggregate_pubkey = @as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0));
    aggregate_pubkey[0] = 3;

    const a = SyncCommittee{
        .pubkeys = pubkeys,
        .aggregate_pubkey = aggregate_pubkey,
    };
    const b = SyncCommittee{
        .pubkeys = pubkeys,
        .aggregate_pubkey = aggregate_pubkey,
    };

    try std.testing.expect(a.equals(b));
}

test "SyncCommittee: equals returns false for different committees" {
    const a = SyncCommittee{
        .pubkeys = @as([SYNC_COMMITTEE_SIZE][BLS_PUBLIC_KEY_SIZE]u8, @splat(@as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0)))),
        .aggregate_pubkey = @as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0)),
    };

    var different_aggregate_pubkey = @as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0));
    different_aggregate_pubkey[0] = 1;
    const b = SyncCommittee{
        .pubkeys = @as([SYNC_COMMITTEE_SIZE][BLS_PUBLIC_KEY_SIZE]u8, @splat(@as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0)))),
        .aggregate_pubkey = different_aggregate_pubkey,
    };

    try std.testing.expect(!a.equals(b));
}

test "SyncCommittee: hashTreeRoot is consistent" {
    const allocator = std.testing.allocator;

    var committee = SyncCommittee{
        .pubkeys = @as([SYNC_COMMITTEE_SIZE][BLS_PUBLIC_KEY_SIZE]u8, @splat(@as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0)))),
        .aggregate_pubkey = @as([BLS_PUBLIC_KEY_SIZE]u8, @splat(0)),
    };
    committee.pubkeys[0][0] = 11;
    committee.pubkeys[100][17] = 22;
    committee.pubkeys[SYNC_COMMITTEE_SIZE - 1][BLS_PUBLIC_KEY_SIZE - 1] = 33;
    committee.aggregate_pubkey[0] = 44;

    const root_a = try committee.hashTreeRoot(allocator);
    const root_b = try committee.hashTreeRoot(allocator);
    try std.testing.expectEqual(root_a, root_b);

    var changed_committee = committee;
    changed_committee.aggregate_pubkey[0] ^= 1;
    const changed_root = try changed_committee.hashTreeRoot(allocator);
    try std.testing.expect(!std.mem.eql(u8, &root_a, &changed_root));
}
