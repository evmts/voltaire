// Simulate Ethereum log filtering with bloom filters
const std = @import("std");
const primitives = @import("primitives");
const BloomFilter = primitives.bloom_filter.BloomFilter;

const Log = struct {
    address: []const u8,
    topics: []const []const u8,
};

fn buildBlockBloom(allocator: std.mem.Allocator, logs: []const Log) !BloomFilter {
    var filter = try BloomFilter.init(allocator, 2048, 3);

    for (logs) |log| {
        // Add address
        filter.add(log.address);

        // Add each topic
        for (log.topics) |topic| {
            filter.add(topic);
        }
    }

    return filter;
}

fn isBloomEmpty(filter: *const BloomFilter) bool {
    for (filter.bits) |byte| {
        if (byte != 0) return false;
    }
    return true;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("Ethereum Log Filtering with Bloom Filters\n\n", .{});

    // Simulated addresses and topics
    const usdc_address = "USDC";
    const dai_address = "DAI";
    const transfer_topic = "Transfer(address,address,uint256)";
    const approval_topic = "Approval(address,address,uint256)";

    // Block 1000 logs
    const transfer_topics = [_][]const u8{transfer_topic};
    const approval_topics = [_][]const u8{approval_topic};

    const block1000_logs = [_]Log{
        .{ .address = usdc_address, .topics = &transfer_topics },
        .{ .address = dai_address, .topics = &transfer_topics },
    };

    // Block 1001 logs
    const block1001_logs = [_]Log{
        .{ .address = usdc_address, .topics = &approval_topics },
    };

    // Block 1002 logs (empty)
    const block1002_logs = [_]Log{};

    // Build bloom filters for each block
    std.debug.print("Building bloom filters for blocks 1000-1002...\n", .{});
    var block1000_bloom = try buildBlockBloom(allocator, &block1000_logs);
    defer block1000_bloom.deinit(allocator);

    var block1001_bloom = try buildBlockBloom(allocator, &block1001_logs);
    defer block1001_bloom.deinit(allocator);

    var block1002_bloom = try buildBlockBloom(allocator, &block1002_logs);
    defer block1002_bloom.deinit(allocator);

    std.debug.print("  Block 1000: {s}\n", .{if (isBloomEmpty(&block1000_bloom)) "empty" else "has logs"});
    std.debug.print("  Block 1001: {s}\n", .{if (isBloomEmpty(&block1001_bloom)) "empty" else "has logs"});
    std.debug.print("  Block 1002: {s}\n", .{if (isBloomEmpty(&block1002_bloom)) "empty" else "has logs"});

    // Query 1: Find blocks with USDC transfers
    std.debug.print("\nQuery 1: Find blocks with USDC Transfer events\n", .{});
    std.debug.print("Checking bloom filters:\n", .{});

    const target_address = usdc_address;
    const target_topic = transfer_topic;

    var candidate_count: usize = 0;

    if (block1000_bloom.contains(target_address) and block1000_bloom.contains(target_topic)) {
        std.debug.print("  Block 1000: might contain USDC Transfer ✓\n", .{});
        candidate_count += 1;
    }

    if (block1001_bloom.contains(target_address) and block1001_bloom.contains(target_topic)) {
        std.debug.print("  Block 1001: might contain USDC Transfer ✓\n", .{});
        candidate_count += 1;
    }

    if (block1002_bloom.contains(target_address) and block1002_bloom.contains(target_topic)) {
        std.debug.print("  Block 1002: might contain USDC Transfer ✓\n", .{});
        candidate_count += 1;
    }

    std.debug.print("\nNext step: fetch logs only from {d} candidate block(s)\n", .{candidate_count});

    // Query 2: Find blocks with DAI activity
    std.debug.print("\nQuery 2: Find blocks with DAI activity (any event)\n", .{});
    candidate_count = 0;

    if (block1000_bloom.contains(dai_address)) {
        std.debug.print("  Block 1000: might have DAI logs ✓\n", .{});
        candidate_count += 1;
    }

    if (block1001_bloom.contains(dai_address)) {
        std.debug.print("  Block 1001: might have DAI logs ✓\n", .{});
        candidate_count += 1;
    }

    if (block1002_bloom.contains(dai_address)) {
        std.debug.print("  Block 1002: might have DAI logs ✓\n", .{});
        candidate_count += 1;
    }

    if (candidate_count == 0) {
        std.debug.print("  No candidate blocks - DAI definitely not active in range\n", .{});
    }

    // Demonstrate efficiency
    std.debug.print("\nEfficiency demonstration:\n", .{});
    const total_blocks: usize = 3;
    const blocks_skipped = total_blocks - candidate_count;
    std.debug.print("  Total blocks: {d}\n", .{total_blocks});
    std.debug.print("  Blocks with bloom match: {d}\n", .{candidate_count});
    std.debug.print("  Blocks skipped: {d} ({d}% reduction)\n", .{ blocks_skipped, blocks_skipped * 100 / total_blocks });

    // Demonstrate block range filter
    std.debug.print("\nBlock range optimization:\n", .{});
    var range_bloom = try BloomFilter.init(allocator, 2048, 3);
    defer range_bloom.deinit(allocator);

    // Merge all block blooms
    for (block1000_bloom.bits, 0..) |byte, i| {
        range_bloom.bits[i] = byte | block1001_bloom.bits[i] | block1002_bloom.bits[i];
    }

    const weth_address = "WETH";
    if (!range_bloom.contains(weth_address)) {
        std.debug.print("  WETH definitely not in blocks 1000-1002 - skip entire range ✓\n", .{});
    } else {
        std.debug.print("  WETH might be in range - scan individual blocks\n", .{});
    }
}
