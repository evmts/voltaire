const std = @import("std");
const primitives = @import("primitives");

pub const BeaconBlockHeader = struct {
    slot: u64,
    proposer_index: u64,
    parent_root: [32]u8,
    state_root: [32]u8,
    body_root: [32]u8,

    pub fn from(
        slot: u64,
        proposer_index: u64,
        parent_root: [32]u8,
        state_root: [32]u8,
        body_root: [32]u8,
    ) BeaconBlockHeader {
        return .{
            .slot = slot,
            .proposer_index = proposer_index,
            .parent_root = parent_root,
            .state_root = state_root,
            .body_root = body_root,
        };
    }

    pub fn equals(self: BeaconBlockHeader, other: BeaconBlockHeader) bool {
        return self.slot == other.slot and
            self.proposer_index == other.proposer_index and
            std.mem.eql(u8, &self.parent_root, &other.parent_root) and
            std.mem.eql(u8, &self.state_root, &other.state_root) and
            std.mem.eql(u8, &self.body_root, &other.body_root);
    }

    pub fn hashTreeRoot(self: BeaconBlockHeader, allocator: std.mem.Allocator) ![32]u8 {
        const slot_root = primitives.Ssz.merkle.hashTreeRootBasic(u64, self.slot);
        const proposer_index_root = primitives.Ssz.merkle.hashTreeRootBasic(u64, self.proposer_index);

        var field_roots: [32 * 5]u8 = undefined;
        @memcpy(field_roots[0..32], &slot_root);
        @memcpy(field_roots[32..64], &proposer_index_root);
        @memcpy(field_roots[64..96], &self.parent_root);
        @memcpy(field_roots[96..128], &self.state_root);
        @memcpy(field_roots[128..160], &self.body_root);

        return try primitives.Ssz.merkle.hashTreeRoot(allocator, &field_roots);
    }

    pub fn sszSerialize(self: BeaconBlockHeader) [112]u8 {
        var bytes: [112]u8 = undefined;
        std.mem.writeInt(u64, bytes[0..8], self.slot, .little);
        std.mem.writeInt(u64, bytes[8..16], self.proposer_index, .little);
        @memcpy(bytes[16..48], &self.parent_root);
        @memcpy(bytes[48..80], &self.state_root);
        @memcpy(bytes[80..112], &self.body_root);
        return bytes;
    }

    pub fn sszDeserialize(bytes: []const u8) !BeaconBlockHeader {
        if (bytes.len != 112) {
            return error.InvalidSszLength;
        }

        var parent_root: [32]u8 = undefined;
        var state_root: [32]u8 = undefined;
        var body_root: [32]u8 = undefined;
        @memcpy(&parent_root, bytes[16..48]);
        @memcpy(&state_root, bytes[48..80]);
        @memcpy(&body_root, bytes[80..112]);

        return BeaconBlockHeader.from(
            std.mem.readInt(u64, bytes[0..8], .little),
            std.mem.readInt(u64, bytes[8..16], .little),
            parent_root,
            state_root,
            body_root,
        );
    }
};

pub const SignedBeaconBlockHeader = struct {
    message: BeaconBlockHeader,
    signature: [96]u8,

    pub fn from(message: BeaconBlockHeader, signature: [96]u8) SignedBeaconBlockHeader {
        return .{
            .message = message,
            .signature = signature,
        };
    }

    pub fn equals(self: SignedBeaconBlockHeader, other: SignedBeaconBlockHeader) bool {
        return self.message.equals(other.message) and
            std.mem.eql(u8, &self.signature, &other.signature);
    }
};

fn filled32(value: u8) [32]u8 {
    return @as([32]u8, @splat(value));
}

fn filled96(value: u8) [96]u8 {
    return @as([96]u8, @splat(value));
}

test "BeaconBlockHeader: construction and field access" {
    const header = BeaconBlockHeader.from(
        123,
        7,
        filled32(0x11),
        filled32(0x22),
        filled32(0x33),
    );

    const expected_parent = filled32(0x11);
    const expected_state = filled32(0x22);
    const expected_body = filled32(0x33);

    try std.testing.expectEqual(@as(u64, 123), header.slot);
    try std.testing.expectEqual(@as(u64, 7), header.proposer_index);
    try std.testing.expectEqualSlices(u8, &expected_parent, &header.parent_root);
    try std.testing.expectEqualSlices(u8, &expected_state, &header.state_root);
    try std.testing.expectEqualSlices(u8, &expected_body, &header.body_root);
}

test "BeaconBlockHeader: equals positive and negative cases" {
    const header_a = BeaconBlockHeader.from(
        1,
        2,
        filled32(0x01),
        filled32(0x02),
        filled32(0x03),
    );
    const header_b = BeaconBlockHeader.from(
        1,
        2,
        filled32(0x01),
        filled32(0x02),
        filled32(0x03),
    );
    const header_c = BeaconBlockHeader.from(
        9,
        2,
        filled32(0x01),
        filled32(0x02),
        filled32(0x03),
    );

    try std.testing.expect(header_a.equals(header_b));
    try std.testing.expect(!header_a.equals(header_c));
}

test "BeaconBlockHeader: hashTreeRoot returns consistent value" {
    const header = BeaconBlockHeader.from(
        42,
        99,
        filled32(0xaa),
        filled32(0xbb),
        filled32(0xcc),
    );

    const first = try header.hashTreeRoot(std.testing.allocator);
    const second = try header.hashTreeRoot(std.testing.allocator);
    try std.testing.expectEqualSlices(u8, &first, &second);
}

test "BeaconBlockHeader: hashTreeRoot differs for different headers" {
    const header_a = BeaconBlockHeader.from(
        42,
        99,
        filled32(0xaa),
        filled32(0xbb),
        filled32(0xcc),
    );
    const header_b = BeaconBlockHeader.from(
        43,
        99,
        filled32(0xaa),
        filled32(0xbb),
        filled32(0xcc),
    );

    const root_a = try header_a.hashTreeRoot(std.testing.allocator);
    const root_b = try header_b.hashTreeRoot(std.testing.allocator);
    try std.testing.expect(!std.mem.eql(u8, &root_a, &root_b));
}

test "BeaconBlockHeader: SSZ serialization roundtrip" {
    const header = BeaconBlockHeader.from(
        0x1122334455667788,
        0x8877665544332211,
        filled32(0x10),
        filled32(0x20),
        filled32(0x30),
    );

    const encoded = header.sszSerialize();
    try std.testing.expectEqual(@as(usize, 112), encoded.len);

    const roundtrip = try BeaconBlockHeader.sszDeserialize(&encoded);

    try std.testing.expect(header.equals(roundtrip));
}

test "SignedBeaconBlockHeader: construction" {
    const header = BeaconBlockHeader.from(
        1,
        2,
        filled32(0x01),
        filled32(0x02),
        filled32(0x03),
    );
    const signed = SignedBeaconBlockHeader.from(header, filled96(0xab));
    const expected_signature = filled96(0xab);

    try std.testing.expect(signed.message.equals(header));
    try std.testing.expectEqualSlices(u8, &expected_signature, &signed.signature);
}

test "SignedBeaconBlockHeader: equals positive and negative cases" {
    const header_a = BeaconBlockHeader.from(
        1,
        2,
        filled32(0x01),
        filled32(0x02),
        filled32(0x03),
    );
    const header_b = BeaconBlockHeader.from(
        9,
        2,
        filled32(0x01),
        filled32(0x02),
        filled32(0x03),
    );

    const signed_a = SignedBeaconBlockHeader.from(header_a, filled96(0x11));
    const signed_b = SignedBeaconBlockHeader.from(header_a, filled96(0x11));
    const signed_c = SignedBeaconBlockHeader.from(header_b, filled96(0x11));
    const signed_d = SignedBeaconBlockHeader.from(header_a, filled96(0x22));

    try std.testing.expect(signed_a.equals(signed_b));
    try std.testing.expect(!signed_a.equals(signed_c));
    try std.testing.expect(!signed_a.equals(signed_d));
}
