const std = @import("std");
const primitives = @import("primitives");

comptime {
    _ = primitives;
}

pub const SYNC_COMMITTEE_SIZE: usize = 512;
pub const SYNC_COMMITTEE_BITS_SIZE: usize = 64;
pub const SYNC_COMMITTEE_SIGNATURE_SIZE: usize = 96;
pub const SYNC_COMMITTEE_QUORUM: usize = (SYNC_COMMITTEE_SIZE * 2 + 2) / 3;

pub const SyncAggregate = struct {
    sync_committee_bits: [SYNC_COMMITTEE_BITS_SIZE]u8,
    sync_committee_signature: [SYNC_COMMITTEE_SIGNATURE_SIZE]u8,

    pub fn equals(self: SyncAggregate, other: SyncAggregate) bool {
        return std.mem.eql(u8, &self.sync_committee_bits, &other.sync_committee_bits) and
            std.mem.eql(u8, &self.sync_committee_signature, &other.sync_committee_signature);
    }

    pub fn participantCount(self: SyncAggregate) usize {
        var participants: usize = 0;
        for (self.sync_committee_bits) |byte| {
            participants += @as(usize, @intCast(@popCount(byte)));
        }
        return participants;
    }

    pub fn hasQuorum(self: SyncAggregate) bool {
        return self.participantCount() >= SYNC_COMMITTEE_QUORUM;
    }
};

fn setFirstParticipants(bits: *[SYNC_COMMITTEE_BITS_SIZE]u8, count: usize) void {
    @memset(bits, 0);

    var i: usize = 0;
    while (i < count and i < SYNC_COMMITTEE_SIZE) : (i += 1) {
        const byte_index = i / 8;
        const bit_index: u3 = @intCast(i % 8);
        bits[byte_index] |= @as(u8, 1) << bit_index;
    }
}

test "SyncAggregate: construction" {
    const aggregate = SyncAggregate{
        .sync_committee_bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0)),
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };

    try std.testing.expectEqual(@as(usize, SYNC_COMMITTEE_BITS_SIZE), aggregate.sync_committee_bits.len);
    try std.testing.expectEqual(@as(usize, SYNC_COMMITTEE_SIGNATURE_SIZE), aggregate.sync_committee_signature.len);
}

test "SyncAggregate: equals returns true for equal aggregates" {
    var bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0));
    bits[0] = 0b10101010;
    bits[10] = 0b11110000;

    var signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0));
    signature[0] = 0x11;
    signature[SYNC_COMMITTEE_SIGNATURE_SIZE - 1] = 0x22;

    const a = SyncAggregate{
        .sync_committee_bits = bits,
        .sync_committee_signature = signature,
    };
    const b = SyncAggregate{
        .sync_committee_bits = bits,
        .sync_committee_signature = signature,
    };

    try std.testing.expect(a.equals(b));
}

test "SyncAggregate: equals returns false for different aggregates" {
    const a = SyncAggregate{
        .sync_committee_bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0)),
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };

    var different_bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0));
    different_bits[0] = 1;

    const b = SyncAggregate{
        .sync_committee_bits = different_bits,
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };

    try std.testing.expect(!a.equals(b));
}

test "SyncAggregate: participantCount with known bitvectors" {
    const none = SyncAggregate{
        .sync_committee_bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0)),
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };
    try std.testing.expectEqual(@as(usize, 0), none.participantCount());

    var first_byte = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0));
    first_byte[0] = 0xFF;
    const eight = SyncAggregate{
        .sync_committee_bits = first_byte,
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };
    try std.testing.expectEqual(@as(usize, 8), eight.participantCount());

    var mixed = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0));
    mixed[0] = 0b01010101; // 4
    mixed[1] = 0b11110000; // 4
    const mixed_aggregate = SyncAggregate{
        .sync_committee_bits = mixed,
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };
    try std.testing.expectEqual(@as(usize, 8), mixed_aggregate.participantCount());

    const full = SyncAggregate{
        .sync_committee_bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0xFF)),
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };
    try std.testing.expectEqual(@as(usize, SYNC_COMMITTEE_SIZE), full.participantCount());
}

test "SyncAggregate: hasQuorum threshold checks" {
    var below_quorum_bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0));
    setFirstParticipants(&below_quorum_bits, SYNC_COMMITTEE_QUORUM - 1);
    const below = SyncAggregate{
        .sync_committee_bits = below_quorum_bits,
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };
    try std.testing.expect(!below.hasQuorum());
    try std.testing.expectEqual(@as(usize, SYNC_COMMITTEE_QUORUM - 1), below.participantCount());

    var at_quorum_bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0));
    setFirstParticipants(&at_quorum_bits, SYNC_COMMITTEE_QUORUM);
    const at = SyncAggregate{
        .sync_committee_bits = at_quorum_bits,
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };
    try std.testing.expect(at.hasQuorum());
    try std.testing.expectEqual(@as(usize, SYNC_COMMITTEE_QUORUM), at.participantCount());

    const full = SyncAggregate{
        .sync_committee_bits = @as([SYNC_COMMITTEE_BITS_SIZE]u8, @splat(0xFF)),
        .sync_committee_signature = @as([SYNC_COMMITTEE_SIGNATURE_SIZE]u8, @splat(0)),
    };
    try std.testing.expect(full.hasQuorum());
}

test "SyncAggregate: quorum constant is 342 for size 512" {
    try std.testing.expectEqual(@as(usize, 342), SYNC_COMMITTEE_QUORUM);
}
