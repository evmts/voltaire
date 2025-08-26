const primitives = @import("primitives");
const AccessList = @import("access_list.zig").AccessList;

// EIPs is a comptime known configuration of Eip and hardfork specific behavior
export const Eips = struct {
    const Self = @This();

    hardfork: Hardfork,

    // TODO this can throw an allocator error. But I don't think we should be allocating here. Instead we should store in preallocated memory
    /// EIP-3651: Warm COINBASE address at the start of transaction
    /// Shanghai hardfork introduced this optimization
    inline fn eip_3651_warm_coinbase_address(self: Self, access_list: AccessList, coinbase: primitives.Address) void {
        if (!self.hardfork.isAtLeast(.SHANGHAI)) return;
        try access_list.pre_warm_addresses(.{coinbase});
    }

    pub const Hardfork = enum {
        /// Original Ethereum launch (July 2015).
        /// Base EVM with fundamental opcodes.
        FRONTIER,
        /// First planned hardfork (March 2016).
        /// Added DELEGATECALL and fixed critical issues.
        HOMESTEAD,
        /// Emergency fork for DAO hack (July 2016).
        /// No EVM changes, only state modifications.
        DAO,
        /// Gas repricing fork (October 2016).
        /// EIP-150: Increased gas costs for IO-heavy operations.
        TANGERINE_WHISTLE,
        /// State cleaning fork (November 2016).
        /// EIP-161: Removed empty accounts.
        SPURIOUS_DRAGON,
        /// Major feature fork (October 2017).
        /// Added REVERT, RETURNDATASIZE, RETURNDATACOPY, STATICCALL.
        BYZANTIUM,
        /// Efficiency improvements (February 2019).
        /// Added CREATE2, shift opcodes, EXTCODEHASH.
        CONSTANTINOPLE,
        /// Quick fix fork (February 2019).
        /// Removed EIP-1283 due to reentrancy concerns.
        PETERSBURG,
        /// Gas optimization fork (December 2019).
        /// EIP-2200: Rebalanced SSTORE costs.
        /// Added CHAINID and SELFBALANCE.
        ISTANBUL,
        /// Difficulty bomb delay (January 2020).
        /// No EVM changes.
        MUIR_GLACIER,
        /// Access list fork (April 2021).
        /// EIP-2929: Gas cost for cold/warm access.
        /// EIP-2930: Optional access lists.
        BERLIN,
        /// Fee market reform (August 2021).
        /// EIP-1559: Base fee and new transaction types.
        /// Added BASEFEE opcode.
        LONDON,
        /// Difficulty bomb delay (December 2021).
        /// No EVM changes.
        ARROW_GLACIER,
        /// Difficulty bomb delay (June 2022).
        /// No EVM changes.
        GRAY_GLACIER,
        /// Proof of Stake transition (September 2022).
        /// Replaced DIFFICULTY with PREVRANDAO.
        MERGE,
        /// Withdrawal enabling fork (April 2023).
        /// EIP-3855: PUSH0 opcode.
        SHANGHAI,
        /// Proto-danksharding fork (March 2024).
        /// EIP-4844: Blob transactions.
        /// EIP-1153: Transient storage (TLOAD/TSTORE).
        /// EIP-5656: MCOPY opcode.
        CANCUN,
        /// Default hardfork for new chains.
        /// Set to latest stable fork (currently CANCUN).
        pub const DEFAULT = Hardfork.CANCUN;

        /// Convert hardfork to its numeric representation for version comparisons
        pub fn toInt(self: Hardfork) u32 {
            return @intFromEnum(self);
        }

        /// Check if this hardfork is at least the specified version
        pub fn isAtLeast(self: Hardfork, target: Hardfork) bool {
            return self.toInt() >= target.toInt();
        }

        /// Check if this hardfork is before the specified version
        pub fn isBefore(self: Hardfork, target: Hardfork) bool {
            return self.toInt() < target.toInt();
        }
    };

    const std = @import("std");

    test "hardfork enum ordering" {
        try std.testing.expect(@intFromEnum(Hardfork.FRONTIER) < @intFromEnum(Hardfork.HOMESTEAD));
        try std.testing.expect(@intFromEnum(Hardfork.HOMESTEAD) < @intFromEnum(Hardfork.BYZANTIUM));
        try std.testing.expect(@intFromEnum(Hardfork.BYZANTIUM) < @intFromEnum(Hardfork.CANCUN));
    }

    test "hardfork default is cancun" {
        try std.testing.expectEqual(Hardfork.CANCUN, Hardfork.DEFAULT);
    }

    test "hardfork toInt conversion" {
        try std.testing.expect(Hardfork.FRONTIER.toInt() == 0);
        try std.testing.expect(Hardfork.HOMESTEAD.toInt() == 1);
        try std.testing.expect(Hardfork.CANCUN.toInt() > Hardfork.FRONTIER.toInt());
    }

    test "hardfork isAtLeast comparison" {
        try std.testing.expect(Hardfork.CANCUN.isAtLeast(Hardfork.FRONTIER));
        try std.testing.expect(Hardfork.CANCUN.isAtLeast(Hardfork.CANCUN));
        try std.testing.expect(!Hardfork.FRONTIER.isAtLeast(Hardfork.CANCUN));

        try std.testing.expect(Hardfork.BERLIN.isAtLeast(Hardfork.BERLIN));
        try std.testing.expect(Hardfork.LONDON.isAtLeast(Hardfork.BERLIN));
        try std.testing.expect(!Hardfork.HOMESTEAD.isAtLeast(Hardfork.BERLIN));
    }

    test "hardfork isBefore comparison" {
        try std.testing.expect(Hardfork.FRONTIER.isBefore(Hardfork.CANCUN));
        try std.testing.expect(!Hardfork.CANCUN.isBefore(Hardfork.FRONTIER));
        try std.testing.expect(!Hardfork.CANCUN.isBefore(Hardfork.CANCUN));

        try std.testing.expect(Hardfork.HOMESTEAD.isBefore(Hardfork.BERLIN));
        try std.testing.expect(!Hardfork.BERLIN.isBefore(Hardfork.HOMESTEAD));
    }

    test "hardfork version comparisons edge cases" {
        // Test adjacent forks
        try std.testing.expect(Hardfork.BERLIN.isBefore(Hardfork.LONDON));
        try std.testing.expect(Hardfork.LONDON.isAtLeast(Hardfork.BERLIN));

        // Test same fork
        try std.testing.expect(!Hardfork.ISTANBUL.isBefore(Hardfork.ISTANBUL));
        try std.testing.expect(Hardfork.ISTANBUL.isAtLeast(Hardfork.ISTANBUL));
    }

    test "hardfork major milestone checks" {
        // Pre-Byzantium (no REVERT opcode)
        try std.testing.expect(Hardfork.HOMESTEAD.isBefore(Hardfork.BYZANTIUM));
        try std.testing.expect(Hardfork.TANGERINE_WHISTLE.isBefore(Hardfork.BYZANTIUM));

        // Post-Berlin (warm/cold access)
        try std.testing.expect(Hardfork.BERLIN.isAtLeast(Hardfork.BERLIN));
        try std.testing.expect(Hardfork.LONDON.isAtLeast(Hardfork.BERLIN));
        try std.testing.expect(Hardfork.CANCUN.isAtLeast(Hardfork.BERLIN));

        // Shanghai introduces PUSH0
        try std.testing.expect(Hardfork.SHANGHAI.isAtLeast(Hardfork.SHANGHAI));
        try std.testing.expect(Hardfork.CANCUN.isAtLeast(Hardfork.SHANGHAI));

        // Cancun introduces transient storage
        try std.testing.expect(Hardfork.CANCUN.isAtLeast(Hardfork.CANCUN));
    }
};
