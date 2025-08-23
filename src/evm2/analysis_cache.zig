const std = @import("std");

/// Factory that creates an LRU cache for a specific Analyzer type.
/// Analyzer must expose: Plan, init([]const u8) Analyzer, run(allocator) !Plan
pub fn createAnalyzerCache(comptime Analyzer: type) type {
    const Plan = Analyzer.Plan;

    const Node = struct {
        key_hash: u64,
        key_len: usize,
        plan: Plan,
        qnode: std.TailQueue(void).Node, // node-only; we don't store per-node data here
    };

    return struct {
        const Self = @This();

        allocator: std.mem.Allocator,
        capacity: usize,
        map: std.AutoHashMap(u64, *Node),
        list: std.TailQueue(void),
        count: usize,

        pub fn init(allocator: std.mem.Allocator, capacity: usize) !Self {
            return .{
                .allocator = allocator,
                .capacity = capacity,
                .map = std.AutoHashMap(u64, *Node).init(allocator),
                .list = .{},
                .count = 0,
            };
        }

        pub fn deinit(self: *Self) void {
            var it = self.list.first;
            while (it) |n_ptr| {
                const n: *Node = @fieldParentPtr(Node, n_ptr);
                const next = n_ptr.next;
                n.plan.deinit(self.allocator);
                self.allocator.destroy(n);
                it = next;
            }
            self.map.deinit();
            self.* = undefined;
        }

        pub fn getOrAnalyze(self: *Self, bytecode: []const u8) !*const Plan {
            const key = hashKey(bytecode);
            if (self.map.get(key)) |node_ptr| {
                self.touch(node_ptr);
                return &node_ptr.plan;
            }

            // Miss: analyze
            var analyzer = Analyzer.init(bytecode);
            const plan = try analyzer.run(self.allocator);

            // Evict if necessary
            if (self.count >= self.capacity) {
                if (self.list.last) |last| {
                    const victim: *Node = @fieldParentPtr(Node, last);
                    _ = self.map.remove(victim.key_hash);
                    self.list.remove(last);
                    victim.plan.deinit(self.allocator);
                    self.allocator.destroy(victim);
                    self.count -= 1;
                }
            }

            // Insert new node at front
            var node = try self.allocator.create(Node);
            node.* = .{ .key_hash = key, .key_len = bytecode.len, .plan = plan, .qnode = .{} };
            self.list.prepend(&node.qnode);
            try self.map.put(key, node);
            self.count += 1;
            return &node.plan;
        }

        fn touch(self: *Self, node: *Node) void {
            // move to front if not already
            if (self.list.first) |f| if (f == &node.qnode) return;
            self.list.remove(&node.qnode);
            self.list.prepend(&node.qnode);
        }

        fn hashKey(bytes: []const u8) u64 {
            return std.hash.Wyhash.hash(0, bytes);
        }
    };
}

test "analysis cache stores and reuses plan" {
    const allocator = std.testing.allocator;
    const Analyzer = @import("analysis.zig").createAnalyzer(.{ .vector_length = null });
    const Cache = createAnalyzerCache(Analyzer);

    var cache = try Cache.init(allocator, 2);
    defer cache.deinit();

    const bc1 = [_]u8{ @intFromEnum(@import("opcode_data.zig").Opcode.PUSH1), 0x01, @intFromEnum(@import("opcode_data.zig").Opcode.STOP) };
    const p1a = try cache.getOrAnalyze(&bc1);
    const p1b = try cache.getOrAnalyze(&bc1);
    try std.testing.expectEqual(@intFromPtr(p1a), @intFromPtr(p1b));
}
