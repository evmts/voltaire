const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.address.Address;

pub fn main() !void {
    std.debug.print("\n=== EIP-55 Checksum Validation ===\n\n", .{});

    // 1. Understanding EIP-55 checksums
    std.debug.print("1. EIP-55 Checksumming\n\n", .{});

    const addr = try Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e");

    std.debug.print("EIP-55 uses mixed-case encoding for error detection:\n", .{});
    const lowercase = Address.toHex(addr);
    const checksummed = Address.toChecksummed(addr);
    std.debug.print("Original (lowercase): {s}\n", .{&lowercase});
    std.debug.print("Checksummed:         {s}\n", .{&checksummed});
    std.debug.print("Notice: Some letters capitalized based on keccak256 hash\n\n", .{});

    // 2. Checksum validation
    std.debug.print("2. Checksum Validation\n\n", .{});

    const valid_checksummed = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
    const invalid_checksum = "0x742d35cc6634C0532925a3b844Bc9e7595f51e3e"; // Wrong case
    const all_lowercase = "0x742d35cc6634c0532925a3b844bc9e7595f51e3e";
    const all_uppercase = "0x742D35CC6634C0532925A3B844BC9E7595F51E3E";

    std.debug.print("Valid checksummed:   {}\n", .{Address.isValidChecksum(valid_checksummed)});
    std.debug.print("Invalid checksum:    {}\n", .{Address.isValidChecksum(invalid_checksum)});
    std.debug.print("All lowercase:       {}\n", .{Address.isValidChecksum(all_lowercase)}); // true - no checksum
    std.debug.print("All uppercase:       {}\n\n", .{Address.isValidChecksum(all_uppercase)}); // true - no checksum

    // 3. Detecting typos with checksums
    std.debug.print("3. Typo Detection\n\n", .{});

    // Helper to check if string has mixed case
    const has_mixed_case = struct {
        fn check(s: []const u8) bool {
            var has_upper = false;
            var has_lower = false;
            for (s) |c| {
                if (c >= 'A' and c <= 'F') has_upper = true;
                if (c >= 'a' and c <= 'f') has_lower = true;
            }
            return has_upper and has_lower;
        }
    }.check;

    // Valid addresses
    const test_addrs = [_][]const u8{
        "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e", // Valid checksum
        "0x742d35cc6634c0532925a3b844bc9e7595f51e3e", // Lowercase (no checksum)
        "0x742d35Cc6634C0532925a3b844Bc9e7595f51E3e", // Typo - last 'E' wrong
    };

    for (test_addrs) |test_addr| {
        if (!Address.isValid(test_addr)) {
            std.debug.print("✗ Invalid format: {s}\n", .{test_addr});
            continue;
        }

        // If mixed case, validate checksum
        const mixed = has_mixed_case(test_addr);
        if (mixed and !Address.isValidChecksum(test_addr)) {
            std.debug.print("✗ Invalid checksum (possible typo): {s}\n", .{test_addr});
            continue;
        }

        const parsed = try Address.fromHex(test_addr);
        const parsed_checksum = Address.toChecksummed(parsed);
        std.debug.print("✓ Valid address: {s}\n", .{&parsed_checksum});
    }
    std.debug.print("\n", .{});

    // 4. Converting addresses to checksummed format
    std.debug.print("4. Converting to Checksummed Format\n\n", .{});

    const addresses = [_][]const u8{
        "0x742d35cc6634c0532925a3b844bc9e7595f51e3e",
        "0xA0CF798816D4B9B9866B5330EEA46A18382F251E",
        "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    };

    std.debug.print("Converting addresses to EIP-55 checksummed format:\n", .{});
    for (addresses) |addr_str| {
        const parsed = try Address.fromHex(addr_str);
        const checksummed_out = Address.toChecksummed(parsed);
        std.debug.print("{s}\n", .{addr_str});
        std.debug.print("→ {s}\n\n", .{&checksummed_out});
    }

    // 5. Comparison: case-insensitive equality
    std.debug.print("5. Case-Insensitive Equality\n\n", .{});

    const addr1 = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    const addr2 = try Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e");
    const addr3 = try Address.fromHex("0x742D35CC6634C0532925A3B844BC9E7595F51E3E");

    std.debug.print("Address 1: {s}\n", .{&Address.toChecksummed(addr1)});
    std.debug.print("Address 2: {s}\n", .{&Address.toHex(addr2)});
    std.debug.print("Address 3: {s}\n", .{&Address.toUppercase(addr3)});
    std.debug.print("All equal (case-insensitive): {}\n", .{
        Address.equals(addr1, addr2) and Address.equals(addr2, addr3),
    });
    std.debug.print("\n", .{});

    // 6. Best practices
    std.debug.print("6. Best Practices\n\n", .{});
    std.debug.print("✓ Always display addresses in checksummed format\n", .{});
    std.debug.print("✓ Validate checksums on user input when mixed-case\n", .{});
    std.debug.print("✓ Store addresses as bytes internally (case-insensitive)\n", .{});
    std.debug.print("✓ Convert to checksummed for display/logging\n", .{});
}
