//! EIP Activation and Feature Flags
//!
//! This module provides comprehensive EIP (Ethereum Improvement Proposal) activation
//! tracking and hardfork-specific behavior configuration. It consolidates all EIP logic
//! for gas costs, opcode availability, and protocol-level features.
//!
//! ## Usage
//!
//! ### Basic EIP Checking
//! ```zig
//! const primitives = @import("primitives");
//! const Eips = primitives.Eips;
//!
//! const eips = Eips{ .hardfork = .CANCUN };
//! if (eips.is_eip_active(4844)) {
//!     // Blob transactions are supported
//! }
//! ```
//!
//! ### EIP Overrides for Testing
//! ```zig
//! const eips = Eips{
//!     .hardfork = .LONDON,
//!     .overrides = &[_]EipOverride{
//!         .{ .eip = 3855, .enabled = true },  // Enable PUSH0 early
//!         .{ .eip = 3651, .enabled = true },  // Enable warm coinbase
//!     },
//! };
//! ```
//!
//! ### Gas Cost Calculations
//! ```zig
//! const cost = eips.sstore_gas_cost(current, new, original, is_cold);
//! const refund_cap = eips.eip_3529_gas_refund_cap(gas_used, refund_counter);
//! ```

const primitives = @import("../root.zig");
const std = @import("std");

pub const Hardfork = primitives.Hardfork.Hardfork;

/// EIP Override entry - allows enabling/disabling specific EIPs
pub const EipOverride = struct {
    eip: u16,
    enabled: bool,
};

/// EIPs configuration with hardfork-specific behavior
///
/// This struct consolidates all EIP-specific logic for the EVM, including:
/// - EIP activation tracking per hardfork
/// - Gas cost calculations based on active EIPs
/// - Opcode availability checks
/// - Protocol-level feature flags
pub const Eips = struct {
    const Self = @This();

    hardfork: Hardfork,

    /// Overrides for specific EIPs - applied on top of the base hardfork
    /// Use this to enable future EIPs or disable existing ones for testing
    overrides: []const EipOverride = &.{},

    // ============================================================================
    // EIP Availability Queries
    // ============================================================================

    /// EIP-7702: Set EOA account code (Prague)
    /// Allows EOAs to temporarily execute smart contract code for one transaction
    pub fn eip_7702_eoa_code_enabled(self: Self) bool {
        return self.is_eip_active(7702);
    }

    /// EIP-2537: BLS12-381 precompile operations (Prague)
    /// Adds precompiled contracts for BLS12-381 curve operations
    pub fn eip_2537_bls_precompiles_enabled(self: Self) bool {
        return self.is_eip_active(2537);
    }

    /// EIP-2935: Serve historical block hashes from state (Prague)
    /// Stores historical block hashes in the state for easier access
    pub fn eip_2935_historical_block_hashes_enabled(self: Self) bool {
        return self.is_eip_active(2935);
    }

    /// EIP-6110: Supply validator deposits on chain (Prague)
    /// Validator deposits handled directly on execution layer
    pub fn eip_6110_validator_deposits_enabled(self: Self) bool {
        return self.is_eip_active(6110);
    }

    /// EIP-7002: Execution layer triggerable exits (Prague)
    /// Allows triggering validator exits from execution layer
    pub fn eip_7002_validator_exits_enabled(self: Self) bool {
        return self.is_eip_active(7002);
    }

    /// EIP-1559: Fee market change for ETH 1.0 chain
    /// London hardfork introduced base fee per gas
    pub fn eip_1559_is_enabled(self: Self) bool {
        return self.is_eip_active(1559);
    }

    /// EIP-3198: BASEFEE opcode
    /// London hardfork added BASEFEE opcode
    pub fn eip_3198_basefee_opcode_enabled(self: Self) bool {
        return self.is_eip_active(3198);
    }

    /// EIP-1153: Transient storage opcodes (TLOAD/TSTORE)
    /// Cancun hardfork added transient storage
    pub fn eip_1153_transient_storage_enabled(self: Self) bool {
        return self.is_eip_active(1153);
    }

    /// EIP-4844: Shard Blob Transactions
    /// Cancun hardfork introduced blob transactions
    pub fn eip_4844_blob_transactions_enabled(self: Self) bool {
        return self.is_eip_active(4844);
    }

    /// EIP-6780: SELFDESTRUCT only in same transaction
    /// Cancun hardfork restricted SELFDESTRUCT behavior
    pub fn eip_6780_selfdestruct_same_transaction_only(self: Self) bool {
        return self.is_eip_active(6780);
    }

    /// EIP-3855: PUSH0 instruction
    /// Shanghai hardfork added PUSH0 instruction
    pub fn eip_3855_push0_enabled(self: Self) bool {
        return self.is_eip_active(3855);
    }

    /// EIP-1153: Check if transient storage is available
    pub fn eip_1153_has_transient_storage(self: Self) bool {
        return self.is_eip_active(1153);
    }

    /// EIP-3855: Check if PUSH0 opcode is available
    pub fn eip_3855_has_push0(self: Self) bool {
        return self.is_eip_active(3855);
    }

    /// EIP-3198: Check if BASEFEE opcode is available
    pub fn eip_3198_has_basefee(self: Self) bool {
        return self.is_eip_active(3198);
    }

    /// EIP-5656: Check if MCOPY opcode is available
    pub fn eip_5656_has_mcopy(self: Self) bool {
        return self.is_eip_active(5656);
    }

    /// EIP-4844: Check if blob transactions are supported
    pub fn eip_4844_has_blob_transactions(self: Self) bool {
        return self.is_eip_active(4844);
    }

    /// EIP-4399: Check if PREVRANDAO should be used instead of DIFFICULTY
    pub fn eip_4399_use_prevrandao(self: Self) bool {
        return self.is_eip_active(4399);
    }

    /// EIP-3541: Check if bytecode starting with 0xEF should be rejected
    pub fn eip_3541_should_reject_ef_bytecode(self: Self) bool {
        return self.is_eip_active(3541);
    }

    /// EIP-3541: Should reject bytecode starting with 0xEF
    pub fn eip_3541_should_reject_create_with_ef_bytecode(self: Self, bytecode: []const u8) bool {
        if (!self.is_eip_active(3541)) return false;
        return bytecode.len > 0 and bytecode[0] == 0xEF;
    }

    // ============================================================================
    // Gas Cost Functions
    // ============================================================================

    /// EIP-3529: Reduction in refunds & gas refunds for SELFDESTRUCT
    /// London hardfork changed gas refund behavior
    /// - Sets refund counter to gas_used / 5
    /// - No longer fully refunds SELFDESTRUCT
    /// Returns the refund amount to be applied
    pub fn eip_3529_gas_refund_cap(self: Self, gas_used: u64, refund_counter: u64) u64 {
        if (!self.hardfork.isAtLeast(.LONDON)) return @min(refund_counter, gas_used / 2);
        return @min(refund_counter, gas_used / 5);
    }

    /// EIP-2929: Gas cost increases for state access opcodes
    /// Berlin hardfork introduced access lists and changed gas costs
    pub fn eip_2929_cold_sload_cost(self: Self) u64 {
        if (!self.hardfork.isAtLeast(.BERLIN)) return 200;
        return 2100;
    }

    /// EIP-2929: Warm storage access cost
    pub fn eip_2929_warm_storage_read_cost(self: Self) u64 {
        if (!self.hardfork.isAtLeast(.BERLIN)) return 200;
        return 100;
    }

    /// EIP-2929: Cold account access cost
    pub fn eip_2929_cold_account_access_cost(self: Self) u64 {
        if (!self.hardfork.isAtLeast(.BERLIN)) return 700;
        return 2600;
    }

    /// EIP-2929: Warm account access cost
    pub fn eip_2929_warm_account_access_cost(self: Self) u64 {
        if (!self.hardfork.isAtLeast(.BERLIN)) return 700;
        return 100;
    }

    /// EIP-160: Get gas cost for EXP opcode exponent byte
    pub fn eip_160_exp_byte_gas_cost(self: Self) u64 {
        if (!self.is_eip_active(160)) return 10; // Pre-EIP-160
        return 50; // Post-EIP-160
    }

    /// EIP-2028: Get calldata gas costs (reduced non-zero byte cost)
    pub fn eip_2028_calldata_gas_cost(self: Self, is_zero: bool) u64 {
        if (is_zero) return 4;
        if (!self.is_eip_active(2028)) return 68;
        return 16; // Post-Istanbul
    }

    /// Get CREATE opcode gas cost
    pub fn create_gas_cost(_: Self) u64 {
        return 32000;
    }

    /// EIP-7702: Base gas cost per authorization
    /// Prague hardfork introduced authorization lists
    pub fn eip_7702_per_auth_base_cost(self: Self) i64 {
        if (!self.hardfork.isAtLeast(.PRAGUE)) return 0;
        return 12500;
    }

    /// EIP-7702: Additional gas cost for empty account
    /// Prague hardfork introduced authorization lists
    pub fn eip_7702_per_empty_account_cost(self: Self) i64 {
        if (!self.hardfork.isAtLeast(.PRAGUE)) return 0;
        return 25000;
    }

    // ============================================================================
    // Code Size and Initcode Limits
    // ============================================================================

    /// EIP-170: Get maximum contract code size based on hardfork
    pub fn eip_170_max_code_size(self: Self) u32 {
        // EIP-170: Contract code size limit (Spurious Dragon)
        if (!self.is_eip_active(170)) return 0xFFFFFF; // No limit
        return 0x6000; // 24KB limit
    }

    /// EIP-3860: Initcode size limit
    /// Pre-Shanghai: 24KB limit (EIP-170)
    /// Post-Shanghai: 48KB limit
    pub fn size_limit(self: Self) u64 {
        if (self.is_eip_active(3860)) return 0xC000;
        return 0x6000;
    }

    /// EIP-3860: Initcode gas cost per word
    /// Pre-Shanghai: no additional cost
    /// Post-Shanghai: 2 gas per word
    pub fn word_cost(self: Self) u64 {
        if (self.is_eip_active(3860)) return 2;
        return 0;
    }

    // ============================================================================
    // SSTORE Gas Cost Calculation
    // ============================================================================

    /// Get SSTORE gas costs based on hardfork and state
    ///
    /// Implements:
    /// - Pre-Constantinople: Simple gas model (Frontier-Byzantium)
    /// - EIP-1283 (Constantinople): Net gas metering for SSTORE
    /// - EIP-2200 (Istanbul): Reentrancy protection (2300 gas minimum)
    /// - EIP-2929 (Berlin): Cold storage access costs
    /// - EIP-3529 (London): Reduced gas refunds
    ///
    /// Parameters:
    /// - current: Current value in storage slot
    /// - new: New value being written
    /// - original: Original value at start of transaction
    /// - is_cold: Whether this is a cold storage access (EIP-2929)
    ///
    /// Returns: SstoreGasCost with gas cost and refund amount
    pub fn sstore_gas_cost(self: Self, current: u256, new: u256, original: u256, is_cold: bool) SstoreGasCost {
        // Pre-Constantinople (Frontier through Byzantium): Simple model
        if (self.hardfork.isBefore(.CONSTANTINOPLE)) {
            if (current == 0 and new != 0) {
                // Setting from zero to non-zero (storage expansion)
                return .{ .gas = 20000, .refund = 0 };
            }
            if (current != 0 and new == 0) {
                // Clearing storage (non-zero to zero)
                return .{ .gas = 5000, .refund = 15000 };
            }
            // Modifying existing non-zero value
            return .{ .gas = 5000, .refund = 0 };
        }

        // EIP-1283/EIP-2200 (Constantinople/Istanbul+): Net gas metering
        var gas: u64 = 0;
        var refund: u64 = 0;

        // EIP-2929 (Berlin+): Add cold access cost if applicable
        if (self.hardfork.isAtLeast(.BERLIN) and is_cold) {
            gas += 2100; // Cold SLOAD cost
        }

        // EIP-1283/EIP-2200: Net gas metering based on state transitions
        if (current == new) {
            // No-op: storing same value
            gas += if (self.hardfork.isAtLeast(.BERLIN)) 100 else 200;
        } else if (original == current) {
            // First time writing to this slot in the current transaction
            if (original == 0) {
                // Setting a previously empty slot (most expensive)
                gas += 20000;
            } else {
                // Modifying an existing non-zero value
                gas += 5000;

                // Refund if clearing the slot
                if (new == 0) {
                    // EIP-3529 (London+): Reduced refund
                    refund = if (self.hardfork.isAtLeast(.LONDON)) 4800 else 15000;
                }
            }
        } else {
            // Slot was already modified in this transaction (dirty write)
            gas += if (self.hardfork.isAtLeast(.BERLIN)) 100 else 200;

            // EIP-1283/EIP-2200: Complex refund logic for reverting changes
            if (original != 0) {
                if (current == 0) {
                    // Previously cleared in this tx, now setting again
                    // Remove the refund we gave earlier
                    const clear_refund = if (self.hardfork.isAtLeast(.LONDON)) @as(i64, -4800) else @as(i64, -15000);
                    refund = @bitCast(@as(i64, @bitCast(refund)) + clear_refund);
                } else if (new == 0) {
                    // Clearing slot that was modified but not cleared before
                    refund += if (self.hardfork.isAtLeast(.LONDON)) 4800 else 15000;
                }
            }

            if (original == new) {
                // Reverting to original value
                if (original == 0) {
                    // Reverting to original zero - refund the set cost
                    refund += if (self.hardfork.isAtLeast(.ISTANBUL)) 19900 else 19800;
                } else {
                    // Reverting to original non-zero - refund the reset cost
                    refund += if (self.hardfork.isAtLeast(.ISTANBUL)) 4900 else 4800;
                }
            }
        }

        return .{ .gas = gas, .refund = refund };
    }

    pub const SstoreGasCost = struct {
        gas: u64,
        refund: u64,
    };

    /// EIP-3529: Apply gas refund after transaction
    pub fn eip_3529_apply_gas_refund(self: Self, initial_gas: u64, gas_left: u64, gas_refund_counter: u64) u64 {
        const gas_used = initial_gas - gas_left;
        const capped_refund = self.eip_3529_gas_refund_cap(gas_used, gas_refund_counter);
        return @min(initial_gas, gas_left + capped_refund);
    }

    // ============================================================================
    // EIP Activation Tracking
    // ============================================================================

    /// Get all active EIPs for the current hardfork
    pub fn get_active_eips(self: Self) []const u16 {
        return switch (self.hardfork) {
            .FRONTIER => &[_]u16{},
            .HOMESTEAD => &[_]u16{ 2, 7, 8 },
            .DAO => &[_]u16{ 2, 7, 8 }, // DAO fork had no EVM changes
            .TANGERINE_WHISTLE => &[_]u16{ 2, 7, 8, 150 },
            .SPURIOUS_DRAGON => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170 },
            .BYZANTIUM => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658 },
            .CONSTANTINOPLE => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283 },
            .PETERSBURG => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283 },
            .ISTANBUL => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200 },
            .MUIR_GLACIER => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200 },
            .BERLIN => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930 },
            .LONDON => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930, 1559, 3198, 3529, 3541 },
            .ARROW_GLACIER => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930, 1559, 3198, 3529, 3541, 4345 },
            .GRAY_GLACIER => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930, 1559, 3198, 3529, 3541, 4345, 5133 },
            .MERGE => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930, 1559, 3198, 3529, 3541, 4345, 5133, 3675, 4399 },
            .SHANGHAI => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930, 1559, 3198, 3529, 3541, 4345, 5133, 3675, 4399, 3651, 3855, 3860, 4895 },
            .CANCUN => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930, 1559, 3198, 3529, 3541, 4345, 5133, 3675, 4399, 3651, 3855, 3860, 4895, 1153, 4788, 4844, 5656, 6780, 7516 },
            .PRAGUE => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930, 1559, 3198, 3529, 3541, 4345, 5133, 3675, 4399, 3651, 3855, 3860, 4895, 1153, 4788, 4844, 5656, 6780, 7516, 2537, 2935, 3074, 6110, 7002, 7702 },
            .OSAKA => &[_]u16{ 2, 7, 8, 150, 155, 160, 161, 170, 100, 140, 196, 197, 198, 211, 214, 649, 658, 145, 1014, 1052, 1283, 152, 1108, 1344, 1884, 2028, 2200, 2565, 2718, 2929, 2930, 1559, 3198, 3529, 3541, 4345, 5133, 3675, 4399, 3651, 3855, 3860, 4895, 1153, 4788, 4844, 5656, 6780, 7516, 2537, 2935, 6110, 7002, 7702, 7883, 7823, 7825, 7934 },
        };
    }

    /// Check if a specific EIP is active
    pub fn is_eip_active(self: Self, eip: u16) bool {
        // First check overrides
        for (self.overrides) |override| {
            if (override.eip == eip) return override.enabled;
        }

        // Then check base hardfork
        const active_eips = self.get_active_eips();
        for (active_eips) |active_eip| if (active_eip == eip) return true;
        return false;
    }
};

// ============================================================================
// Tests
// ============================================================================

test "eip_3529_gas_refund_cap pre-London" {
    const eips = Eips{ .hardfork = Hardfork.ISTANBUL };

    // Pre-London: refund up to half of gas used
    try std.testing.expectEqual(@as(u64, 50), eips.eip_3529_gas_refund_cap(100, 100));
    try std.testing.expectEqual(@as(u64, 50), eips.eip_3529_gas_refund_cap(100, 60));
    try std.testing.expectEqual(@as(u64, 25), eips.eip_3529_gas_refund_cap(100, 25));
}

test "eip_3529_gas_refund_cap post-London" {
    const eips = Eips{ .hardfork = Hardfork.LONDON };

    // Post-London: refund up to one fifth of gas used
    try std.testing.expectEqual(@as(u64, 20), eips.eip_3529_gas_refund_cap(100, 100));
    try std.testing.expectEqual(@as(u64, 20), eips.eip_3529_gas_refund_cap(100, 60));
    try std.testing.expectEqual(@as(u64, 10), eips.eip_3529_gas_refund_cap(100, 10));
}

test "eip_2929_storage_costs pre-Berlin" {
    const eips = Eips{ .hardfork = Hardfork.ISTANBUL };

    try std.testing.expectEqual(@as(u64, 200), eips.eip_2929_cold_sload_cost());
    try std.testing.expectEqual(@as(u64, 200), eips.eip_2929_warm_storage_read_cost());
    try std.testing.expectEqual(@as(u64, 700), eips.eip_2929_cold_account_access_cost());
    try std.testing.expectEqual(@as(u64, 700), eips.eip_2929_warm_account_access_cost());
}

test "eip_2929_storage_costs post-Berlin" {
    const eips = Eips{ .hardfork = Hardfork.BERLIN };

    try std.testing.expectEqual(@as(u64, 2100), eips.eip_2929_cold_sload_cost());
    try std.testing.expectEqual(@as(u64, 100), eips.eip_2929_warm_storage_read_cost());
    try std.testing.expectEqual(@as(u64, 2600), eips.eip_2929_cold_account_access_cost());
    try std.testing.expectEqual(@as(u64, 100), eips.eip_2929_warm_account_access_cost());
}

test "is_eip_active progression" {
    const frontier = Eips{ .hardfork = Hardfork.FRONTIER };
    const istanbul = Eips{ .hardfork = Hardfork.ISTANBUL };
    const berlin = Eips{ .hardfork = Hardfork.BERLIN };
    const london = Eips{ .hardfork = Hardfork.LONDON };
    const shanghai = Eips{ .hardfork = Hardfork.SHANGHAI };
    const cancun = Eips{ .hardfork = Hardfork.CANCUN };
    const prague = Eips{ .hardfork = Hardfork.PRAGUE };

    // EIP-2929 should be active from Berlin onwards
    try std.testing.expect(!istanbul.is_eip_active(2929));
    try std.testing.expect(berlin.is_eip_active(2929));
    try std.testing.expect(london.is_eip_active(2929));
    try std.testing.expect(shanghai.is_eip_active(2929));
    try std.testing.expect(cancun.is_eip_active(2929));
    try std.testing.expect(prague.is_eip_active(2929));

    // EIP-1559 should be active from London onwards
    try std.testing.expect(!berlin.is_eip_active(1559));
    try std.testing.expect(london.is_eip_active(1559));
    try std.testing.expect(shanghai.is_eip_active(1559));
    try std.testing.expect(cancun.is_eip_active(1559));
    try std.testing.expect(prague.is_eip_active(1559));

    // EIP-7702 should only be active from Prague onwards
    try std.testing.expect(!cancun.is_eip_active(7702));
    try std.testing.expect(prague.is_eip_active(7702));

    // EIP-170 should be active from Spurious Dragon onwards
    try std.testing.expect(!frontier.is_eip_active(170));
}

test "sstore_gas_cost pre-Constantinople" {
    const frontier = Eips{ .hardfork = Hardfork.FRONTIER };

    // Set from zero to non-zero
    var cost = frontier.sstore_gas_cost(0, 1, 0, false);
    try std.testing.expectEqual(@as(u64, 20000), cost.gas);
    try std.testing.expectEqual(@as(u64, 0), cost.refund);

    // Clear from non-zero to zero
    cost = frontier.sstore_gas_cost(1, 0, 1, false);
    try std.testing.expectEqual(@as(u64, 5000), cost.gas);
    try std.testing.expectEqual(@as(u64, 15000), cost.refund);

    // Modify non-zero value
    cost = frontier.sstore_gas_cost(1, 2, 1, false);
    try std.testing.expectEqual(@as(u64, 5000), cost.gas);
    try std.testing.expectEqual(@as(u64, 0), cost.refund);
}

test "sstore_gas_cost Berlin cold access" {
    const berlin = Eips{ .hardfork = Hardfork.BERLIN };

    // No-op with cold access
    var cost = berlin.sstore_gas_cost(42, 42, 42, true);
    try std.testing.expectEqual(@as(u64, 2200), cost.gas); // 2100 + 100

    // Set from zero with cold access
    cost = berlin.sstore_gas_cost(0, 1, 0, true);
    try std.testing.expectEqual(@as(u64, 22100), cost.gas); // 2100 + 20000
}

test "EIP overrides enable future EIPs" {
    const london_with_push0 = Eips{
        .hardfork = Hardfork.LONDON,
        .overrides = &[_]EipOverride{
            .{ .eip = 3855, .enabled = true }, // PUSH0
        },
    };

    const plain_london = Eips{ .hardfork = Hardfork.LONDON };
    try std.testing.expect(!plain_london.is_eip_active(3855));
    try std.testing.expect(london_with_push0.is_eip_active(3855));
}

test "EIP overrides disable existing EIPs" {
    const cancun_restricted = Eips{
        .hardfork = Hardfork.CANCUN,
        .overrides = &[_]EipOverride{
            .{ .eip = 4844, .enabled = false }, // Disable blob transactions
        },
    };

    const plain_cancun = Eips{ .hardfork = Hardfork.CANCUN };
    try std.testing.expect(plain_cancun.is_eip_active(4844));
    try std.testing.expect(!cancun_restricted.is_eip_active(4844));
}
