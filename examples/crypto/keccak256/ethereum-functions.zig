const std = @import("std");
const crypto = @import("crypto");

/// Ethereum Function Selectors and Event Topics
///
/// Demonstrates Keccak256's role in Ethereum's ABI:
/// - Function selectors (first 4 bytes of signature hash)
/// - Event topics (full 32-byte signature hash)
/// - Common ERC-20 and ERC-721 examples
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Ethereum Function Selectors & Event Topics ===\n\n", .{});

    // 1. ERC-20 Function Selectors
    try stdout.print("1. ERC-20 Function Selectors\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const erc20_functions = [_][]const u8{
        "totalSupply()",
        "balanceOf(address)",
        "transfer(address,uint256)",
        "transferFrom(address,address,uint256)",
        "approve(address,uint256)",
        "allowance(address,address)",
    };

    for (erc20_functions) |sig| {
        var hash: [32]u8 = undefined;
        try crypto.keccak_asm.keccak256(sig, &hash);

        try stdout.print("{s:<40} 0x", .{sig});
        for (hash[0..4]) |byte| {
            try stdout.print("{x:0>2}", .{byte});
        }
        try stdout.print("\n", .{});
    }
    try stdout.print("\n", .{});

    // 2. ERC-20 Event Topics
    try stdout.print("2. ERC-20 Event Topics\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const erc20_events = [_][]const u8{
        "Transfer(address,address,uint256)",
        "Approval(address,address,uint256)",
    };

    for (erc20_events) |sig| {
        var hash: [32]u8 = undefined;
        try crypto.keccak_asm.keccak256(sig, &hash);

        try stdout.print("{s}\n", .{sig});
        try stdout.print("  0x", .{});
        for (hash) |byte| {
            try stdout.print("{x:0>2}", .{byte});
        }
        try stdout.print("\n\n", .{});
    }

    // 3. ERC-721 Function Selectors
    try stdout.print("3. ERC-721 Function Selectors\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const erc721_functions = [_][]const u8{
        "ownerOf(uint256)",
        "safeTransferFrom(address,address,uint256)",
        "safeTransferFrom(address,address,uint256,bytes)",
        "setApprovalForAll(address,bool)",
        "getApproved(uint256)",
        "isApprovedForAll(address,address)",
    };

    for (erc721_functions) |sig| {
        var hash: [32]u8 = undefined;
        try crypto.keccak_asm.keccak256(sig, &hash);

        try stdout.print("{s:<50} 0x", .{sig});
        for (hash[0..4]) |byte| {
            try stdout.print("{x:0>2}", .{byte});
        }
        try stdout.print("\n", .{});
    }
    try stdout.print("\n", .{});

    // 4. ERC-721 Event Topics
    try stdout.print("4. ERC-721 Event Topics\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const erc721_events = [_][]const u8{
        "Transfer(address,address,uint256)",
        "Approval(address,address,uint256)",
        "ApprovalForAll(address,address,bool)",
    };

    for (erc721_events) |sig| {
        var hash: [32]u8 = undefined;
        try crypto.keccak_asm.keccak256(sig, &hash);

        try stdout.print("{s}\n", .{sig});
        try stdout.print("  0x", .{});
        for (hash) |byte| {
            try stdout.print("{x:0>2}", .{byte});
        }
        try stdout.print("\n\n", .{});
    }

    // 5. Constructing Transaction Calldata
    try stdout.print("5. Constructing Transaction Calldata\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Example: ERC-20 transfer(address,uint256)\n\n", .{});

    const transfer_sig = "transfer(address,uint256)";
    var transfer_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(transfer_sig, &transfer_hash);

    try stdout.print("Function signature: {s}\n", .{transfer_sig});
    try stdout.print("Selector (4 bytes): 0x", .{});
    for (transfer_hash[0..4]) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n\nCalldata structure:\n", .{});
    try stdout.print("  [0:4]   Function selector\n", .{});
    try stdout.print("  [4:36]  Recipient address (padded to 32 bytes)\n", .{});
    try stdout.print("  [36:68] Amount (uint256)\n", .{});
    try stdout.print("\nExample calldata:\n", .{});
    try stdout.print("  0x", .{});
    for (transfer_hash[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n  000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e\n", .{});
    try stdout.print("  0000000000000000000000000000000000000000000000000de0b6b3a7640000\n\n", .{});

    // 6. Parsing Event Logs
    try stdout.print("6. Parsing Event Logs\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Event logs contain topics[0] = event signature hash\n\n", .{});

    const transfer_event_sig = "Transfer(address,address,uint256)";
    var transfer_topic: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(transfer_event_sig, &transfer_topic);

    try stdout.print("Event signature: {s}\n", .{transfer_event_sig});
    try stdout.print("Topic hash:      0x", .{});
    for (transfer_topic) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\nLog structure:\n", .{});
    try stdout.print("  topics[0] = event signature hash (Transfer)\n", .{});
    try stdout.print("  topics[1] = indexed parameter 1 (from address)\n", .{});
    try stdout.print("  topics[2] = indexed parameter 2 (to address)\n", .{});
    try stdout.print("  data      = non-indexed parameters (amount)\n\n", .{});

    // 7. Custom Contract Examples
    try stdout.print("7. Custom Contract Examples\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const custom_functions = [_][]const u8{
        "mint(address,uint256)",
        "burn(uint256)",
        "pause()",
        "unpause()",
        "setBaseURI(string)",
        "withdraw()",
    };

    try stdout.print("Custom contract function selectors:\n\n", .{});
    for (custom_functions) |sig| {
        var hash: [32]u8 = undefined;
        try crypto.keccak_asm.keccak256(sig, &hash);

        try stdout.print("{s:<30} 0x", .{sig});
        for (hash[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("\n", .{});
    }
    try stdout.print("\n", .{});

    // 8. Verifying Known Selectors
    try stdout.print("8. Verifying Known Selectors\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Well-known selector for ERC-20 transfer
    const known_selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    var computed_selector: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256("transfer(address,uint256)", &computed_selector);

    try stdout.print("Known selector:    0x", .{});
    for (known_selector) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nComputed selector: 0x", .{});
    for (computed_selector[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});

    const selector_match = std.mem.eql(u8, &known_selector, computed_selector[0..4]);
    try stdout.print("\nMatch: {}\n\n", .{selector_match});

    // Well-known topic for Transfer event
    const known_topic = [_]u8{
        0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b,
        0x69, 0xc2, 0xb0, 0x68, 0xfc, 0x37, 0x8d, 0xaa,
        0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
        0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
    };
    var computed_topic: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256("Transfer(address,address,uint256)", &computed_topic);

    try stdout.print("Known topic:    0x", .{});
    for (known_topic) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nComputed topic: 0x", .{});
    for (computed_topic) |byte| try stdout.print("{x:0>2}", .{byte});

    const topic_match = std.mem.eql(u8, &known_topic, &computed_topic);
    try stdout.print("\nMatch: {}\n\n", .{topic_match});

    try stdout.print("=== Complete ===\n", .{});
}
