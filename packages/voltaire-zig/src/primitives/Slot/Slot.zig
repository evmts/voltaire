//! Slot - Consensus Layer Slot Number
//!
//! Represents a consensus layer slot number (12 seconds per slot).
//! Slots are the fundamental unit of time in Ethereum's proof-of-stake consensus.
//!
//! Each slot has a duration of 12 seconds, and 32 slots form an epoch.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const Slot = primitives.Slot;
//!
//! // Create slot
//! const slot = Slot.from(1000000);
//!
//! // Convert to number
//! const num = Slot.toNumber(slot);
//!
//! // Convert to epoch (slot / 32)
//! const epoch = Slot.toEpoch(slot);
//! ```

const std = @import("std");
const Epoch = @import("../Epoch/Epoch.zig");

/// Slot type - represents a consensus layer slot number
pub const Slot = u64;

/// Create Slot from u64 value
///
/// ## Parameters
/// - `value`: u64 slot number
///
/// ## Returns
/// Slot value
///
/// ## Example
/// ```zig
/// const slot = Slot.from(1000000);
/// ```
pub fn from(value: u64) Slot {
    return value;
}

/// Convert Slot to u64
///
/// ## Parameters
/// - `slot`: Slot value
///
/// ## Returns
/// u64 representation
///
/// ## Example
/// ```zig
/// const slot = Slot.from(1000000);
/// const num = Slot.toNumber(slot);
/// ```
pub fn toNumber(slot: Slot) u64 {
    return slot;
}

/// Check if two Slots are equal
///
/// ## Parameters
/// - `a`: First slot
/// - `b`: Second slot
///
/// ## Returns
/// true if equal
///
/// ## Example
/// ```zig
/// const a = Slot.from(1000000);
/// const b = Slot.from(1000000);
/// const result = Slot.equals(a, b); // true
/// ```
pub fn equals(a: Slot, b: Slot) bool {
    return a == b;
}

/// Convert Slot to its corresponding Epoch
///
/// Each epoch contains 32 slots. This performs integer division: epoch = slot / 32.
///
/// ## Parameters
/// - `slot`: Slot value
///
/// ## Returns
/// Epoch value
///
/// ## Example
/// ```zig
/// const slot = Slot.from(96);
/// const epoch = Slot.toEpoch(slot); // 3 (96 / 32)
/// ```
pub fn toEpoch(slot: Slot) Epoch.Epoch {
    return Epoch.from(slot / 32);
}

// ====================================
// Tests
// ====================================

test "Slot.from creates slot" {
    const slot = from(1000000);
    try std.testing.expectEqual(1000000, slot);
}

test "Slot.toNumber converts to u64" {
    const slot = from(1000000);
    try std.testing.expectEqual(1000000, toNumber(slot));
}

test "Slot.equals returns true for equal slots" {
    const a = from(1000000);
    const b = from(1000000);
    try std.testing.expect(equals(a, b));
}

test "Slot.equals returns false for unequal slots" {
    const a = from(1000000);
    const b = from(1000001);
    try std.testing.expect(!equals(a, b));
}

test "Slot.toEpoch converts slot to epoch" {
    const slot = from(96);
    const epoch = toEpoch(slot);
    try std.testing.expectEqual(3, epoch);
}

test "Slot.toEpoch rounds down for partial epochs" {
    const slot = from(97);
    const epoch = toEpoch(slot);
    try std.testing.expectEqual(3, epoch);
}

test "Slot.toEpoch handles slot 0" {
    const slot = from(0);
    const epoch = toEpoch(slot);
    try std.testing.expectEqual(0, epoch);
}

test "Slot.toEpoch handles first slot of epoch" {
    const slot = from(32);
    const epoch = toEpoch(slot);
    try std.testing.expectEqual(1, epoch);
}

test "Slot.toEpoch handles large slot numbers" {
    const slot = from(1000000);
    const epoch = toEpoch(slot);
    try std.testing.expectEqual(31250, epoch);
}
