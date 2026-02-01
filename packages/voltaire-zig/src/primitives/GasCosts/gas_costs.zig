//! GasCosts - detailed gas cost breakdown for transactions
//!
//! Represents itemized gas costs for analysis and debugging.
//! Useful for understanding where gas is being spent.

const std = @import("std");
const testing = std.testing;

/// GasCosts type - detailed breakdown of gas consumption
pub const GasCosts = struct {
    /// Base transaction cost (21000 for regular, 53000 for create)
    base: u64 = 0,
    /// Calldata cost (4 per zero byte, 16 per non-zero)
    calldata: u64 = 0,
    /// Execution cost (opcodes)
    execution: u64 = 0,
    /// Memory expansion cost
    memory: u64 = 0,
    /// Storage read/write cost
    storage: u64 = 0,
    /// Logging (events) cost
    logs: u64 = 0,
    /// Access list cost (EIP-2930)
    access_list: u64 = 0,
    /// Blob gas cost (EIP-4844, separate from execution gas)
    blob: u64 = 0,

    /// Create empty GasCosts
    pub fn init() GasCosts {
        return .{};
    }

    /// Create GasCosts from individual components
    pub fn from(
        base: u64,
        calldata: u64,
        execution: u64,
        memory: u64,
        storage: u64,
        logs: u64,
    ) GasCosts {
        return .{
            .base = base,
            .calldata = calldata,
            .execution = execution,
            .memory = memory,
            .storage = storage,
            .logs = logs,
        };
    }

    /// Get total gas cost
    pub fn total(self: GasCosts) u64 {
        return self.base +
            self.calldata +
            self.execution +
            self.memory +
            self.storage +
            self.logs +
            self.access_list;
        // Note: blob gas is separate and not included in execution gas total
    }

    /// Get total including blob gas
    pub fn totalWithBlob(self: GasCosts) u64 {
        return self.total() + self.blob;
    }

    /// Add another GasCosts breakdown
    pub fn add(self: GasCosts, other: GasCosts) GasCosts {
        return .{
            .base = self.base + other.base,
            .calldata = self.calldata + other.calldata,
            .execution = self.execution + other.execution,
            .memory = self.memory + other.memory,
            .storage = self.storage + other.storage,
            .logs = self.logs + other.logs,
            .access_list = self.access_list + other.access_list,
            .blob = self.blob + other.blob,
        };
    }

    /// Check equality
    pub fn equals(self: GasCosts, other: GasCosts) bool {
        return self.base == other.base and
            self.calldata == other.calldata and
            self.execution == other.execution and
            self.memory == other.memory and
            self.storage == other.storage and
            self.logs == other.logs and
            self.access_list == other.access_list and
            self.blob == other.blob;
    }

    /// Calculate calldata cost from raw bytes
    pub fn calldataCost(data: []const u8) u64 {
        var cost: u64 = 0;
        for (data) |byte| {
            if (byte == 0) {
                cost += 4; // TxDataZeroGas
            } else {
                cost += 16; // TxDataNonZeroGas
            }
        }
        return cost;
    }

    /// Calculate memory expansion cost
    /// Formula: 3 * words + words^2 / 512
    pub fn memoryExpansionCost(current_words: u64, new_words: u64) u64 {
        if (new_words <= current_words) return 0;

        const current_cost = 3 * current_words + (current_words * current_words) / 512;
        const new_cost = 3 * new_words + (new_words * new_words) / 512;

        return new_cost - current_cost;
    }

    /// Calculate number of 32-byte words (rounded up)
    pub fn wordCount(bytes: u64) u64 {
        return (bytes + 31) / 32;
    }

    /// Get percentage breakdown (returns array of percentages)
    pub fn percentages(self: GasCosts) struct {
        base: u8,
        calldata: u8,
        execution: u8,
        memory: u8,
        storage: u8,
        logs: u8,
        access_list: u8,
    } {
        const t = self.total();
        if (t == 0) return .{
            .base = 0,
            .calldata = 0,
            .execution = 0,
            .memory = 0,
            .storage = 0,
            .logs = 0,
            .access_list = 0,
        };

        return .{
            .base = @intCast((self.base * 100) / t),
            .calldata = @intCast((self.calldata * 100) / t),
            .execution = @intCast((self.execution * 100) / t),
            .memory = @intCast((self.memory * 100) / t),
            .storage = @intCast((self.storage * 100) / t),
            .logs = @intCast((self.logs * 100) / t),
            .access_list = @intCast((self.access_list * 100) / t),
        };
    }
};

/// Common gas cost constants
pub const Constants = struct {
    /// Base transaction cost
    pub const TX_BASE: u64 = 21000;
    /// Contract creation base cost
    pub const TX_CREATE: u64 = 53000;
    /// Zero byte in calldata
    pub const CALLDATA_ZERO: u64 = 4;
    /// Non-zero byte in calldata
    pub const CALLDATA_NONZERO: u64 = 16;
    /// SLOAD (warm)
    pub const SLOAD_WARM: u64 = 100;
    /// SLOAD (cold)
    pub const SLOAD_COLD: u64 = 2100;
    /// SSTORE set (zero to non-zero)
    pub const SSTORE_SET: u64 = 20000;
    /// SSTORE reset (non-zero to non-zero)
    pub const SSTORE_RESET: u64 = 5000;
    /// SSTORE clear refund
    pub const SSTORE_CLEAR_REFUND: u64 = 4800;
    /// LOG base cost
    pub const LOG_BASE: u64 = 375;
    /// LOG per topic
    pub const LOG_TOPIC: u64 = 375;
    /// LOG per byte
    pub const LOG_BYTE: u64 = 8;
    /// Memory per word
    pub const MEMORY_WORD: u64 = 3;
    /// KECCAK256 base
    pub const KECCAK256_BASE: u64 = 30;
    /// KECCAK256 per word
    pub const KECCAK256_WORD: u64 = 6;
    /// Cold account access
    pub const COLD_ACCOUNT: u64 = 2600;
    /// Warm account access
    pub const WARM_ACCOUNT: u64 = 100;
    /// Call value transfer
    pub const CALL_VALUE: u64 = 9000;
    /// Call new account
    pub const CALL_NEW_ACCOUNT: u64 = 25000;
    /// EIP-2930 address cost
    pub const ACCESS_LIST_ADDRESS: u64 = 2400;
    /// EIP-2930 storage key cost
    pub const ACCESS_LIST_STORAGE_KEY: u64 = 1900;
};

// Tests
test "GasCosts: init and total" {
    const costs = GasCosts.init();
    try testing.expectEqual(@as(u64, 0), costs.total());
}

test "GasCosts: from components" {
    const costs = GasCosts.from(21000, 500, 30000, 100, 5000, 750);
    try testing.expectEqual(@as(u64, 57350), costs.total());
}

test "GasCosts: add" {
    const a = GasCosts.from(21000, 0, 0, 0, 0, 0);
    const b = GasCosts.from(0, 500, 1000, 100, 5000, 375);
    const result = a.add(b);

    try testing.expectEqual(@as(u64, 21000), result.base);
    try testing.expectEqual(@as(u64, 500), result.calldata);
    try testing.expectEqual(@as(u64, 1000), result.execution);
    try testing.expectEqual(@as(u64, 100), result.memory);
    try testing.expectEqual(@as(u64, 5000), result.storage);
    try testing.expectEqual(@as(u64, 375), result.logs);
    try testing.expectEqual(@as(u64, 27975), result.total());
}

test "GasCosts: equals" {
    const a = GasCosts.from(21000, 500, 1000, 100, 5000, 375);
    const b = GasCosts.from(21000, 500, 1000, 100, 5000, 375);
    const c = GasCosts.from(21000, 500, 1000, 100, 5000, 376);

    try testing.expect(a.equals(b));
    try testing.expect(!a.equals(c));
}

test "GasCosts: calldataCost" {
    // All zeros
    const zeros = [_]u8{ 0, 0, 0, 0 };
    try testing.expectEqual(@as(u64, 16), GasCosts.calldataCost(&zeros));

    // All non-zeros
    const nonzeros = [_]u8{ 1, 2, 3, 4 };
    try testing.expectEqual(@as(u64, 64), GasCosts.calldataCost(&nonzeros));

    // Mixed
    const mixed = [_]u8{ 0, 1, 0, 2 };
    try testing.expectEqual(@as(u64, 40), GasCosts.calldataCost(&mixed)); // 2*4 + 2*16

    // Empty
    const empty = [_]u8{};
    try testing.expectEqual(@as(u64, 0), GasCosts.calldataCost(&empty));
}

test "GasCosts: memoryExpansionCost" {
    // Expand from 0 to 1 word
    try testing.expectEqual(@as(u64, 3), GasCosts.memoryExpansionCost(0, 1));

    // Expand from 0 to 2 words
    try testing.expectEqual(@as(u64, 6), GasCosts.memoryExpansionCost(0, 2));

    // Expand from 1 to 2 words
    try testing.expectEqual(@as(u64, 3), GasCosts.memoryExpansionCost(1, 2));

    // No expansion (same size)
    try testing.expectEqual(@as(u64, 0), GasCosts.memoryExpansionCost(2, 2));

    // No expansion (smaller)
    try testing.expectEqual(@as(u64, 0), GasCosts.memoryExpansionCost(5, 3));

    // Large expansion (quadratic kicks in)
    // 32 words: 3*32 + 32^2/512 = 96 + 2 = 98
    try testing.expectEqual(@as(u64, 98), GasCosts.memoryExpansionCost(0, 32));
}

test "GasCosts: wordCount" {
    try testing.expectEqual(@as(u64, 0), GasCosts.wordCount(0));
    try testing.expectEqual(@as(u64, 1), GasCosts.wordCount(1));
    try testing.expectEqual(@as(u64, 1), GasCosts.wordCount(32));
    try testing.expectEqual(@as(u64, 2), GasCosts.wordCount(33));
    try testing.expectEqual(@as(u64, 2), GasCosts.wordCount(64));
    try testing.expectEqual(@as(u64, 32), GasCosts.wordCount(1024));
}

test "GasCosts: percentages" {
    // Simple transfer (100% base)
    const transfer = GasCosts.from(21000, 0, 0, 0, 0, 0);
    const pct1 = transfer.percentages();
    try testing.expectEqual(@as(u8, 100), pct1.base);

    // Complex transaction
    const complex = GasCosts.from(21000, 1000, 50000, 500, 20000, 7500);
    const pct2 = complex.percentages();
    // Total = 100000, base = 21%
    try testing.expectEqual(@as(u8, 21), pct2.base);
    try testing.expectEqual(@as(u8, 50), pct2.execution);
    try testing.expectEqual(@as(u8, 20), pct2.storage);

    // Zero total
    const empty = GasCosts.init();
    const pct3 = empty.percentages();
    try testing.expectEqual(@as(u8, 0), pct3.base);
}

test "GasCosts: totalWithBlob" {
    var costs = GasCosts.from(21000, 500, 30000, 100, 5000, 750);
    costs.blob = 131072; // 128KB blob
    try testing.expectEqual(@as(u64, 57350), costs.total());
    try testing.expectEqual(@as(u64, 188422), costs.totalWithBlob());
}

test "GasCosts: access_list" {
    var costs = GasCosts.init();
    costs.base = 21000;
    // 1 address + 2 storage keys
    costs.access_list = Constants.ACCESS_LIST_ADDRESS + 2 * Constants.ACCESS_LIST_STORAGE_KEY;
    try testing.expectEqual(@as(u64, 6200), costs.access_list);
    try testing.expectEqual(@as(u64, 27200), costs.total());
}

test "Constants: match EVM specs" {
    try testing.expectEqual(@as(u64, 21000), Constants.TX_BASE);
    try testing.expectEqual(@as(u64, 53000), Constants.TX_CREATE);
    try testing.expectEqual(@as(u64, 4), Constants.CALLDATA_ZERO);
    try testing.expectEqual(@as(u64, 16), Constants.CALLDATA_NONZERO);
    try testing.expectEqual(@as(u64, 100), Constants.SLOAD_WARM);
    try testing.expectEqual(@as(u64, 2100), Constants.SLOAD_COLD);
    try testing.expectEqual(@as(u64, 20000), Constants.SSTORE_SET);
    try testing.expectEqual(@as(u64, 5000), Constants.SSTORE_RESET);
    try testing.expectEqual(@as(u64, 4800), Constants.SSTORE_CLEAR_REFUND);
    try testing.expectEqual(@as(u64, 375), Constants.LOG_BASE);
    try testing.expectEqual(@as(u64, 375), Constants.LOG_TOPIC);
    try testing.expectEqual(@as(u64, 8), Constants.LOG_BYTE);
    try testing.expectEqual(@as(u64, 30), Constants.KECCAK256_BASE);
    try testing.expectEqual(@as(u64, 6), Constants.KECCAK256_WORD);
    try testing.expectEqual(@as(u64, 2600), Constants.COLD_ACCOUNT);
    try testing.expectEqual(@as(u64, 100), Constants.WARM_ACCOUNT);
    try testing.expectEqual(@as(u64, 9000), Constants.CALL_VALUE);
    try testing.expectEqual(@as(u64, 25000), Constants.CALL_NEW_ACCOUNT);
    try testing.expectEqual(@as(u64, 2400), Constants.ACCESS_LIST_ADDRESS);
    try testing.expectEqual(@as(u64, 1900), Constants.ACCESS_LIST_STORAGE_KEY);
}

test "GasCosts: typical ERC20 transfer" {
    // ERC20 transfer breakdown
    var costs = GasCosts.init();
    costs.base = 21000;
    // transfer(address,uint256) = 4 bytes selector + 32 bytes address + 32 bytes amount
    // Assuming ~50% zeros in the data
    costs.calldata = 34 * 4 + 34 * 16; // ~680
    costs.execution = 3000; // CALL, JUMP, etc.
    costs.storage = 2100 + 5000 * 2; // 1 SLOAD + 2 SSTORE (update balances)
    costs.logs = 375 + 3 * 375 + 32 * 8; // LOG3 with Transfer event

    const total = costs.total();
    try testing.expect(total > 21000);
    try testing.expect(total < 100000);
}
