// Real-world example: Event indexing system using bloom filters
const std = @import("std");
const primitives = @import("primitives");
const BloomFilter = primitives.bloom_filter.BloomFilter;

const EventType = enum {
    Transfer,
    Approval,
    Swap,
    Mint,
    Burn,
    Sync,
};

const Event = struct {
    event_type: EventType,
    address: []const u8,
    block_number: u64,
};

const EventIndex = struct {
    filters: std.EnumMap(EventType, BloomFilter),
    allocator: std.mem.Allocator,

    fn init(allocator: std.mem.Allocator) !EventIndex {
        var filters = std.EnumMap(EventType, BloomFilter){};

        // Initialize filters for each event type
        inline for (std.meta.fields(EventType)) |field| {
            const event_type = @field(EventType, field.name);
            const filter = try BloomFilter.init(allocator, 2048, 3);
            filters.put(event_type, filter);
        }

        return .{
            .filters = filters,
            .allocator = allocator,
        };
    }

    fn deinit(self: *EventIndex) void {
        var iter = self.filters.iterator();
        while (iter.next()) |entry| {
            var filter = entry.value.*;
            filter.deinit(self.allocator);
        }
    }

    fn addEvent(self: *EventIndex, event: Event) void {
        if (self.filters.getPtr(event.event_type)) |filter| {
            filter.add(event.address);
        }
    }

    fn mightContainAddress(self: *const EventIndex, event_type: EventType, address: []const u8) bool {
        if (self.filters.get(event_type)) |filter| {
            return filter.contains(address);
        }
        return false;
    }

    fn getFilterDensity(self: *const EventIndex, event_type: EventType) f64 {
        if (self.filters.get(event_type)) |filter| {
            var set_bits: usize = 0;
            for (filter.bits) |byte| {
                var b = byte;
                var bit: u3 = 0;
                while (bit < 8) : (bit += 1) {
                    if (b & (@as(u8, 1) << bit) != 0) {
                        set_bits += 1;
                    }
                }
            }
            return @as(f64, @floatFromInt(set_bits)) / @as(f64, @floatFromInt(filter.m)) * 100.0;
        }
        return 0.0;
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("Event Indexing System with Bloom Filters\n\n", .{});

    // Simulate events
    const events = [_]Event{
        .{ .event_type = .Transfer, .address = "USDC", .block_number = 1000 },
        .{ .event_type = .Transfer, .address = "DAI", .block_number = 1001 },
        .{ .event_type = .Approval, .address = "USDC", .block_number = 1002 },
        .{ .event_type = .Swap, .address = "UniswapV2", .block_number = 1003 },
        .{ .event_type = .Swap, .address = "UniswapV3", .block_number = 1004 },
        .{ .event_type = .Mint, .address = "UniswapV2", .block_number = 1005 },
        .{ .event_type = .Burn, .address = "UniswapV2", .block_number = 1006 },
        .{ .event_type = .Transfer, .address = "WETH", .block_number = 1007 },
        .{ .event_type = .Swap, .address = "SushiSwap", .block_number = 1008 },
        .{ .event_type = .Transfer, .address = "USDT", .block_number = 1009 },
    };

    // Build index
    std.debug.print("Building event index...\n", .{});
    var index = try EventIndex.init(allocator);
    defer index.deinit();

    for (events) |event| {
        index.addEvent(event);
    }

    std.debug.print("Indexed {d} events\n\n", .{events.len});

    // Query the index
    std.debug.print("Query 1: Find Transfer events for USDC\n", .{});
    if (index.mightContainAddress(.Transfer, "USDC")) {
        std.debug.print("  ✓ USDC might have Transfer events\n", .{});
        std.debug.print("  Action: Scan Transfer events for USDC\n", .{});
    } else {
        std.debug.print("  ✗ USDC definitely has no Transfer events\n", .{});
    }

    std.debug.print("\nQuery 2: Find Swap events for USDC\n", .{});
    if (index.mightContainAddress(.Swap, "USDC")) {
        std.debug.print("  ✓ USDC might have Swap events (likely false positive)\n", .{});
        std.debug.print("  Action: Scan Swap events for USDC\n", .{});
    } else {
        std.debug.print("  ✗ USDC definitely has no Swap events\n", .{});
    }

    std.debug.print("\nQuery 3: Find all event types for UniswapV2\n", .{});
    std.debug.print("  UniswapV2 might appear in:\n", .{});
    inline for (std.meta.fields(EventType)) |field| {
        const event_type = @field(EventType, field.name);
        if (index.mightContainAddress(event_type, "UniswapV2")) {
            std.debug.print("    - {s} events\n", .{field.name});
        }
    }

    std.debug.print("\nQuery 4: Find Transfer events for addresses\n", .{});
    const addresses = [_][]const u8{ "USDC", "DAI", "WETH", "LINK" };
    std.debug.print("  Addresses with Transfer events:\n", .{});
    for (addresses) |addr| {
        if (index.mightContainAddress(.Transfer, addr)) {
            std.debug.print("    - {s} ✓\n", .{addr});
        }
    }

    // Show filter statistics
    std.debug.print("\nFilter statistics:\n", .{});
    inline for (std.meta.fields(EventType)) |field| {
        const event_type = @field(EventType, field.name);
        const density = index.getFilterDensity(event_type);
        std.debug.print("  {s}: {d:.2}% density\n", .{ field.name, density });
    }

    // Efficiency analysis
    std.debug.print("\nEfficiency analysis:\n", .{});
    std.debug.print("  Total events indexed: {d}\n", .{events.len});

    var transfer_count: usize = 0;
    var swap_count: usize = 0;
    for (events) |event| {
        if (event.event_type == .Transfer) transfer_count += 1;
        if (event.event_type == .Swap) swap_count += 1;
    }

    std.debug.print("  Transfer events: {d}\n", .{transfer_count});
    std.debug.print("  Swap events: {d}\n", .{swap_count});
    std.debug.print("\nBloom filter benefits:\n", .{});
    std.debug.print("  - Constant O(1) lookup time per event type\n", .{});
    std.debug.print("  - Fixed memory: 256 bytes per event type\n", .{});
    std.debug.print("  - Quick rejection of non-matching addresses\n", .{});
    std.debug.print("  - Enable efficient multi-criteria filtering\n", .{});
}
