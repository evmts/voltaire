/// Block context information for EVM execution environment
/// 
/// Provides blockchain context data needed by EVM operations:
/// - Block number, timestamp, difficulty, gas limit
/// - Coinbase address (block miner)
/// - Base fee for EIP-1559 transactions
/// - Random value for PREVRANDAO opcode
/// 
/// This data is accessed by environment opcodes like BLOCKHASH, TIMESTAMP,
/// DIFFICULTY, GASLIMIT, COINBASE, etc.
const primitives = @import("primitives");
const Address = primitives.Address.Address;

// TODO: Currently unused
/// Block information structure for Host interface
pub const BlockInfo = struct {
    /// Block number
    number: u64,
    /// Block timestamp
    timestamp: u64,
    /// Block difficulty
    difficulty: u256,
    /// Block gas limit
    gas_limit: u64,
    /// Coinbase (miner) address
    coinbase: Address,
    /// Base fee per gas (EIP-1559)
    base_fee: u256,
    /// Block hash of previous block
    prev_randao: [32]u8,
    
    /// Initialize BlockInfo with default values
    pub fn init() BlockInfo {
        return BlockInfo{
            .number = 0,
            .timestamp = 0,
            .difficulty = 0,
            .gas_limit = 30_000_000,
            .coinbase = primitives.ZERO_ADDRESS,
            .base_fee = 0,
            .prev_randao = [_]u8{0} ** 32,
        };
    }
    
    /// Check if this block has EIP-1559 base fee support (London+)
    pub fn hasBaseFee(self: BlockInfo) bool {
        return self.base_fee > 0 or self.number > 0; // Simplified check
    }
    
    /// Validate block info constraints
    pub fn validate(self: BlockInfo) bool {
        // Gas limit must be reasonable
        if (self.gas_limit == 0 or self.gas_limit > 100_000_000) return false;
        // Timestamp should be reasonable (not before 2015)
        if (self.timestamp > 0 and self.timestamp < 1438269973) return false; // Ethereum genesis
        return true;
    }
};

const std = @import("std");

test "block info initialization" {
    const block = BlockInfo.init();
    try std.testing.expectEqual(@as(u64, 0), block.number);
    try std.testing.expectEqual(@as(u64, 0), block.timestamp);
    try std.testing.expectEqual(@as(u256, 0), block.difficulty);
    try std.testing.expectEqual(@as(u64, 30_000_000), block.gas_limit);
    try std.testing.expectEqual(primitives.ZERO_ADDRESS, block.coinbase);
    try std.testing.expectEqual(@as(u256, 0), block.base_fee);
    try std.testing.expectEqual([_]u8{0} ** 32, block.prev_randao);
}

test "block info custom values" {
    const custom_address = Address{ .bytes = [_]u8{1} ++ [_]u8{0} ** 19 };
    const custom_randao = [_]u8{0xff} ** 32;
    
    const block = BlockInfo{
        .number = 12345,
        .timestamp = 1640995200, // Jan 1, 2022
        .difficulty = 1000000,
        .gas_limit = 15_000_000,
        .coinbase = custom_address,
        .base_fee = 20_000_000_000, // 20 gwei
        .prev_randao = custom_randao,
    };
    
    try std.testing.expectEqual(@as(u64, 12345), block.number);
    try std.testing.expectEqual(@as(u64, 1640995200), block.timestamp);
    try std.testing.expectEqual(@as(u256, 1000000), block.difficulty);
    try std.testing.expectEqual(@as(u64, 15_000_000), block.gas_limit);
    try std.testing.expectEqual(custom_address, block.coinbase);
    try std.testing.expectEqual(@as(u256, 20_000_000_000), block.base_fee);
    try std.testing.expectEqual(custom_randao, block.prev_randao);
}

test "block info hasBaseFee check" {
    // Block with base fee
    var block = BlockInfo.init();
    block.base_fee = 1000;
    try std.testing.expect(block.hasBaseFee());
    
    // Block with number > 0 (London fork assumption)
    block = BlockInfo.init();
    block.number = 12965000; // London fork block
    try std.testing.expect(block.hasBaseFee());
    
    // Genesis block without base fee
    block = BlockInfo.init();
    try std.testing.expect(!block.hasBaseFee()); // Neither condition met
}

test "block info validation" {
    // Valid block
    var block = BlockInfo.init();
    block.timestamp = 1640995200;
    try std.testing.expect(block.validate());
    
    // Invalid gas limit - zero
    block = BlockInfo.init();
    block.gas_limit = 0;
    try std.testing.expect(!block.validate());
    
    // Invalid gas limit - too high
    block = BlockInfo.init();
    block.gas_limit = 200_000_000;
    try std.testing.expect(!block.validate());
    
    // Invalid timestamp - before Ethereum genesis
    block = BlockInfo.init();
    block.timestamp = 1000000; // Before 2015
    try std.testing.expect(!block.validate());
    
    // Valid timestamp at boundary
    block = BlockInfo.init();
    block.timestamp = 1438269973; // Ethereum genesis timestamp
    try std.testing.expect(block.validate());
}

test "block info edge cases" {
    // Maximum values
    const max_block = BlockInfo{
        .number = std.math.maxInt(u64),
        .timestamp = std.math.maxInt(u64),
        .difficulty = std.math.maxInt(u256),
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = std.math.maxInt(u256),
        .prev_randao = [_]u8{0xff} ** 32,
    };
    try std.testing.expect(max_block.validate());
    try std.testing.expect(max_block.hasBaseFee());
    
    // Minimum valid values
    const min_block = BlockInfo{
        .number = 0,
        .timestamp = 1438269973, // Ethereum genesis
        .difficulty = 0,
        .gas_limit = 1,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 0,
        .prev_randao = [_]u8{0} ** 32,
    };
    try std.testing.expect(min_block.validate());
}
