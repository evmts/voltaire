//! License - SPDX License Identifier
//!
//! Represents an SPDX license identifier used in smart contract metadata.
//! Common values: "MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "UNLICENSED"
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const License = primitives.License;
//!
//! // Create license from string
//! const license = License.from("MIT");
//! const is_osi = License.isOSI(license);
//!
//! // Parse from Solidity source code
//! const source = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;";
//! if (License.fromSource(source)) |parsed| {
//!     // parsed == "MIT"
//! }
//! ```

const std = @import("std");

/// License type - represents an SPDX license identifier
pub const License = []const u8;

/// Common SPDX license identifiers
pub const MIT = "MIT";
pub const APACHE_2_0 = "Apache-2.0";
pub const GPL_3_0 = "GPL-3.0";
pub const GPL_3_0_ONLY = "GPL-3.0-only";
pub const GPL_3_0_OR_LATER = "GPL-3.0-or-later";
pub const LGPL_3_0 = "LGPL-3.0";
pub const BSD_3_CLAUSE = "BSD-3-Clause";
pub const BSD_2_CLAUSE = "BSD-2-Clause";
pub const ISC = "ISC";
pub const MPL_2_0 = "MPL-2.0";
pub const UNLICENSED = "UNLICENSED";
pub const BUSL_1_1 = "BUSL-1.1";
pub const AGPL_3_0 = "AGPL-3.0";
pub const CC0_1_0 = "CC0-1.0";

/// OSI-approved license identifiers (subset)
const OSI_APPROVED = [_][]const u8{
    MIT,
    APACHE_2_0,
    GPL_3_0,
    GPL_3_0_ONLY,
    GPL_3_0_OR_LATER,
    LGPL_3_0,
    BSD_3_CLAUSE,
    BSD_2_CLAUSE,
    ISC,
    MPL_2_0,
    AGPL_3_0,
};

/// Copyleft license identifiers
const COPYLEFT_LICENSES = [_][]const u8{
    GPL_3_0,
    GPL_3_0_ONLY,
    GPL_3_0_OR_LATER,
    LGPL_3_0,
    AGPL_3_0,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create License from string
pub fn from(identifier: []const u8) License {
    return identifier;
}

/// Create License from common identifier
pub fn fromCommon(identifier: enum {
    mit,
    apache_2_0,
    gpl_3_0,
    lgpl_3_0,
    bsd_3_clause,
    bsd_2_clause,
    isc,
    mpl_2_0,
    unlicensed,
    busl_1_1,
    agpl_3_0,
    cc0_1_0,
}) License {
    return switch (identifier) {
        .mit => MIT,
        .apache_2_0 => APACHE_2_0,
        .gpl_3_0 => GPL_3_0,
        .lgpl_3_0 => LGPL_3_0,
        .bsd_3_clause => BSD_3_CLAUSE,
        .bsd_2_clause => BSD_2_CLAUSE,
        .isc => ISC,
        .mpl_2_0 => MPL_2_0,
        .unlicensed => UNLICENSED,
        .busl_1_1 => BUSL_1_1,
        .agpl_3_0 => AGPL_3_0,
        .cc0_1_0 => CC0_1_0,
    };
}

// ============================================================================
// Converters
// ============================================================================

/// Convert License to string
pub fn toString(license: License) []const u8 {
    return license;
}

// ============================================================================
// Predicates
// ============================================================================

/// Check if license is OSI-approved
pub fn isOSI(license: License) bool {
    for (OSI_APPROVED) |approved| {
        if (std.mem.eql(u8, license, approved)) return true;
    }
    return false;
}

/// Check if license is copyleft
pub fn isCopyleft(license: License) bool {
    for (COPYLEFT_LICENSES) |copyleft| {
        if (std.mem.eql(u8, license, copyleft)) return true;
    }
    return false;
}

/// Check if license is permissive (OSI-approved but not copyleft)
pub fn isPermissive(license: License) bool {
    return isOSI(license) and !isCopyleft(license);
}

/// Check if license is MIT
pub fn isMIT(license: License) bool {
    return std.mem.eql(u8, license, MIT);
}

/// Check if license is unlicensed
pub fn isUnlicensed(license: License) bool {
    return std.mem.eql(u8, license, UNLICENSED);
}

/// Check if license is business source license
pub fn isBUSL(license: License) bool {
    return std.mem.startsWith(u8, license, "BUSL");
}

/// Check if license string is valid SPDX format
/// Basic validation: non-empty, contains only valid chars
pub fn isValid(license: License) bool {
    if (license.len == 0) return false;

    for (license) |c| {
        const valid = switch (c) {
            'A'...'Z', 'a'...'z', '0'...'9', '-', '.', '+' => true,
            else => false,
        };
        if (!valid) return false;
    }

    return true;
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two licenses are equal
pub fn equals(a: License, b: License) bool {
    return std.mem.eql(u8, a, b);
}

/// Check if two licenses are equal (case-insensitive)
pub fn equalsIgnoreCase(a: License, b: License) bool {
    if (a.len != b.len) return false;

    for (a, b) |ca, cb| {
        const lower_a = std.ascii.toLower(ca);
        const lower_b = std.ascii.toLower(cb);
        if (lower_a != lower_b) return false;
    }

    return true;
}

// ============================================================================
// Source Code Parsing
// ============================================================================

/// Parse license from Solidity source code
/// Looks for: // SPDX-License-Identifier: <license>
/// Returns null if no SPDX identifier found
pub fn fromSource(source: []const u8) ?License {
    const prefix = "SPDX-License-Identifier:";

    var i: usize = 0;
    while (i < source.len) {
        // Find start of comment
        if (i + 1 < source.len and source[i] == '/' and source[i + 1] == '/') {
            i += 2;

            // Skip whitespace after //
            while (i < source.len and (source[i] == ' ' or source[i] == '\t')) {
                i += 1;
            }

            // Check for SPDX prefix
            if (i + prefix.len <= source.len and std.mem.eql(u8, source[i .. i + prefix.len], prefix)) {
                i += prefix.len;

                // Skip whitespace after colon
                while (i < source.len and (source[i] == ' ' or source[i] == '\t')) {
                    i += 1;
                }

                // Extract license identifier (until newline or whitespace)
                const start = i;
                while (i < source.len and source[i] != '\n' and source[i] != '\r' and source[i] != ' ' and source[i] != '\t') {
                    i += 1;
                }

                if (i > start) {
                    const license = source[start..i];
                    if (isValid(license)) {
                        return license;
                    }
                }
            }
        }

        // Move to next line
        while (i < source.len and source[i] != '\n') {
            i += 1;
        }
        if (i < source.len) i += 1;
    }

    return null;
}

/// Parse license from multi-line comment style
/// Looks for: /* SPDX-License-Identifier: <license> */
pub fn fromSourceMultiline(source: []const u8) ?License {
    const prefix = "SPDX-License-Identifier:";

    var i: usize = 0;
    while (i + 1 < source.len) {
        // Find start of multi-line comment
        if (source[i] == '/' and source[i + 1] == '*') {
            i += 2;

            // Search within comment for SPDX
            while (i + 1 < source.len) {
                // Check for end of comment
                if (source[i] == '*' and source[i + 1] == '/') {
                    i += 2;
                    break;
                }

                // Skip whitespace
                while (i < source.len and (source[i] == ' ' or source[i] == '\t' or source[i] == '\n' or source[i] == '\r')) {
                    i += 1;
                }

                // Check for SPDX prefix
                if (i + prefix.len <= source.len and std.mem.eql(u8, source[i .. i + prefix.len], prefix)) {
                    i += prefix.len;

                    // Skip whitespace
                    while (i < source.len and (source[i] == ' ' or source[i] == '\t')) {
                        i += 1;
                    }

                    // Extract license identifier
                    const start = i;
                    while (i < source.len and source[i] != '\n' and source[i] != '\r' and source[i] != ' ' and source[i] != '\t' and source[i] != '*') {
                        i += 1;
                    }

                    if (i > start) {
                        const license = source[start..i];
                        if (isValid(license)) {
                            return license;
                        }
                    }
                }

                i += 1;
            }
        } else {
            i += 1;
        }
    }

    return null;
}

/// Parse license from source, trying both comment styles
pub fn fromSourceAny(source: []const u8) ?License {
    if (fromSource(source)) |license| {
        return license;
    }
    return fromSourceMultiline(source);
}

// ============================================================================
// Tests
// ============================================================================

test "License.from creates license" {
    const license = from("MIT");
    try std.testing.expectEqualStrings("MIT", license);
}

test "License.fromCommon creates known licenses" {
    try std.testing.expectEqualStrings("MIT", fromCommon(.mit));
    try std.testing.expectEqualStrings("Apache-2.0", fromCommon(.apache_2_0));
    try std.testing.expectEqualStrings("GPL-3.0", fromCommon(.gpl_3_0));
    try std.testing.expectEqualStrings("UNLICENSED", fromCommon(.unlicensed));
}

test "License.toString converts to string" {
    const license = from("Apache-2.0");
    try std.testing.expectEqualStrings("Apache-2.0", toString(license));
}

test "License.isOSI detects OSI-approved licenses" {
    try std.testing.expect(isOSI(MIT));
    try std.testing.expect(isOSI(APACHE_2_0));
    try std.testing.expect(isOSI(GPL_3_0));
    try std.testing.expect(isOSI(BSD_3_CLAUSE));
    try std.testing.expect(!isOSI(UNLICENSED));
    try std.testing.expect(!isOSI(BUSL_1_1));
}

test "License.isCopyleft detects copyleft licenses" {
    try std.testing.expect(isCopyleft(GPL_3_0));
    try std.testing.expect(isCopyleft(LGPL_3_0));
    try std.testing.expect(isCopyleft(AGPL_3_0));
    try std.testing.expect(!isCopyleft(MIT));
    try std.testing.expect(!isCopyleft(APACHE_2_0));
}

test "License.isPermissive detects permissive licenses" {
    try std.testing.expect(isPermissive(MIT));
    try std.testing.expect(isPermissive(APACHE_2_0));
    try std.testing.expect(isPermissive(BSD_3_CLAUSE));
    try std.testing.expect(!isPermissive(GPL_3_0));
    try std.testing.expect(!isPermissive(UNLICENSED));
}

test "License.isMIT" {
    try std.testing.expect(isMIT(MIT));
    try std.testing.expect(!isMIT(APACHE_2_0));
}

test "License.isUnlicensed" {
    try std.testing.expect(isUnlicensed(UNLICENSED));
    try std.testing.expect(!isUnlicensed(MIT));
}

test "License.isBUSL" {
    try std.testing.expect(isBUSL(BUSL_1_1));
    try std.testing.expect(isBUSL("BUSL-1.2"));
    try std.testing.expect(!isBUSL(MIT));
}

test "License.isValid validates SPDX format" {
    try std.testing.expect(isValid("MIT"));
    try std.testing.expect(isValid("Apache-2.0"));
    try std.testing.expect(isValid("GPL-3.0-or-later"));
    try std.testing.expect(!isValid(""));
    try std.testing.expect(!isValid("MIT License")); // spaces not allowed
    try std.testing.expect(!isValid("MIT/Apache")); // slash not allowed
}

test "License.equals compares licenses" {
    try std.testing.expect(equals(MIT, "MIT"));
    try std.testing.expect(!equals(MIT, APACHE_2_0));
}

test "License.equalsIgnoreCase case-insensitive comparison" {
    try std.testing.expect(equalsIgnoreCase("MIT", "mit"));
    try std.testing.expect(equalsIgnoreCase("Apache-2.0", "apache-2.0"));
    try std.testing.expect(!equalsIgnoreCase(MIT, APACHE_2_0));
}

test "License constants are correct" {
    try std.testing.expectEqualStrings("MIT", MIT);
    try std.testing.expectEqualStrings("Apache-2.0", APACHE_2_0);
    try std.testing.expectEqualStrings("GPL-3.0", GPL_3_0);
    try std.testing.expectEqualStrings("BSD-3-Clause", BSD_3_CLAUSE);
    try std.testing.expectEqualStrings("UNLICENSED", UNLICENSED);
    try std.testing.expectEqualStrings("BUSL-1.1", BUSL_1_1);
}

test "License.fromSource parses single-line comment" {
    const source1 = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;";
    try std.testing.expectEqualStrings("MIT", fromSource(source1).?);

    const source2 = "// SPDX-License-Identifier: Apache-2.0\ncontract Foo {}";
    try std.testing.expectEqualStrings("Apache-2.0", fromSource(source2).?);

    const source3 = "//SPDX-License-Identifier: GPL-3.0\n";
    try std.testing.expectEqualStrings("GPL-3.0", fromSource(source3).?);
}

test "License.fromSource handles whitespace variations" {
    const source1 = "//  SPDX-License-Identifier:  MIT\n";
    try std.testing.expectEqualStrings("MIT", fromSource(source1).?);

    const source2 = "// \t SPDX-License-Identifier:\tUnlicensed\n";
    try std.testing.expect(fromSource(source2) == null); // "Unlicensed" fails isValid (lowercase)

    const source3 = "// SPDX-License-Identifier: UNLICENSED\n";
    try std.testing.expectEqualStrings("UNLICENSED", fromSource(source3).?);
}

test "License.fromSource returns null for missing identifier" {
    try std.testing.expect(fromSource("pragma solidity ^0.8.0;") == null);
    try std.testing.expect(fromSource("// Some comment\n") == null);
    try std.testing.expect(fromSource("") == null);
}

test "License.fromSource finds identifier not on first line" {
    const source =
        \\// Some header comment
        \\// SPDX-License-Identifier: BSD-3-Clause
        \\pragma solidity ^0.8.0;
    ;
    try std.testing.expectEqualStrings("BSD-3-Clause", fromSource(source).?);
}

test "License.fromSourceMultiline parses multi-line comment" {
    const source1 = "/* SPDX-License-Identifier: MIT */\npragma solidity ^0.8.0;";
    try std.testing.expectEqualStrings("MIT", fromSourceMultiline(source1).?);

    const source2 =
        \\/*
        \\ * SPDX-License-Identifier: Apache-2.0
        \\ */
    ;
    try std.testing.expectEqualStrings("Apache-2.0", fromSourceMultiline(source2).?);
}

test "License.fromSourceMultiline returns null for missing identifier" {
    try std.testing.expect(fromSourceMultiline("/* Some comment */") == null);
    try std.testing.expect(fromSourceMultiline("pragma solidity ^0.8.0;") == null);
}

test "License.fromSourceAny tries both styles" {
    const source1 = "// SPDX-License-Identifier: MIT\n";
    try std.testing.expectEqualStrings("MIT", fromSourceAny(source1).?);

    const source2 = "/* SPDX-License-Identifier: GPL-3.0 */";
    try std.testing.expectEqualStrings("GPL-3.0", fromSourceAny(source2).?);

    try std.testing.expect(fromSourceAny("no license here") == null);
}

test "License.fromSource real Solidity contract" {
    const source =
        \\// SPDX-License-Identifier: MIT
        \\pragma solidity ^0.8.19;
        \\
        \\contract SimpleStorage {
        \\    uint256 private value;
        \\
        \\    function set(uint256 _value) external {
        \\        value = _value;
        \\    }
        \\
        \\    function get() external view returns (uint256) {
        \\        return value;
        \\    }
        \\}
    ;
    try std.testing.expectEqualStrings("MIT", fromSource(source).?);
}
