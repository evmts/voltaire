//! Storage Layout Utilities
//!
//! Provides functions for calculating storage slots according to:
//! - ERC-7201: Namespaced Storage Layout
//! - ERC-8042: Diamond Storage Layout
//!
//! @see https://eips.ethereum.org/EIPS/eip-7201
//! @see https://eips.ethereum.org/EIPS/eip-8042

const std = @import("std");
const crypto = @import("crypto");

/// Calculate ERC-7201 namespaced storage slot
/// Formula: keccak256(keccak256(id) - 1) & ~0xff
/// The result has the last byte cleared (set to 0x00)
///
/// @param id Namespace identifier string
/// @return 32-byte storage slot
pub fn calculateErc7201(id: []const u8) [32]u8 {
    // First hash: keccak256(id)
    const first_hash = crypto.Keccak256.hash(id);

    // Convert to u256, subtract 1
    var value: u256 = 0;
    for (first_hash) |byte| {
        value = (value << 8) | @as(u256, byte);
    }
    value = value - 1;

    // Convert back to bytes
    var intermediate: [32]u8 = undefined;
    var v = value;
    var i: usize = 32;
    while (i > 0) {
        i -= 1;
        intermediate[i] = @truncate(v & 0xff);
        v >>= 8;
    }

    // Second hash: keccak256(result - 1)
    var second_hash = crypto.Keccak256.hash(&intermediate);

    // Clear last byte: & ~0xff
    second_hash[31] = 0x00;

    return second_hash;
}

/// Calculate ERC-8042 (Diamond Storage) storage slot
/// Formula: keccak256(id)
/// Simpler than ERC-7201, just the direct hash of the identifier
///
/// @param id Storage namespace identifier string
/// @return 32-byte storage slot
pub fn calculateErc8042(id: []const u8) [32]u8 {
    return crypto.Keccak256.hash(id);
}

// ============================================================================
// Tests
// ============================================================================

test "calculateErc7201 - basic functionality" {
    const id = "example.main";
    const slot = calculateErc7201(id);

    // Should be 32 bytes
    try std.testing.expectEqual(@as(usize, 32), slot.len);

    // Last byte should be 0x00
    try std.testing.expectEqual(@as(u8, 0), slot[31]);
}

test "calculateErc7201 - deterministic" {
    const id = "determinism.test";
    const slot1 = calculateErc7201(id);
    const slot2 = calculateErc7201(id);

    try std.testing.expectEqual(slot1, slot2);
}

test "calculateErc7201 - different namespaces produce different slots" {
    const slot1 = calculateErc7201("namespace.one");
    const slot2 = calculateErc7201("namespace.two");

    // Should not be equal
    var equal = true;
    for (slot1, slot2) |a, b| {
        if (a != b) {
            equal = false;
            break;
        }
    }
    try std.testing.expect(!equal);

    // Both should have last byte cleared
    try std.testing.expectEqual(@as(u8, 0), slot1[31]);
    try std.testing.expectEqual(@as(u8, 0), slot2[31]);
}

test "calculateErc7201 - empty string" {
    const slot = calculateErc7201("");

    try std.testing.expectEqual(@as(usize, 32), slot.len);
    try std.testing.expectEqual(@as(u8, 0), slot[31]);
}

test "calculateErc7201 - long namespace" {
    const id = "org.example.very.long.namespace.identifier.with.many.parts";
    const slot = calculateErc7201(id);

    try std.testing.expectEqual(@as(usize, 32), slot.len);
    try std.testing.expectEqual(@as(u8, 0), slot[31]);
}

test "calculateErc8042 - basic functionality" {
    const id = "diamond.storage.example";
    const slot = calculateErc8042(id);

    try std.testing.expectEqual(@as(usize, 32), slot.len);
}

test "calculateErc8042 - deterministic" {
    const id = "diamond.determinism.test";
    const slot1 = calculateErc8042(id);
    const slot2 = calculateErc8042(id);

    try std.testing.expectEqual(slot1, slot2);
}

test "calculateErc8042 - different identifiers" {
    const slot1 = calculateErc8042("diamond.one");
    const slot2 = calculateErc8042("diamond.two");

    // Should not be equal
    var equal = true;
    for (slot1, slot2) |a, b| {
        if (a != b) {
            equal = false;
            break;
        }
    }
    try std.testing.expect(!equal);
}

test "calculateErc8042 - empty string" {
    const slot = calculateErc8042("");

    try std.testing.expectEqual(@as(usize, 32), slot.len);
}

test "calculateErc8042 - matches direct keccak256" {
    const id = "test.namespace";
    const slot = calculateErc8042(id);
    const direct_hash = crypto.Keccak256.hash(id);

    try std.testing.expectEqual(direct_hash, slot);
}

test "ERC-7201 vs ERC-8042 - different results" {
    const id = "same.namespace";
    const erc7201_slot = calculateErc7201(id);
    const erc8042_slot = calculateErc8042(id);

    // Should be different
    var equal = true;
    for (erc7201_slot, erc8042_slot) |a, b| {
        if (a != b) {
            equal = false;
            break;
        }
    }
    try std.testing.expect(!equal);
}
