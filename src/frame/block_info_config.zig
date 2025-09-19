/// Block information configuration parameters
///
/// Configures the types used for block information fields:
/// - Difficulty/PrevRandao type (defaults to u256 for spec compliance, but u64 is practical)
/// - Base fee type (defaults to u256 for spec compliance, but u64 is practical)
///
/// Configuration is validated at compile time to ensure correct usage.
const std = @import("std");

pub const BlockInfoConfig = struct {
    const Self = @This();

    /// Type for difficulty field (pre-merge) or prevrandao value (post-merge)
    /// Ethereum spec requires u256, but practical values fit in u64
    /// Post-merge prevrandao requires full u256 range
    DifficultyType: type = u256,

    /// Type for base fee field (EIP-1559)
    /// Ethereum spec requires u256, but practical values fit in u64
    /// Even extreme values (1000 Gwei) fit comfortably in u64
    BaseFeeType: type = u256,

    /// Whether to use compact types (u64) for difficulty and base_fee
    /// When true, uses u64 for both fields for memory efficiency
    /// When false, uses full u256 for spec compliance
    use_compact_types: bool = false,

    /// Get the configured difficulty type
    pub fn getDifficultyType(comptime self: Self) type {
        if (self.use_compact_types) {
            return u64;
        }
        return self.DifficultyType;
    }

    /// Get the configured base fee type
    pub fn getBaseFeeType(comptime self: Self) type {
        if (self.use_compact_types) {
            return u64;
        }
        return self.BaseFeeType;
    }

    pub fn validate(comptime self: Self) void {
        // Ensure types are numeric
        const difficulty_info = @typeInfo(self.DifficultyType);
        const base_fee_info = @typeInfo(self.BaseFeeType);

        if (difficulty_info != .int or base_fee_info != .int) {
            @compileError("DifficultyType and BaseFeeType must be integer types");
        }

        // Ensure types are at least u64 if compact types are used
        if (self.use_compact_types) {
            if (@bitSizeOf(self.DifficultyType) < 64 or @bitSizeOf(self.BaseFeeType) < 64) {
                @compileError("When use_compact_types is true, types must be at least u64");
            }
        }

        // Warn if types are smaller than recommended
        if (@bitSizeOf(self.DifficultyType) < 64) {
            @compileError("DifficultyType should be at least u64 for practical Ethereum values");
        }
        if (@bitSizeOf(self.BaseFeeType) < 64) {
            @compileError("BaseFeeType should be at least u64 for practical Ethereum values");
        }
    }
};

test "BlockInfoConfig default configuration" {
    const config = BlockInfoConfig{};
    try std.testing.expectEqual(u256, config.getDifficultyType());
    try std.testing.expectEqual(u256, config.getBaseFeeType());
    try std.testing.expect(!config.use_compact_types);
}

test "BlockInfoConfig compact types configuration" {
    const config = BlockInfoConfig{ .use_compact_types = true };
    try std.testing.expectEqual(u64, config.getDifficultyType());
    try std.testing.expectEqual(u64, config.getBaseFeeType());
}

test "BlockInfoConfig custom types configuration" {
    const config = BlockInfoConfig{
        .DifficultyType = u128,
        .BaseFeeType = u96,
        .use_compact_types = false,
    };
    try std.testing.expectEqual(u128, config.getDifficultyType());
    try std.testing.expectEqual(u96, config.getBaseFeeType());
}

test "BlockInfoConfig validation" {
    // These should compile successfully
    const valid1 = BlockInfoConfig{};
    valid1.validate();

    const valid2 = BlockInfoConfig{ .use_compact_types = true };
    valid2.validate();

    const valid3 = BlockInfoConfig{
        .DifficultyType = u256,
        .BaseFeeType = u128,
    };
    valid3.validate();
}
