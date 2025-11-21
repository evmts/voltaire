//! Epoch - Consensus Layer Epoch Number
//!
//! Represents a consensus layer epoch (32 slots = 6.4 minutes).
//! Epochs are used for validator duties, finality, and checkpoint organization.
//!
//! Each epoch contains exactly 32 slots, and is the unit used for
//! staking rewards, validator assignments, and finality checkpoints.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const Epoch = primitives.Epoch;
//!
//! // Create epoch
//! const epoch = Epoch.from(1000);
//!
//! // Convert to number
//! const num = Epoch.toNumber(epoch);
//!
//! // Convert to first slot of epoch (epoch * 32)
//! const slot = Epoch.toSlot(epoch);
//! ```

const std = @import("std");
const Slot = @import("../Slot/Slot.zig");

/// Epoch type - represents a consensus layer epoch number
pub const Epoch = u64;

/// Create Epoch from u64 value
///
/// ## Parameters
/// - `value`: u64 epoch number
///
/// ## Returns
/// Epoch value
///
/// ## Example
/// ```zig
/// const epoch = Epoch.from(1000);
/// ```
pub fn from(value: u64) Epoch {
    return value;
}

/// Convert Epoch to u64
///
/// ## Parameters
/// - `epoch`: Epoch value
///
/// ## Returns
/// u64 representation
///
/// ## Example
/// ```zig
/// const epoch = Epoch.from(1000);
/// const num = Epoch.toNumber(epoch);
/// ```
pub fn toNumber(epoch: Epoch) u64 {
    return epoch;
}

/// Check if two Epochs are equal
///
/// ## Parameters
/// - `a`: First epoch
/// - `b`: Second epoch
///
/// ## Returns
/// true if equal
///
/// ## Example
/// ```zig
/// const a = Epoch.from(1000);
/// const b = Epoch.from(1000);
/// const result = Epoch.equals(a, b); // true
/// ```
pub fn equals(a: Epoch, b: Epoch) bool {
    return a == b;
}

/// Convert Epoch to the first Slot of that epoch
///
/// Each epoch contains 32 slots. This returns the first slot: slot = epoch * 32.
///
/// ## Parameters
/// - `epoch`: Epoch value
///
/// ## Returns
/// First slot of the epoch
///
/// ## Example
/// ```zig
/// const epoch = Epoch.from(3);
/// const slot = Epoch.toSlot(epoch); // 96 (3 * 32)
/// ```
pub fn toSlot(epoch: Epoch) Slot.Slot {
    return Slot.from(epoch * 32);
}

// ====================================
// Tests
// ====================================

test "Epoch.from creates epoch" {
    const epoch = from(1000);
    try std.testing.expectEqual(1000, epoch);
}

test "Epoch.toNumber converts to u64" {
    const epoch = from(1000);
    try std.testing.expectEqual(1000, toNumber(epoch));
}

test "Epoch.equals returns true for equal epochs" {
    const a = from(1000);
    const b = from(1000);
    try std.testing.expect(equals(a, b));
}

test "Epoch.equals returns false for unequal epochs" {
    const a = from(1000);
    const b = from(1001);
    try std.testing.expect(!equals(a, b));
}

test "Epoch.toSlot converts epoch to first slot" {
    const epoch = from(3);
    const slot = toSlot(epoch);
    try std.testing.expectEqual(96, slot);
}

test "Epoch.toSlot handles epoch 0" {
    const epoch = from(0);
    const slot = toSlot(epoch);
    try std.testing.expectEqual(0, slot);
}

test "Epoch.toSlot handles epoch 1" {
    const epoch = from(1);
    const slot = toSlot(epoch);
    try std.testing.expectEqual(32, slot);
}

test "Epoch.toSlot handles large epoch numbers" {
    const epoch = from(31250);
    const slot = toSlot(epoch);
    try std.testing.expectEqual(1000000, slot);
}
