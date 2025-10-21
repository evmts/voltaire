/// KZG trusted setup data wrapper
///
/// This module provides access to the embedded trusted setup file used for
/// EIP-4844 blob verification. The trusted setup is embedded at compile time
/// to avoid runtime file I/O dependencies.
///
/// The trusted setup contains:
/// - 4096 G1 points in monomial and Lagrange form
/// - 65 G2 points in monomial form
/// - Generated from the Ethereum KZG Ceremony
///
/// Format: Text file with points in hex format
/// Size: ~788KB (4096 G1 points + 65 G2 points)
///
/// Usage:
/// ```zig
/// const kzg_trusted_setup = @import("kzg_trusted_setup.zig");
/// const setup_data = kzg_trusted_setup.data;
/// try c_kzg.loadTrustedSetupFromText(setup_data, 0);
/// ```

/// Embedded trusted setup data from the KZG ceremony
/// Format: Text file with G1 and G2 points in hex format
/// Size: ~4096 G1 points + 65 G2 points
pub const data = @embedFile("../../lib/c-kzg-4844/src/trusted_setup.txt");

/// Parse the header to get the number of G1 and G2 points
pub fn parseHeader() struct { n_g1: usize, n_g2: usize } {
    const std = @import("std");

    var lines = std.mem.splitScalar(u8, data, '\n');

    // The trusted setup file format is fixed and known to be valid
    // If parsing fails, the embedded file is corrupted which should never happen
    const n_g1_line = lines.next() orelse @panic("kzg_trusted_setup: missing G1 count line");
    const n_g1 = std.fmt.parseInt(usize, std.mem.trim(u8, n_g1_line, " \t\r\n"), 10) catch |err| {
        @panic(std.fmt.comptimePrint("kzg_trusted_setup: invalid G1 count: {}", .{err}));
    };

    const n_g2_line = lines.next() orelse @panic("kzg_trusted_setup: missing G2 count line");
    const n_g2 = std.fmt.parseInt(usize, std.mem.trim(u8, n_g2_line, " \t\r\n"), 10) catch |err| {
        @panic(std.fmt.comptimePrint("kzg_trusted_setup: invalid G2 count: {}", .{err}));
    };

    return .{ .n_g1 = n_g1, .n_g2 = n_g2 };
}

/// Expected values from the Ethereum KZG Ceremony
pub const EXPECTED_G1_POINTS = 4096;
pub const EXPECTED_G2_POINTS = 65;

/// Verify the trusted setup has the expected format
pub fn verify() bool {
    const header = parseHeader();
    return header.n_g1 == EXPECTED_G1_POINTS and header.n_g2 == EXPECTED_G2_POINTS;
}

test "trusted setup embedded" {
    const std = @import("std");
    const testing = std.testing;

    // Verify data is embedded and non-empty
    try testing.expect(data.len > 0);

    // Should be approximately 788KB
    try testing.expect(data.len > 700_000);
    try testing.expect(data.len < 900_000);

    // Should start with the expected header format
    try testing.expect(std.mem.startsWith(u8, data, "4096\n65\n"));
}

test "trusted setup header parsing" {
    const testing = @import("std").testing;

    const header = parseHeader();
    try testing.expectEqual(@as(usize, EXPECTED_G1_POINTS), header.n_g1);
    try testing.expectEqual(@as(usize, EXPECTED_G2_POINTS), header.n_g2);
}

test "trusted setup verification" {
    const testing = @import("std").testing;
    try testing.expect(verify());
}
