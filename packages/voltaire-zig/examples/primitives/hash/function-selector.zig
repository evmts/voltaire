const std = @import("std");
const primitives = @import("primitives");

/// Function Selector Example
///
/// Demonstrates:
/// - Computing 4-byte function selectors
/// - Building calldata with selectors
/// - Decoding function calls
/// - Common Ethereum function selectors
const Hash = primitives.hash.Hash;

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("\n=== Function Selector Example ===\n\n", .{});

    // ============================================================
    // Computing Function Selectors
    // ============================================================

    try stdout.print("--- Computing Function Selectors ---\n\n", .{});

    // Function selector = first 4 bytes of keccak256(signature)

    // ERC-20 Functions
    const transfer = Hash.keccak256String("transfer(address,uint256)");
    const approve = Hash.keccak256String("approve(address,uint256)");
    const transfer_from = Hash.keccak256String("transferFrom(address,address,uint256)");
    const balance_of = Hash.keccak256String("balanceOf(address)");
    const allowance = Hash.keccak256String("allowance(address,address)");

    try stdout.print("ERC-20 Function Selectors:\n", .{});
    try stdout.print("  transfer(address,uint256): 0x", .{});
    for (transfer[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  approve(address,uint256): 0x", .{});
    for (approve[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  transferFrom(address,address,uint256): 0x", .{});
    for (transfer_from[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  balanceOf(address): 0x", .{});
    for (balance_of[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  allowance(address,address): 0x", .{});
    for (allowance[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    // ============================================================
    // Common Ethereum Function Selectors
    // ============================================================

    try stdout.print("\n--- Common Ethereum Functions ---\n\n", .{});

    // ERC-721 Functions
    const safe_transfer_from = Hash.keccak256String("safeTransferFrom(address,address,uint256)");
    const safe_transfer_from_data = Hash.keccak256String("safeTransferFrom(address,address,uint256,bytes)");
    const owner_of = Hash.keccak256String("ownerOf(uint256)");
    const set_approval_for_all = Hash.keccak256String("setApprovalForAll(address,bool)");

    try stdout.print("ERC-721 Function Selectors:\n", .{});
    try stdout.print("  safeTransferFrom(address,address,uint256): 0x", .{});
    for (safe_transfer_from[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  safeTransferFrom(address,address,uint256,bytes): 0x", .{});
    for (safe_transfer_from_data[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  ownerOf(uint256): 0x", .{});
    for (owner_of[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  setApprovalForAll(address,bool): 0x", .{});
    for (set_approval_for_all[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    // ERC-1155 Functions
    const safe_transfer_from_1155 = Hash.keccak256String("safeTransferFrom(address,address,uint256,uint256,bytes)");
    const safe_batch_transfer_from = Hash.keccak256String("safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)");
    const balance_of_batch = Hash.keccak256String("balanceOfBatch(address[],uint256[])");

    try stdout.print("\nERC-1155 Function Selectors:\n", .{});
    try stdout.print("  safeTransferFrom(...): 0x", .{});
    for (safe_transfer_from_1155[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  safeBatchTransferFrom(...): 0x", .{});
    for (safe_batch_transfer_from[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  balanceOfBatch(...): 0x", .{});
    for (balance_of_batch[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    // ============================================================
    // Extracting Selector from Calldata
    // ============================================================

    try stdout.print("\n--- Extracting Selector from Calldata ---\n\n", .{});

    // Calldata structure: [4-byte selector][parameters...]
    const sample_calldata = [_]u8{
        0xa9, 0x05, 0x9c, 0xbb, // transfer selector
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // address param (first 8 bytes)
        // ... more bytes
    };

    const selector = sample_calldata[0..4];
    try stdout.print("Calldata selector: 0x", .{});
    for (selector) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    // Identify function
    const is_transfer = std.mem.eql(u8, selector, transfer[0..4]);
    const is_approve = std.mem.eql(u8, selector, approve[0..4]);

    if (is_transfer) {
        try stdout.print("Identified: transfer(address,uint256)\n", .{});
    } else if (is_approve) {
        try stdout.print("Identified: approve(address,uint256)\n", .{});
    } else {
        try stdout.print("Unknown function\n", .{});
    }

    // ============================================================
    // Function Signature to Selector
    // ============================================================

    try stdout.print("\n--- Function Signature to Selector ---\n\n", .{});

    const Selector = struct {
        signature: []const u8,
        bytes: [4]u8,

        fn from(signature: []const u8) @This() {
            const hash = Hash.keccak256String(signature);
            var bytes: [4]u8 = undefined;
            @memcpy(&bytes, hash[0..4]);
            return .{
                .signature = signature,
                .bytes = bytes,
            };
        }

        fn print(self: @This(), writer: anytype) !void {
            try writer.print("{s}: 0x", .{self.signature});
            for (self.bytes) |byte| try writer.print("{x:0>2}", .{byte});
            try writer.print("\n", .{});
        }
    };

    const selectors = [_]Selector{
        Selector.from("transfer(address,uint256)"),
        Selector.from("approve(address,uint256)"),
        Selector.from("mint(address,uint256)"),
        Selector.from("burn(uint256)"),
    };

    try stdout.print("Function selectors:\n", .{});
    for (selectors) |sel| {
        try stdout.print("  ", .{});
        try sel.print(stdout);
    }

    // ============================================================
    // Selector Matching
    // ============================================================

    try stdout.print("\n--- Selector Matching ---\n\n", .{});

    const matchesSelector = struct {
        fn call(calldata: []const u8, expected: [4]u8) bool {
            if (calldata.len < 4) return false;
            return std.mem.eql(u8, calldata[0..4], &expected);
        }
    }.call;

    const test_calldata = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb, 0x00, 0x00 }; // transfer + padding

    for (selectors) |sel| {
        if (matchesSelector(&test_calldata, sel.bytes)) {
            try stdout.print("Matched: {s}\n", .{sel.signature});
        }
    }

    // ============================================================
    // Known Selectors
    // ============================================================

    try stdout.print("\n--- Known Selectors ---\n\n", .{});

    const KnownSelector = struct {
        selector: [4]u8,
        signature: []const u8,
    };

    const known = [_]KnownSelector{
        .{ .selector = .{ 0xa9, 0x05, 0x9c, 0xbb }, .signature = "transfer(address,uint256)" },
        .{ .selector = .{ 0x09, 0x5e, 0xa7, 0xb3 }, .signature = "approve(address,uint256)" },
        .{ .selector = .{ 0x70, 0xa0, 0x82, 0x31 }, .signature = "balanceOf(address)" },
        .{ .selector = .{ 0x23, 0xb8, 0x72, 0xdd }, .signature = "transferFrom(address,address,uint256)" },
    };

    try stdout.print("Known function selectors:\n", .{});
    for (known) |k| {
        try stdout.print("  0x", .{});
        for (k.selector) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print(" → {s}\n", .{k.signature});
    }

    // Verify against computed
    try stdout.print("\nVerifying known selectors:\n", .{});
    for (known) |k| {
        const computed = Hash.keccak256String(k.signature);
        const matches = std.mem.eql(u8, &k.selector, computed[0..4]);
        try stdout.print("  {s}: {s}\n", .{ k.signature, if (matches) "PASS" else "FAIL" });
    }

    // ============================================================
    // Building Calldata
    // ============================================================

    try stdout.print("\n--- Building Calldata ---\n\n", .{});

    // Calldata = selector + ABI-encoded parameters
    // Example: transfer(address to, uint256 amount)

    var calldata: [68]u8 = undefined; // 4 bytes selector + 32 bytes address + 32 bytes amount

    // Selector
    @memcpy(calldata[0..4], transfer[0..4]);

    // Address parameter (padded to 32 bytes)
    @memset(calldata[4..36], 0);
    // Example address bytes would go in calldata[16..36]

    // Amount parameter (32 bytes)
    @memset(calldata[36..68], 0);
    calldata[64] = 0x00;
    calldata[65] = 0x0f;
    calldata[66] = 0x42;
    calldata[67] = 0x40; // 1000000 in hex

    try stdout.print("Transfer calldata (first 20 bytes): 0x", .{});
    for (calldata[0..20]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n", .{});

    try stdout.print("  Selector (bytes 0-3): 0x", .{});
    for (calldata[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  Address (bytes 4-35): padded address\n", .{});
    try stdout.print("  Amount (bytes 36-67): amount value\n", .{});

    // ============================================================
    // Signature Normalization
    // ============================================================

    try stdout.print("\n--- Signature Normalization ---\n\n", .{});

    // Whitespace doesn't matter for signature
    const sig1 = "transfer(address,uint256)";
    const sig2 = "transfer( address , uint256 )";

    const sel1 = Hash.keccak256String(sig1);
    const sel2 = Hash.keccak256String(sig2);

    // They should NOT match because whitespace is included in hash
    const same = std.mem.eql(u8, sel1[0..4], sel2[0..4]);

    try stdout.print("Signature normalization:\n", .{});
    try stdout.print("  '{s}' selector: 0x", .{sig1});
    for (sel1[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  '{s}' selector: 0x", .{sig2});
    for (sel2[0..4]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    if (same) {
        try stdout.print("  Selectors match (unexpected)\n", .{});
    } else {
        try stdout.print("  Selectors differ (whitespace matters!)\n", .{});
    }

    // ============================================================
    // Collision Detection
    // ============================================================

    try stdout.print("\n--- Selector Collision ---\n\n", .{});

    try stdout.print("Function selector collisions:\n", .{});
    try stdout.print("  - 4 bytes = 2^32 = ~4.3 billion possibilities\n", .{});
    try stdout.print("  - Collisions possible but extremely rare\n", .{});
    try stdout.print("  - Always verify full signature when important\n", .{});

    try stdout.print("\n=== Example Complete ===\n\n", .{});
}
