//! Ethereum Hardfork Management
//!
//! This module provides hardfork identifiers and version comparison utilities
//! for Ethereum protocol upgrades. Each hardfork represents a protocol upgrade
//! that changes EVM behavior, gas costs, or adds new features.
//!
//! ## Usage
//!
//! ### Basic Version Comparison
//! ```zig
//! const hardfork = @import("primitives");
//!
//! const current = hardfork.Hardfork.CANCUN;
//! if (current.isAtLeast(.SHANGHAI)) {
//!     // PUSH0 opcode is available
//! }
//! ```
//!
//! ### Fork Transitions
//! ```zig
//! // Parse a transition like "ShanghaiToCancunAtTime15000"
//! const transition = hardfork.ForkTransition.fromString("ShanghaiToCancunAtTime15000");
//! const active = transition.?.getActiveFork(block_number, timestamp);
//! ```
//!
//! ## Hardfork Timeline
//!
//! Each hardfork builds upon previous ones, maintaining backward compatibility:
//! - **FRONTIER** (July 2015): Original Ethereum launch
//! - **HOMESTEAD** (March 2016): Added DELEGATECALL
//! - **BYZANTIUM** (October 2017): Added REVERT, STATICCALL
//! - **CONSTANTINOPLE** (February 2019): Added CREATE2, shift opcodes
//! - **ISTANBUL** (December 2019): Added CHAINID, SELFBALANCE
//! - **BERLIN** (April 2021): Gas cost changes for cold/warm access
//! - **LONDON** (August 2021): EIP-1559 fee market reform
//! - **MERGE** (September 2022): Proof of Stake transition
//! - **SHANGHAI** (April 2023): Added PUSH0 opcode
//! - **CANCUN** (March 2024): Proto-danksharding with blobs
//! - **PRAGUE** (May 2025): BLS12-381 precompiles, EIP-7702
//! - **OSAKA** (TBD): ModExp improvements

/// Ethereum hardfork identifiers.
///
/// Hardforks represent protocol upgrades that change EVM behavior,
/// gas costs, or add new features. Each hardfork builds upon the
/// previous ones, maintaining backward compatibility while adding
/// improvements.
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
    /// Prague-Electra fork (May 2025).
    /// EIP-2537: BLS12-381 precompiles.
    /// EIP-7702: Set EOA account code for one transaction.
    /// EIP-7251: Increase max effective balance.
    /// EIP-7002: Execution layer triggerable exits.
    PRAGUE,
    /// Osaka fork (TBD).
    /// EIP-7883: ModExp gas increase.
    /// EIP-7823: ModExp upper bounds.
    /// EIP-7825: Transaction gas limit cap.
    /// EIP-7934: Block RLP limit.
    OSAKA,

    /// Default hardfork for new chains.
    /// Set to latest stable fork (currently PRAGUE).
    pub const DEFAULT = Hardfork.PRAGUE;

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

    /// Parse hardfork from string name (case-insensitive)
    /// Supports both standard names and common variations
    pub fn fromString(name: []const u8) ?Hardfork {
        // Handle comparisons like ">=Cancun" or ">Berlin"
        var clean_name = name;
        if (name.len > 0 and (name[0] == '>' or name[0] == '<')) {
            var start: usize = 1;
            if (name.len > 1 and name[1] == '=') {
                start = 2;
            }
            clean_name = name[start..];
        }

        // Case-insensitive comparison
        if (std.ascii.eqlIgnoreCase(clean_name, "Frontier")) return .FRONTIER;
        if (std.ascii.eqlIgnoreCase(clean_name, "Homestead")) return .HOMESTEAD;
        if (std.ascii.eqlIgnoreCase(clean_name, "DAO")) return .DAO;
        if (std.ascii.eqlIgnoreCase(clean_name, "TangerineWhistle")) return .TANGERINE_WHISTLE;
        if (std.ascii.eqlIgnoreCase(clean_name, "SpuriousDragon")) return .SPURIOUS_DRAGON;
        if (std.ascii.eqlIgnoreCase(clean_name, "Byzantium")) return .BYZANTIUM;
        if (std.ascii.eqlIgnoreCase(clean_name, "Constantinople")) return .CONSTANTINOPLE;
        if (std.ascii.eqlIgnoreCase(clean_name, "Petersburg")) return .PETERSBURG;
        if (std.ascii.eqlIgnoreCase(clean_name, "ConstantinopleFix")) return .PETERSBURG; // Alias for Petersburg
        if (std.ascii.eqlIgnoreCase(clean_name, "Istanbul")) return .ISTANBUL;
        if (std.ascii.eqlIgnoreCase(clean_name, "MuirGlacier")) return .MUIR_GLACIER;
        if (std.ascii.eqlIgnoreCase(clean_name, "Berlin")) return .BERLIN;
        if (std.ascii.eqlIgnoreCase(clean_name, "London")) return .LONDON;
        if (std.ascii.eqlIgnoreCase(clean_name, "ArrowGlacier")) return .ARROW_GLACIER;
        if (std.ascii.eqlIgnoreCase(clean_name, "GrayGlacier")) return .GRAY_GLACIER;
        if (std.ascii.eqlIgnoreCase(clean_name, "Merge")) return .MERGE;
        if (std.ascii.eqlIgnoreCase(clean_name, "Paris")) return .MERGE; // Alias for Merge
        if (std.ascii.eqlIgnoreCase(clean_name, "Shanghai")) return .SHANGHAI;
        if (std.ascii.eqlIgnoreCase(clean_name, "Cancun")) return .CANCUN;
        if (std.ascii.eqlIgnoreCase(clean_name, "Prague")) return .PRAGUE;
        if (std.ascii.eqlIgnoreCase(clean_name, "Osaka")) return .OSAKA;

        return null;
    }
};

/// Represents a fork transition (e.g., ShanghaiToCancunAtTime15k)
pub const ForkTransition = struct {
    from_fork: Hardfork,
    to_fork: Hardfork,
    at_block: ?u64,
    at_timestamp: ?u64,

    /// Parse a transition fork name like "ShanghaiToCancunAtTime15k" or "BerlinToLondonAt5"
    pub fn fromString(name: []const u8) ?ForkTransition {
        // Look for "To" pattern
        const to_index = std.mem.indexOf(u8, name, "To") orelse return null;

        // Extract "from" fork
        const from_str = name[0..to_index];
        const from_fork = Hardfork.fromString(from_str) orelse return null;

        // Find "At" pattern
        const at_index = std.mem.indexOf(u8, name[to_index..], "At") orelse return null;
        const at_pos = to_index + at_index;

        // Extract "to" fork
        const to_str = name[to_index + 2 .. at_pos];
        const to_fork = Hardfork.fromString(to_str) orelse return null;

        // Parse the transition point
        const transition_str = name[at_pos + 2 ..];

        // Check if it's a timestamp (contains "Time") or block number
        if (std.mem.indexOf(u8, transition_str, "Time") != null) {
            // Extract number from "Time15k" -> "15k"
            const time_index = std.mem.indexOf(u8, transition_str, "Time") orelse return null;
            const num_str = transition_str[time_index + 4 ..];
            const timestamp = parseNumber(num_str) orelse return null;
            return ForkTransition{
                .from_fork = from_fork,
                .to_fork = to_fork,
                .at_block = null,
                .at_timestamp = timestamp,
            };
        } else {
            // It's a block number
            const block = parseNumber(transition_str) orelse return null;
            return ForkTransition{
                .from_fork = from_fork,
                .to_fork = to_fork,
                .at_block = block,
                .at_timestamp = null,
            };
        }
    }

    /// Get the active fork at the given block number and timestamp
    pub fn getActiveFork(self: ForkTransition, block_number: u64, timestamp: u64) Hardfork {
        if (self.at_block) |at_block| {
            return if (block_number >= at_block) self.to_fork else self.from_fork;
        } else if (self.at_timestamp) |at_timestamp| {
            return if (timestamp >= at_timestamp) self.to_fork else self.from_fork;
        }
        return self.to_fork;
    }
};

/// Parse a number from a string like "15k" or "5"
fn parseNumber(str: []const u8) ?u64 {
    if (str.len == 0) return null;

    // Check for 'k' suffix (multiply by 1000)
    if (str[str.len - 1] == 'k') {
        const num_str = str[0 .. str.len - 1];
        const base = std.fmt.parseInt(u64, num_str, 10) catch return null;
        return base * 1000;
    }

    return std.fmt.parseInt(u64, str, 10) catch null;
}

// Tests
const std = @import("std");
const testing = std.testing;

test "Hardfork version comparison" {
    const frontier = Hardfork.FRONTIER;
    const homestead = Hardfork.HOMESTEAD;
    const cancun = Hardfork.CANCUN;

    try testing.expect(frontier.isBefore(homestead));
    try testing.expect(homestead.isAtLeast(frontier));
    try testing.expect(cancun.isAtLeast(homestead));
    try testing.expect(!cancun.isBefore(homestead));
}

test "Hardfork fromString" {
    try testing.expectEqual(Hardfork.FRONTIER, Hardfork.fromString("Frontier").?);
    try testing.expectEqual(Hardfork.CANCUN, Hardfork.fromString("cancun").?);
    try testing.expectEqual(Hardfork.SHANGHAI, Hardfork.fromString("Shanghai").?);
    try testing.expectEqual(Hardfork.MERGE, Hardfork.fromString("Paris").?); // Alias
    try testing.expectEqual(Hardfork.PETERSBURG, Hardfork.fromString("ConstantinopleFix").?); // Alias

    // With comparison operators
    try testing.expectEqual(Hardfork.CANCUN, Hardfork.fromString(">=Cancun").?);
    try testing.expectEqual(Hardfork.BERLIN, Hardfork.fromString(">Berlin").?);

    // Invalid
    try testing.expectEqual(@as(?Hardfork, null), Hardfork.fromString("InvalidFork"));
}

test "ForkTransition fromString with block number" {
    const transition = ForkTransition.fromString("BerlinToLondonAt12965000").?;

    try testing.expectEqual(Hardfork.BERLIN, transition.from_fork);
    try testing.expectEqual(Hardfork.LONDON, transition.to_fork);
    try testing.expectEqual(@as(?u64, 12965000), transition.at_block);
    try testing.expectEqual(@as(?u64, null), transition.at_timestamp);
}

test "ForkTransition fromString with timestamp" {
    const transition = ForkTransition.fromString("ShanghaiToCancunAtTime15k").?;

    try testing.expectEqual(Hardfork.SHANGHAI, transition.from_fork);
    try testing.expectEqual(Hardfork.CANCUN, transition.to_fork);
    try testing.expectEqual(@as(?u64, null), transition.at_block);
    try testing.expectEqual(@as(?u64, 15000), transition.at_timestamp);
}

test "ForkTransition getActiveFork by block" {
    const transition = ForkTransition{
        .from_fork = .BERLIN,
        .to_fork = .LONDON,
        .at_block = 12965000,
        .at_timestamp = null,
    };

    try testing.expectEqual(Hardfork.BERLIN, transition.getActiveFork(12964999, 0));
    try testing.expectEqual(Hardfork.LONDON, transition.getActiveFork(12965000, 0));
    try testing.expectEqual(Hardfork.LONDON, transition.getActiveFork(12965001, 0));
}

test "ForkTransition getActiveFork by timestamp" {
    const transition = ForkTransition{
        .from_fork = .SHANGHAI,
        .to_fork = .CANCUN,
        .at_block = null,
        .at_timestamp = 15000,
    };

    try testing.expectEqual(Hardfork.SHANGHAI, transition.getActiveFork(0, 14999));
    try testing.expectEqual(Hardfork.CANCUN, transition.getActiveFork(0, 15000));
    try testing.expectEqual(Hardfork.CANCUN, transition.getActiveFork(0, 15001));
}

test "parseNumber" {
    try testing.expectEqual(@as(?u64, 42), parseNumber("42"));
    try testing.expectEqual(@as(?u64, 15000), parseNumber("15k"));
    try testing.expectEqual(@as(?u64, 1000), parseNumber("1k"));
    try testing.expectEqual(@as(?u64, null), parseNumber(""));
    try testing.expectEqual(@as(?u64, null), parseNumber("invalid"));
}

test "Hardfork DEFAULT constant" {
    try testing.expectEqual(Hardfork.PRAGUE, Hardfork.DEFAULT);
}
