//! CompilerVersion - Solidity/Vyper/Huff Compiler Version
//!
//! Represents a compiler version string in the format "v0.8.20+commit.a1b2c3d4"
//! or "0.8.20+commit.a1b2c3d4". Used for source verification and compatibility.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const CompilerVersion = primitives.CompilerVersion;
//!
//! // Parse version
//! const version = try CompilerVersion.parse("v0.8.20+commit.a1b2c3d4");
//! const major = CompilerVersion.getMajor(version);
//!
//! // Create from components
//! const v = CompilerVersion.fromParsed(.{
//!     .major = 0, .minor = 8, .patch = 20,
//!     .prerelease = "nightly",
//!     .build = "a1b2c3d4",
//! });
//!
//! // Check feature support
//! const has_push0 = CompilerVersion.supportsFeature("0.8.20", .push0);
//! ```

const std = @import("std");

/// Compiler type
pub const Compiler = enum {
    Solc,
    Vyper,
    Huff,

    pub fn toString(self: Compiler) []const u8 {
        return switch (self) {
            .Solc => "solc",
            .Vyper => "vyper",
            .Huff => "huff",
        };
    }

    pub fn fromString(s: []const u8) ?Compiler {
        if (std.mem.eql(u8, s, "solc") or std.mem.eql(u8, s, "Solc")) return .Solc;
        if (std.mem.eql(u8, s, "vyper") or std.mem.eql(u8, s, "Vyper")) return .Vyper;
        if (std.mem.eql(u8, s, "huff") or std.mem.eql(u8, s, "Huff")) return .Huff;
        return null;
    }
};

/// Solidity feature flags
pub const Feature = enum {
    /// ABIEncoderV2 (0.6.0+)
    abi_encoder_v2,
    /// Checked arithmetic by default (0.8.0+)
    checked_arithmetic,
    /// Custom errors (0.8.4+)
    custom_errors,
    /// User-defined value types (0.8.8+)
    user_defined_value_types,
    /// PUSH0 opcode support (0.8.20+)
    push0,
    /// Transient storage TLOAD/TSTORE (0.8.24+)
    transient_storage,
    /// Cancun EVM version (0.8.24+)
    cancun,
    /// Try/catch (0.6.0+)
    try_catch,
    /// Immutable keyword (0.6.5+)
    immutable,
    /// Named return values (0.4.0+)
    named_returns,
    /// Receive function (0.6.0+)
    receive_function,
    /// Fallback with calldata (0.6.0+)
    fallback_calldata,
};

/// Parsed version components
pub const ParsedVersion = struct {
    major: u16,
    minor: u16,
    patch: u16,
    prerelease: ?[]const u8 = null,
    build: ?[]const u8 = null,

    /// Legacy alias for build (commit hash)
    pub fn commit(self: ParsedVersion) ?[]const u8 {
        return self.build;
    }

    /// Check if this is a prerelease/nightly version
    pub fn isPrerelease(self: ParsedVersion) bool {
        return self.prerelease != null;
    }
};

/// CompilerVersion type - represents a compiler version string
pub const CompilerVersion = []const u8;

// ============================================================================
// Constructors
// ============================================================================

/// Create CompilerVersion from string
pub fn from(version: []const u8) CompilerVersion {
    return version;
}

/// Create CompilerVersion from components
pub fn fromComponents(allocator: std.mem.Allocator, major: u16, minor: u16, patch: u16) ![]u8 {
    return try std.fmt.allocPrint(allocator, "{d}.{d}.{d}", .{ major, minor, patch });
}

/// Create CompilerVersion from components with commit
pub fn fromComponentsWithCommit(allocator: std.mem.Allocator, major: u16, minor: u16, patch: u16, commit: []const u8) ![]u8 {
    return try std.fmt.allocPrint(allocator, "{d}.{d}.{d}+commit.{s}", .{ major, minor, patch, commit });
}

// ============================================================================
// Parsing
// ============================================================================

/// Parse version string into components
pub fn parse(version: CompilerVersion) !ParsedVersion {
    var v = version;

    // Handle optional 'v' prefix
    if (v.len > 0 and v[0] == 'v') {
        v = v[1..];
    }

    // Check for nightly
    const nightly = std.mem.indexOf(u8, v, "nightly") != null;

    // Find commit hash separator
    var commit: ?[]const u8 = null;
    var version_part = v;
    if (std.mem.indexOf(u8, v, "+commit.")) |pos| {
        version_part = v[0..pos];
        commit = v[pos + 8 ..];
    } else if (std.mem.indexOf(u8, v, "+")) |pos| {
        version_part = v[0..pos];
    }

    // Parse major.minor.patch
    var parts = std.mem.splitScalar(u8, version_part, '.');
    const major_str = parts.next() orelse return error.InvalidVersion;
    const minor_str = parts.next() orelse return error.InvalidVersion;
    const patch_str = parts.next() orelse return error.InvalidVersion;

    const major = std.fmt.parseInt(u16, major_str, 10) catch return error.InvalidVersion;
    const minor = std.fmt.parseInt(u16, minor_str, 10) catch return error.InvalidVersion;
    const patch = std.fmt.parseInt(u16, patch_str, 10) catch return error.InvalidVersion;

    return .{
        .major = major,
        .minor = minor,
        .patch = patch,
        .commit = commit,
        .nightly = nightly,
    };
}

// ============================================================================
// Accessors
// ============================================================================

/// Get major version
pub fn getMajor(version: CompilerVersion) !u16 {
    const parsed = try parse(version);
    return parsed.major;
}

/// Get minor version
pub fn getMinor(version: CompilerVersion) !u16 {
    const parsed = try parse(version);
    return parsed.minor;
}

/// Get patch version
pub fn getPatch(version: CompilerVersion) !u16 {
    const parsed = try parse(version);
    return parsed.patch;
}

/// Get commit hash (if present)
pub fn getCommit(version: CompilerVersion) !?[]const u8 {
    const parsed = try parse(version);
    return parsed.commit;
}

/// Check if version is nightly
pub fn isNightly(version: CompilerVersion) !bool {
    const parsed = try parse(version);
    return parsed.nightly;
}

// ============================================================================
// Comparison
// ============================================================================

/// Compare two versions
/// Returns negative if a < b, zero if equal, positive if a > b
pub fn compare(a: CompilerVersion, b: CompilerVersion) !i32 {
    const parsed_a = try parse(a);
    const parsed_b = try parse(b);

    // Compare major
    if (parsed_a.major < parsed_b.major) return -1;
    if (parsed_a.major > parsed_b.major) return 1;

    // Compare minor
    if (parsed_a.minor < parsed_b.minor) return -1;
    if (parsed_a.minor > parsed_b.minor) return 1;

    // Compare patch
    if (parsed_a.patch < parsed_b.patch) return -1;
    if (parsed_a.patch > parsed_b.patch) return 1;

    return 0;
}

/// Check if two versions are equal (ignoring commit hash)
pub fn equals(a: CompilerVersion, b: CompilerVersion) bool {
    const result = compare(a, b) catch return false;
    return result == 0;
}

/// Check if version a is compatible with version b
/// Compatible if major versions match and a >= b
pub fn isCompatible(a: CompilerVersion, b: CompilerVersion) !bool {
    const parsed_a = try parse(a);
    const parsed_b = try parse(b);

    // Major version must match
    if (parsed_a.major != parsed_b.major) return false;

    // a must be >= b
    const cmp = try compare(a, b);
    return cmp >= 0;
}

/// Check if version is at least the specified version
pub fn isAtLeast(version: CompilerVersion, major: u16, minor: u16, patch: u16) !bool {
    const parsed = try parse(version);

    if (parsed.major > major) return true;
    if (parsed.major < major) return false;

    if (parsed.minor > minor) return true;
    if (parsed.minor < minor) return false;

    return parsed.patch >= patch;
}

// ============================================================================
// Version Ranges
// ============================================================================

/// Check if version is within range (inclusive)
pub fn isInRange(version: CompilerVersion, min: CompilerVersion, max: CompilerVersion) !bool {
    const cmp_min = try compare(version, min);
    const cmp_max = try compare(version, max);
    return cmp_min >= 0 and cmp_max <= 0;
}

// ============================================================================
// Tests
// ============================================================================

test "CompilerVersion.from creates version" {
    const version = from("0.8.20");
    try std.testing.expectEqualStrings("0.8.20", version);
}

test "CompilerVersion.parse parses simple version" {
    const parsed = try parse("0.8.20");
    try std.testing.expectEqual(@as(u16, 0), parsed.major);
    try std.testing.expectEqual(@as(u16, 8), parsed.minor);
    try std.testing.expectEqual(@as(u16, 20), parsed.patch);
    try std.testing.expect(parsed.commit == null);
}

test "CompilerVersion.parse parses version with v prefix" {
    const parsed = try parse("v0.8.20");
    try std.testing.expectEqual(@as(u16, 0), parsed.major);
    try std.testing.expectEqual(@as(u16, 8), parsed.minor);
    try std.testing.expectEqual(@as(u16, 20), parsed.patch);
}

test "CompilerVersion.parse parses version with commit" {
    const parsed = try parse("0.8.20+commit.a1b2c3d4");
    try std.testing.expectEqual(@as(u16, 0), parsed.major);
    try std.testing.expectEqual(@as(u16, 8), parsed.minor);
    try std.testing.expectEqual(@as(u16, 20), parsed.patch);
    try std.testing.expect(parsed.commit != null);
    try std.testing.expectEqualStrings("a1b2c3d4", parsed.commit.?);
}

test "CompilerVersion.parse parses full version" {
    const parsed = try parse("v0.8.20+commit.a1b2c3d4");
    try std.testing.expectEqual(@as(u16, 0), parsed.major);
    try std.testing.expectEqual(@as(u16, 8), parsed.minor);
    try std.testing.expectEqual(@as(u16, 20), parsed.patch);
    try std.testing.expectEqualStrings("a1b2c3d4", parsed.commit.?);
}

test "CompilerVersion.getMajor" {
    const major = try getMajor("0.8.20");
    try std.testing.expectEqual(@as(u16, 0), major);
}

test "CompilerVersion.getMinor" {
    const minor = try getMinor("0.8.20");
    try std.testing.expectEqual(@as(u16, 8), minor);
}

test "CompilerVersion.getPatch" {
    const patch = try getPatch("0.8.20");
    try std.testing.expectEqual(@as(u16, 20), patch);
}

test "CompilerVersion.compare" {
    try std.testing.expect(try compare("0.8.20", "0.8.19") > 0);
    try std.testing.expect(try compare("0.8.19", "0.8.20") < 0);
    try std.testing.expect(try compare("0.8.20", "0.8.20") == 0);
    try std.testing.expect(try compare("0.9.0", "0.8.20") > 0);
    try std.testing.expect(try compare("1.0.0", "0.8.20") > 0);
}

test "CompilerVersion.equals" {
    try std.testing.expect(equals("0.8.20", "0.8.20"));
    try std.testing.expect(equals("v0.8.20", "0.8.20"));
    try std.testing.expect(equals("0.8.20+commit.abc", "0.8.20+commit.xyz"));
    try std.testing.expect(!equals("0.8.20", "0.8.19"));
}

test "CompilerVersion.isCompatible" {
    // Same major version, a >= b
    try std.testing.expect(try isCompatible("0.8.20", "0.8.19"));
    try std.testing.expect(try isCompatible("0.8.20", "0.8.20"));

    // a < b
    try std.testing.expect(!try isCompatible("0.8.19", "0.8.20"));

    // Different major version
    try std.testing.expect(!try isCompatible("1.0.0", "0.8.20"));
}

test "CompilerVersion.isAtLeast" {
    try std.testing.expect(try isAtLeast("0.8.20", 0, 8, 20));
    try std.testing.expect(try isAtLeast("0.8.20", 0, 8, 19));
    try std.testing.expect(try isAtLeast("0.8.20", 0, 7, 0));
    try std.testing.expect(!try isAtLeast("0.8.20", 0, 8, 21));
    try std.testing.expect(!try isAtLeast("0.8.20", 0, 9, 0));
    try std.testing.expect(!try isAtLeast("0.8.20", 1, 0, 0));
}

test "CompilerVersion.isInRange" {
    try std.testing.expect(try isInRange("0.8.20", "0.8.0", "0.9.0"));
    try std.testing.expect(try isInRange("0.8.20", "0.8.20", "0.8.20"));
    try std.testing.expect(!try isInRange("0.8.20", "0.8.21", "0.9.0"));
    try std.testing.expect(!try isInRange("0.8.20", "0.8.0", "0.8.19"));
}

test "CompilerVersion.fromComponents" {
    const allocator = std.testing.allocator;
    const version = try fromComponents(allocator, 0, 8, 20);
    defer allocator.free(version);
    try std.testing.expectEqualStrings("0.8.20", version);
}

test "CompilerVersion.fromComponentsWithCommit" {
    const allocator = std.testing.allocator;
    const version = try fromComponentsWithCommit(allocator, 0, 8, 20, "abc123");
    defer allocator.free(version);
    try std.testing.expectEqualStrings("0.8.20+commit.abc123", version);
}

test "CompilerVersion.parse invalid version" {
    try std.testing.expectError(error.InvalidVersion, parse("invalid"));
    try std.testing.expectError(error.InvalidVersion, parse("0.8"));
    try std.testing.expectError(error.InvalidVersion, parse("abc.def.ghi"));
}
