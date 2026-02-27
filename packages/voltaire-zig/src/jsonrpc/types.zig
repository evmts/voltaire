/// Shared types for Ethereum JSON-RPC
///
/// This module re-exports all hand-written base types used across JSON-RPC methods.
pub const Address = @import("types/Address.zig").Address;
pub const Hash = @import("types/Hash.zig").Hash;
pub const Quantity = @import("types/Quantity.zig").Quantity;
pub const BlockTag = @import("types/BlockTag.zig").BlockTag;
pub const BlockSpec = @import("types/BlockSpec.zig").BlockSpec;
pub const Filter = @import("types/Filter.zig").Filter;
pub const LogEntry = @import("types/LogEntry.zig").LogEntry;
pub const ReceiptResponse = @import("types/ReceiptResponse.zig").ReceiptResponse;
pub const TransactionResponse = @import("types/TransactionResponse.zig").TransactionResponse;
pub const Withdrawal = @import("types/Withdrawal.zig").Withdrawal;
