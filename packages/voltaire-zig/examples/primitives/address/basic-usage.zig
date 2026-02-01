const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.address.Address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== Basic Address Usage ===\n\n", .{});

    // 1. Creating addresses from different inputs
    std.debug.print("1. Creating Addresses\n\n", .{});

    // From hex string (most common)
    const addr1 = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    const checksum1 = Address.toChecksummed(addr1);
    std.debug.print("From hex: {s}\n", .{&checksum1});

    // From number (takes lower 160 bits)
    const addr2 = Address.fromU256(69);
    const hex2 = Address.toHex(addr2);
    std.debug.print("From number: {s}\n", .{&hex2});

    // From bytes
    var bytes: [20]u8 = [_]u8{0} ** 20;
    bytes[19] = 42; // Last byte = 42
    const addr3 = Address.fromBytes(&bytes);
    const hex3 = Address.toHex(addr3);
    std.debug.print("From bytes: {s}\n", .{&hex3});

    // Zero address
    const zero_addr = Address.zero();
    const hex_zero = Address.toHex(zero_addr);
    std.debug.print("Zero address: {s}\n\n", .{&hex_zero});

    // 2. Format conversions
    std.debug.print("2. Format Conversions\n\n", .{});

    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    // Various hex formats
    const lowercase = Address.toHex(addr);
    const checksummed = Address.toChecksummed(addr);
    const uppercase = Address.toUppercase(addr);

    std.debug.print("Lowercase:   {s}\n", .{&lowercase});
    std.debug.print("Checksummed: {s}\n", .{&checksummed}); // EIP-55 mixed case
    std.debug.print("Uppercase:   {s}\n\n", .{&uppercase});

    // 3. Validation
    std.debug.print("3. Validation\n\n", .{});

    const valid_addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
    const invalid_addr = "0x742d35Cc"; // Too short
    const wrong_checksum = "0x742d35cc6634c0532925a3b844bc9e7595f51e3e"; // All lowercase

    std.debug.print("Valid format ({s}): {}\n", .{ valid_addr, Address.isValid(valid_addr) });
    std.debug.print("Invalid format ({s}): {}\n", .{ invalid_addr, Address.isValid(invalid_addr) });
    std.debug.print("Valid checksum (checksummed): {}\n", .{Address.isValidChecksum(valid_addr)});
    std.debug.print("Valid checksum (lowercase): {}\n\n", .{Address.isValidChecksum(wrong_checksum)}); // true - all same case

    // 4. Type checks (Zig compile-time type safety)
    std.debug.print("4. Type Safety\n\n", .{});

    // In Zig, types are checked at compile time
    // Address is a distinct type ([20]u8)
    const typed_addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    const typed_hex = Address.toHex(typed_addr);
    std.debug.print("Address type: {s}\n", .{&typed_hex});

    // Wrong length would cause compile error
    // var wrong_len: [32]u8 = undefined; // Different type
    // _ = Address.fromBytes(&wrong_len); // Compile error!

    std.debug.print("(Zig provides compile-time type safety)\n\n", .{});

    // 5. Comparisons
    std.debug.print("5. Basic Comparisons\n\n", .{});

    const addr_a = Address.fromU256(100);
    const addr_b = Address.fromU256(100);
    const addr_c = Address.fromU256(200);

    const hex_a = Address.toHex(addr_a);
    const hex_b = Address.toHex(addr_b);
    const hex_c = Address.toHex(addr_c);

    std.debug.print("Address A: {s}\n", .{&hex_a});
    std.debug.print("Address B: {s}\n", .{&hex_b});
    std.debug.print("Address C: {s}\n", .{&hex_c});
    std.debug.print("A equals B: {}\n", .{Address.equals(addr_a, addr_b)}); // true
    std.debug.print("A equals C: {}\n", .{Address.equals(addr_a, addr_c)}); // false
    std.debug.print("Zero check: {}\n", .{Address.isZero(zero_addr)}); // true
    std.debug.print("A is zero: {}\n", .{Address.isZero(addr_a)}); // false
}
