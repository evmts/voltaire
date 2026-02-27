const std = @import("std");
const Address = @import("Address.zig").Address;
const Hash = @import("Hash.zig").Hash;
const Quantity = @import("Quantity.zig").Quantity;

// Import tests
test {
    _ = @import("LogEntry_test.zig");
}

/// LogEntry represents a log entry returned by eth_getLogs per execution-apis spec.
/// All fields except transactionHash are optional per the spec (for pending logs).
pub const LogEntry = struct {
    removed: bool = false,
    logIndex: ?Quantity = null,
    transactionIndex: ?Quantity = null,
    transactionHash: Hash,
    blockHash: ?Hash = null,
    blockNumber: ?Quantity = null,
    blockTimestamp: ?Quantity = null,
    address: Address,
    data: Quantity,
    topics: []const Hash,

    pub fn jsonStringify(self: LogEntry, jws: *std.json.Stringify) !void {
        try jws.beginObject();

        try jws.objectField("removed");
        try jws.write(self.removed);

        if (self.logIndex) |li| {
            try jws.objectField("logIndex");
            try jws.write(li);
        }

        if (self.transactionIndex) |ti| {
            try jws.objectField("transactionIndex");
            try jws.write(ti);
        }

        try jws.objectField("transactionHash");
        try jws.write(self.transactionHash);

        if (self.blockHash) |bh| {
            try jws.objectField("blockHash");
            try jws.write(bh);
        }

        if (self.blockNumber) |bn| {
            try jws.objectField("blockNumber");
            try jws.write(bn);
        }

        if (self.blockTimestamp) |bt| {
            try jws.objectField("blockTimestamp");
            try jws.write(bt);
        }

        try jws.objectField("address");
        try jws.write(self.address);

        try jws.objectField("data");
        try jws.write(self.data);

        try jws.objectField("topics");
        try jws.write(self.topics);

        try jws.endObject();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !LogEntry {
        if (source != .object) return error.UnexpectedToken;

        var log_entry: LogEntry = undefined;

        // removed is required per spec
        if (source.object.get("removed")) |r| {
            log_entry.removed = try std.json.innerParseFromValue(bool, allocator, r, options);
        } else {
            log_entry.removed = false; // default
        }

        // logIndex is optional
        if (source.object.get("logIndex")) |li| {
            log_entry.logIndex = try std.json.innerParseFromValue(Quantity, allocator, li, options);
        } else {
            log_entry.logIndex = null;
        }

        // transactionIndex is optional
        if (source.object.get("transactionIndex")) |ti| {
            log_entry.transactionIndex = try std.json.innerParseFromValue(Quantity, allocator, ti, options);
        } else {
            log_entry.transactionIndex = null;
        }

        // transactionHash is required
        if (source.object.get("transactionHash")) |th| {
            log_entry.transactionHash = try std.json.innerParseFromValue(Hash, allocator, th, options);
        } else {
            return error.MissingField;
        }

        // blockHash is optional
        if (source.object.get("blockHash")) |bh| {
            log_entry.blockHash = try std.json.innerParseFromValue(Hash, allocator, bh, options);
        } else {
            log_entry.blockHash = null;
        }

        // blockNumber is optional
        if (source.object.get("blockNumber")) |bn| {
            log_entry.blockNumber = try std.json.innerParseFromValue(Quantity, allocator, bn, options);
        } else {
            log_entry.blockNumber = null;
        }

        // blockTimestamp is optional (not in all specs but used in some clients)
        if (source.object.get("blockTimestamp")) |bt| {
            log_entry.blockTimestamp = try std.json.innerParseFromValue(Quantity, allocator, bt, options);
        } else {
            log_entry.blockTimestamp = null;
        }

        // address is required
        if (source.object.get("address")) |addr| {
            log_entry.address = try std.json.innerParseFromValue(Address, allocator, addr, options);
        } else {
            return error.MissingField;
        }

        // data is required
        if (source.object.get("data")) |d| {
            log_entry.data = try std.json.innerParseFromValue(Quantity, allocator, d, options);
        } else {
            return error.MissingField;
        }

        // topics is required (can be empty array)
        if (source.object.get("topics")) |t| {
            log_entry.topics = try std.json.innerParseFromValue([]const Hash, allocator, t, options);
        } else {
            log_entry.topics = &[_]Hash{};
        }

        return log_entry;
    }
};
