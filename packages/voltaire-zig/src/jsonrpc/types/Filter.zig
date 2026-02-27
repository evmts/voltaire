const std = @import("std");
const Address = @import("Address.zig").Address;
const Hash = @import("Hash.zig").Hash;
const Quantity = @import("Quantity.zig").Quantity;

// Import tests
test {
    _ = @import("Filter_test.zig");
}

/// Filter represents the eth_getLogs filter object per execution-apis spec.
/// Supports filtering by block range (fromBlock/toBlock) or by blockHash.
pub const Filter = struct {
    fromBlock: ?Quantity = null,
    toBlock: ?Quantity = null,
    blockHash: ?Hash = null,
    address: ?FilterAddress = null,
    topics: ?FilterTopics = null,

    pub const FilterAddress = union(enum) {
        single: Address,
        array: []const Address,

        pub fn jsonStringify(self: FilterAddress, jws: *std.json.Stringify) !void {
            switch (self) {
                .single => try jws.write(self.single),
                .array => try jws.write(self.array),
            }
        }

        pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !FilterAddress {
            switch (source) {
                .string => {
                    const addr = try std.json.innerParseFromValue(Address, allocator, source, options);
                    return .{ .single = addr };
                },
                .array => {
                    const arr = try std.json.innerParseFromValue([]const Address, allocator, source, options);
                    return .{ .array = arr };
                },
                else => return error.UnexpectedToken,
            }
        }
    };

    pub const FilterTopic = union(enum) {
        single: Hash,
        array: []const Hash,

        pub fn jsonStringify(self: FilterTopic, jws: *std.json.Stringify) !void {
            switch (self) {
                .single => try jws.write(self.single),
                .array => try jws.write(self.array),
            }
        }

        pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !FilterTopic {
            switch (source) {
                .string => {
                    const hash = try std.json.innerParseFromValue(Hash, allocator, source, options);
                    return .{ .single = hash };
                },
                .array => {
                    const arr = try std.json.innerParseFromValue([]const Hash, allocator, source, options);
                    return .{ .array = arr };
                },
                else => return error.UnexpectedToken,
            }
        }
    };

    pub const FilterTopics = []const ?FilterTopic;

    pub fn jsonStringify(self: Filter, jws: *std.json.Stringify) !void {
        try jws.beginObject();

        if (self.fromBlock) |fb| {
            try jws.objectField("fromBlock");
            try jws.write(fb);
        }

        if (self.toBlock) |tb| {
            try jws.objectField("toBlock");
            try jws.write(tb);
        }

        if (self.blockHash) |bh| {
            try jws.objectField("blockHash");
            try jws.write(bh);
        }

        if (self.address) |addr| {
            try jws.objectField("address");
            try jws.write(addr);
        }

        if (self.topics) |topics| {
            try jws.objectField("topics");
            try jws.beginArray();
            for (topics) |maybe_topic| {
                if (maybe_topic) |topic| {
                    try jws.write(topic);
                } else {
                    try jws.write(null);
                }
            }
            try jws.endArray();
        }

        try jws.endObject();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Filter {
        if (source != .object) return error.UnexpectedToken;

        var filter: Filter = .{};

        if (source.object.get("fromBlock")) |fb| {
            filter.fromBlock = try std.json.innerParseFromValue(Quantity, allocator, fb, options);
        }

        if (source.object.get("toBlock")) |tb| {
            filter.toBlock = try std.json.innerParseFromValue(Quantity, allocator, tb, options);
        }

        if (source.object.get("blockHash")) |bh| {
            filter.blockHash = try std.json.innerParseFromValue(Hash, allocator, bh, options);
        }

        if (source.object.get("address")) |addr| {
            if (addr == .null) {
                filter.address = null;
            } else {
                filter.address = try FilterAddress.jsonParseFromValue(allocator, addr, options);
            }
        }

        if (source.object.get("topics")) |topics| {
            if (topics == .null) {
                filter.topics = null;
            } else if (topics == .array) {
                const topics_array = try allocator.alloc(?FilterTopic, topics.array.items.len);
                for (topics.array.items, 0..) |item, i| {
                    if (item == .null) {
                        topics_array[i] = null;
                    } else {
                        topics_array[i] = try FilterTopic.jsonParseFromValue(allocator, item, options);
                    }
                }
                filter.topics = topics_array;
            } else {
                return error.UnexpectedToken;
            }
        }

        return filter;
    }
};
