const std = @import("std");
const FrameFat = @import("frame_fat.zig");
const primitives = @import("primitives");

/// Contract field accessors for the fat frame structure.
///
/// This module provides convenient access to contract-related fields that are
/// embedded directly in the FrameFat structure. These accessors maintain the
/// same interface as the original Contract methods while operating on the
/// consolidated frame data.
///
/// ## Contract Fields in Fat Frame
/// The fat frame embeds these contract fields:
/// - address: Contract's address
/// - caller: Address that called this contract
/// - code: Contract bytecode
/// - code_hash: Keccak256 hash of the code
/// - value: Wei sent with this call
///
/// ## Design Rationale
/// By embedding contract fields directly in the frame, we:
/// - Eliminate pointer indirection
/// - Improve cache locality
/// - Maintain the same logical interface

/// Get the contract address.
///
/// @param frame The frame containing contract data
/// @return Contract address
pub inline fn contract_address(frame: *const FrameFat) primitives.Address.Address {
    return frame.address;
}

/// Get the caller address.
///
/// @param frame The frame containing contract data
/// @return Address that initiated this call
pub inline fn contract_caller(frame: *const FrameFat) primitives.Address.Address {
    return frame.caller;
}

/// Get the contract bytecode.
///
/// @param frame The frame containing contract data
/// @return Contract bytecode slice
pub inline fn contract_code(frame: *const FrameFat) []const u8 {
    return frame.code;
}

/// Get the contract code hash.
///
/// @param frame The frame containing contract data
/// @return Keccak256 hash of the code
pub inline fn contract_code_hash(frame: *const FrameFat) [32]u8 {
    return frame.code_hash;
}

/// Get the value sent with this call.
///
/// @param frame The frame containing contract data
/// @return Wei value sent
pub inline fn contract_value(frame: *const FrameFat) u256 {
    return frame.value;
}

/// Get a byte from the contract code at the given offset.
///
/// @param frame The frame containing contract data
/// @param offset Byte offset in the code
/// @return Byte value at offset, or 0 if out of bounds
pub fn contract_get_byte(frame: *const FrameFat, offset: usize) u8 {
    if (offset >= frame.code.len) {
        return 0;
    }
    return frame.code[offset];
}

/// Get a slice of contract code.
///
/// @param frame The frame containing contract data
/// @param offset Starting offset
/// @param size Number of bytes to get
/// @return Code slice (may be shorter if out of bounds)
pub fn contract_get_code_slice(frame: *const FrameFat, offset: usize, size: usize) []const u8 {
    if (offset >= frame.code.len) {
        return &[_]u8{};
    }
    
    const available = frame.code.len - offset;
    const read_size = @min(size, available);
    
    return frame.code[offset..offset + read_size];
}

/// Get the size of the contract code.
///
/// @param frame The frame containing contract data
/// @return Code size in bytes
pub inline fn contract_code_size(frame: *const FrameFat) usize {
    return frame.code.len;
}

/// Check if this is a static call context.
///
/// @param frame The frame to check
/// @return true if this is a STATICCALL context
pub inline fn contract_is_static(frame: *const FrameFat) bool {
    return frame.is_static;
}

/// Get the current call depth.
///
/// @param frame The frame to check
/// @return Current depth in the call stack
pub inline fn contract_depth(frame: *const FrameFat) u32 {
    return frame.depth;
}

/// Get the transaction origin.
///
/// @param frame The frame containing context
/// @return Original transaction sender
pub inline fn contract_tx_origin(frame: *const FrameFat) primitives.Address.Address {
    return frame.tx_origin;
}

/// Get the gas price.
///
/// @param frame The frame containing context
/// @return Gas price for this transaction
pub inline fn contract_gas_price(frame: *const FrameFat) u256 {
    return frame.gas_price;
}

/// Get block context fields.
///
/// These provide access to the immutable block context embedded in the frame.
pub const block = struct {
    pub inline fn number(frame: *const FrameFat) u64 {
        return frame.block_context.block_number;
    }
    
    pub inline fn timestamp(frame: *const FrameFat) u64 {
        return frame.block_context.block_timestamp;
    }
    
    pub inline fn coinbase(frame: *const FrameFat) primitives.Address.Address {
        return frame.block_context.block_coinbase;
    }
    
    pub inline fn difficulty(frame: *const FrameFat) u256 {
        return frame.block_context.block_difficulty;
    }
    
    pub inline fn gas_limit(frame: *const FrameFat) u64 {
        return frame.block_context.block_gas_limit;
    }
    
    pub inline fn base_fee(frame: *const FrameFat) u256 {
        return frame.block_context.block_base_fee;
    }
    
    pub inline fn chain_id(frame: *const FrameFat) u256 {
        return frame.block_context.chain_id;
    }
};

// ===== Tests =====

test "contract field accessors" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Test basic accessors
    try std.testing.expectEqual(primitives.Address.ZERO_ADDRESS, contract_address(&frame));
    try std.testing.expectEqual(primitives.Address.ZERO_ADDRESS, contract_caller(&frame));
    try std.testing.expectEqual(@as(u256, 0), contract_value(&frame));
    try std.testing.expectEqual(@as(u32, 0), contract_depth(&frame));
    try std.testing.expectEqual(false, contract_is_static(&frame));
}

test "contract code operations" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Our test frame has code [0x60, 0x00, 0x60, 0x00]
    try std.testing.expectEqual(@as(usize, 4), contract_code_size(&frame));
    try std.testing.expectEqual(@as(u8, 0x60), contract_get_byte(&frame, 0));
    try std.testing.expectEqual(@as(u8, 0x00), contract_get_byte(&frame, 1));
    
    // Out of bounds returns 0
    try std.testing.expectEqual(@as(u8, 0), contract_get_byte(&frame, 10));
    
    // Test code slice
    const slice = contract_get_code_slice(&frame, 1, 2);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0x00, 0x60 }, slice);
    
    // Out of bounds slice
    const oob_slice = contract_get_code_slice(&frame, 10, 5);
    try std.testing.expectEqual(@as(usize, 0), oob_slice.len);
}

test "contract context accessors" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    // Test transaction context
    try std.testing.expectEqual(primitives.Address.ZERO_ADDRESS, contract_tx_origin(&frame));
    try std.testing.expectEqual(@as(u256, 1000), contract_gas_price(&frame));
    
    // Test block context
    try std.testing.expectEqual(@as(u64, 100), block.number(&frame));
    try std.testing.expectEqual(@as(u64, 1234567890), block.timestamp(&frame));
    try std.testing.expectEqual(@as(u256, 1), block.chain_id(&frame));
}

test "contract code hash" {
    const allocator = std.testing.allocator;
    
    var frame = try createTestFrame(allocator);
    defer frame.deinit();
    
    const hash = contract_code_hash(&frame);
    try std.testing.expectEqual(@as(usize, 32), hash.len);
    
    // Should be non-zero (our test sets it to 0xAA repeated)
    try std.testing.expectEqual(@as(u8, 0xAA), hash[0]);
}

// Helper function to create a test frame
fn createTestFrame(allocator: std.mem.Allocator) !FrameFat {
    const Context = @import("../access_list/context.zig");
    const Contract = @import("./contract.zig");
    
    var context = Context{
        .tx_origin = primitives.Address.ZERO_ADDRESS,
        .gas_price = 1000,
        .block_number = 100,
        .block_timestamp = 1234567890,
        .block_coinbase = primitives.Address.ZERO_ADDRESS,
        .block_difficulty = 0,
        .block_gas_limit = 30_000_000,
        .chain_id = 1,
        .block_base_fee = 15_000_000_000,
    };
    
    var vm = struct {
        depth: u16 = 0,
        context: Context,
    }{
        .context = context,
    };
    
    const code = [_]u8{ 0x60, 0x00, 0x60, 0x00 }; // PUSH1 0 PUSH1 0
    var contract = Contract{
        .address = primitives.Address.ZERO_ADDRESS,
        .code = &code,
        .code_hash = [_]u8{0xAA} ** 32,
        .value = 0,
        .caller = primitives.Address.ZERO_ADDRESS,
        .call_type = .Call,
        .allocator = allocator,
        .accessed_storage_slots = null,
        .storage_pool = null,
        .gas_remaining = 0,
        .gas_refund_counter = 0,
        .last_opcode = 0,
        .is_static = false,
        .is_deployment = false,
    };
    
    return try FrameFat.init(
        allocator,
        &vm,
        100000,
        &contract,
        primitives.Address.ZERO_ADDRESS,
        &[_]u8{},
    );
}