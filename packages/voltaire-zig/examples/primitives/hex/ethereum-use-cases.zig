//! Ethereum Use Cases Example
//!
//! Demonstrates real-world Ethereum development patterns:
//! - Working with addresses
//! - Function selectors and calldata encoding
//! - Transaction data manipulation
//! - Storage slots
//!
//! Run with: zig build run-example -- primitives/hex/ethereum-use-cases.zig

const std = @import("std");
const primitives = @import("primitives");
const Hex = primitives.Hex;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Ethereum Use Cases ===\n\n", .{});

    try addressHandling(allocator);
    try functionCalldata(allocator);
    try storageSlots(allocator);
    try signatureHandling(allocator);
    try create2Pattern(allocator);

    std.debug.print("\n=== Example completed ===\n\n", .{});
}

fn addressHandling(allocator: std.mem.Allocator) !void {
    std.debug.print("1. Address handling:\n", .{});

    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";

    // Convert to bytes
    const addr_bytes = try Hex.hexToBytes(allocator, address);
    defer allocator.free(addr_bytes);

    std.debug.print("  Address: {s}\n", .{address});
    std.debug.print("  Size: {} bytes\n", .{addr_bytes.len});

    // Validate size
    if (addr_bytes.len == 20) {
        std.debug.print("  ✓ Valid Ethereum address (20 bytes)\n", .{});
    }

    // Check for zero address
    const zero_address = [_]u8{0} ** 20;
    const is_burn = std.mem.eql(u8, addr_bytes, &zero_address);
    std.debug.print("  Is burn address? {}\n", .{is_burn});

    // Convert to U256 (pad to 32 bytes)
    const addr_u256 = try Hex.padLeft(allocator, addr_bytes, 32);
    defer allocator.free(addr_u256);

    const addr_u256_hex = try Hex.bytesToHex(allocator, addr_u256);
    defer allocator.free(addr_u256_hex);

    std.debug.print("  As U256: {s}\n", .{addr_u256_hex});
    std.debug.print("\n", .{});
}

fn functionCalldata(allocator: std.mem.Allocator) !void {
    std.debug.print("2. Function selectors and calldata:\n", .{});

    // ERC20 transfer(address,uint256) selector
    const selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };

    std.debug.print("  Function: transfer(address,uint256)\n", .{});
    std.debug.print("  Selector: 0x", .{});
    for (selector) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    // Encode arguments
    const recipient = "0x1234567890123456789012345678901234567890";
    const recipient_bytes = try Hex.hexToBytes(allocator, recipient);
    defer allocator.free(recipient_bytes);

    const padded_recipient = try Hex.padLeft(allocator, recipient_bytes, 32);
    defer allocator.free(padded_recipient);

    // Amount: 1 token (18 decimals)
    const amount: u256 = 1_000_000_000_000_000_000;
    const amount_hex = try Hex.u256ToHex(allocator, amount);
    defer allocator.free(amount_hex);

    const amount_bytes = try Hex.hexToBytes(allocator, amount_hex);
    defer allocator.free(amount_bytes);

    const padded_amount = try Hex.padLeft(allocator, amount_bytes, 32);
    defer allocator.free(padded_amount);

    // Concatenate calldata
    const parts = [_][]const u8{ &selector, padded_recipient, padded_amount };
    const calldata = try Hex.concat(allocator, &parts);
    defer allocator.free(calldata);

    std.debug.print("  Recipient: {s}\n", .{recipient});
    std.debug.print("  Amount: {}\n", .{amount});
    std.debug.print("  Calldata size: {} bytes\n", .{calldata.len});

    // Decode calldata
    const decoded_selector = Hex.slice(calldata, 0, 4);
    std.debug.print("  Decoded selector: 0x", .{});
    for (decoded_selector) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    const decoded_recipient_slice = Hex.slice(calldata, 4, 36);
    const decoded_recipient = Hex.trimLeftZeros(decoded_recipient_slice);
    std.debug.print("  Decoded recipient: {} bytes\n", .{decoded_recipient.len});

    std.debug.print("\n", .{});
}

fn storageSlots(allocator: std.mem.Allocator) !void {
    std.debug.print("3. Storage slots:\n", .{});

    // Storage slots are 32 bytes
    const slot_0: u256 = 0;
    const slot_1: u256 = 1;
    const slot_2: u256 = 2;

    const slot_0_hex = try Hex.u256ToHex(allocator, slot_0);
    defer allocator.free(slot_0_hex);
    const slot_0_bytes = try Hex.hexToBytes(allocator, slot_0_hex);
    defer allocator.free(slot_0_bytes);
    const slot_0_padded = try Hex.padLeft(allocator, slot_0_bytes, 32);
    defer allocator.free(slot_0_padded);

    std.debug.print("  Slot 0 size: {} bytes\n", .{slot_0_padded.len});
    std.debug.print("  Slot 1 value: {}\n", .{slot_1});
    std.debug.print("  Slot 2 value: {}\n", .{slot_2});

    // Mapping slot calculation pattern
    const mapping_slot: u256 = 0;
    const key_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";

    std.debug.print("  Mapping key: {s}\n", .{key_address});
    std.debug.print("  Mapping slot: {}\n", .{mapping_slot});

    // In practice, you'd hash: keccak256(key . slot)
    const key_bytes = try Hex.hexToBytes(allocator, key_address);
    defer allocator.free(key_bytes);
    const key_padded = try Hex.padLeft(allocator, key_bytes, 32);
    defer allocator.free(key_padded);

    const slot_bytes_hex = try Hex.u256ToHex(allocator, mapping_slot);
    defer allocator.free(slot_bytes_hex);
    const slot_bytes = try Hex.hexToBytes(allocator, slot_bytes_hex);
    defer allocator.free(slot_bytes);
    const slot_padded = try Hex.padLeft(allocator, slot_bytes, 32);
    defer allocator.free(slot_padded);

    const hash_input_parts = [_][]const u8{ key_padded, slot_padded };
    const hash_input = try Hex.concat(allocator, &hash_input_parts);
    defer allocator.free(hash_input);

    std.debug.print("  Hash input size: {} bytes\n", .{hash_input.len});

    std.debug.print("\n", .{});
}

fn signatureHandling(allocator: std.mem.Allocator) !void {
    std.debug.print("4. Signature handling:\n", .{});

    // ECDSA signature: r (32) + s (32) + v (1) = 65 bytes
    const r = [_]u8{0xff} ** 32; // Mock r value
    const s = [_]u8{0xee} ** 32; // Mock s value
    const v = [_]u8{27}; // v = 27 or 28

    const sig_parts = [_][]const u8{ &r, &s, &v };
    const signature = try Hex.concat(allocator, &sig_parts);
    defer allocator.free(signature);

    std.debug.print("  Signature size: {} bytes\n", .{signature.len});

    // Extract components
    const extracted_r = Hex.slice(signature, 0, 32);
    const extracted_s = Hex.slice(signature, 32, 64);
    const extracted_v = Hex.slice(signature, 64, 65);

    std.debug.print("  r size: {} bytes\n", .{extracted_r.len});
    std.debug.print("  s size: {} bytes\n", .{extracted_s.len});
    std.debug.print("  v size: {} bytes\n", .{extracted_v.len});
    std.debug.print("  v value: {}\n", .{extracted_v[0]});

    // Compact signature (64 bytes)
    const compact_parts = [_][]const u8{ &r, &s };
    const compact = try Hex.concat(allocator, &compact_parts);
    defer allocator.free(compact);

    std.debug.print("  Compact signature size: {} bytes\n", .{compact.len});

    std.debug.print("\n", .{});
}

fn create2Pattern(allocator: std.mem.Allocator) !void {
    std.debug.print("5. CREATE2 address calculation pattern:\n", .{});

    // CREATE2 input: 0xff + deployer + salt + bytecode_hash
    const prefix = [_]u8{0xff};
    const deployer = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
    const deployer_bytes = try Hex.hexToBytes(allocator, deployer);
    defer allocator.free(deployer_bytes);

    // Salt (32 bytes)
    const salt = [_]u8{0xab} ** 32;

    // Bytecode hash (32 bytes)
    const bytecode_hash = [_]u8{0xcd} ** 32;

    // Concatenate all parts
    const create2_parts = [_][]const u8{ &prefix, deployer_bytes, &salt, &bytecode_hash };
    const create2_input = try Hex.concat(allocator, &create2_parts);
    defer allocator.free(create2_input);

    std.debug.print("  Deployer: {s}\n", .{deployer});
    std.debug.print("  Salt size: {} bytes\n", .{salt.len});
    std.debug.print("  Bytecode hash size: {} bytes\n", .{bytecode_hash.len});
    std.debug.print("  Total input size: {} bytes (expected: 85)\n", .{create2_input.len});

    // The address is last 20 bytes of keccak256(create2_input)
    std.debug.print("  Note: Address = last 20 bytes of keccak256(input)\n", .{});

    std.debug.print("\n", .{});
}
