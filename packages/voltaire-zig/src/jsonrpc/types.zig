/// Shared types for Ethereum JSON-RPC
///
/// This module re-exports all hand-written base types used across JSON-RPC methods.
pub const Address = @import("types/Address.zig").Address;
pub const Hash = @import("types/Hash.zig").Hash;
pub const Quantity = @import("types/Quantity.zig").Quantity;
pub const BlockTag = @import("types/BlockTag.zig").BlockTag;
pub const BlockSpec = @import("types/BlockSpec.zig").BlockSpec;
pub const Filter = @import("types/Filter.zig");
pub const LogEntry = @import("types/LogEntry.zig");
pub const TransactionResponse = @import("types/TransactionResponse.zig").TransactionResponse;
pub const ReceiptResponse = @import("types/ReceiptResponse.zig").ReceiptResponse;

// New types for block responses
pub const Withdrawal = @import("types/Withdrawal.zig");
pub const TransactionInfo = @import("types/TransactionInfo.zig");
pub const BlockResponse = @import("types/BlockResponse.zig");

// Import tests
test {
    _ = @import("types/Filter.zig");
    _ = @import("types/LogEntry.zig");
    _ = @import("types/Withdrawal.zig");
    _ = @import("types/TransactionInfo.zig");
    _ = @import("types/BlockResponse.zig");
    _ = @import("types/TransactionResponse.zig");
    _ = @import("types/ReceiptResponse.zig");
}
