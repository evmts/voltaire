/// Shared types for Ethereum JSON-RPC
///
/// This module re-exports all hand-written base types used across JSON-RPC methods.
pub const Address = @import("types/Address.zig").Address;
pub const Hash = @import("types/Hash.zig").Hash;
pub const Quantity = @import("types/Quantity.zig").Quantity;
pub const BlockTag = @import("types/BlockTag.zig").BlockTag;
pub const BlockSpec = @import("types/BlockSpec.zig").BlockSpec;
const responses = @import("types/responses.zig");
pub const Nonce = responses.Nonce;
pub const Bloom = responses.Bloom;
pub const LogEntry = responses.LogEntry;
pub const TransactionType = responses.TransactionType;
pub const AccessListEntry = responses.AccessListEntry;
pub const AuthorizationEntry = responses.AuthorizationEntry;
pub const TransactionResponse = responses.TransactionResponse;
pub const TransactionInfo = responses.TransactionInfo;
pub const ReceiptResponse = responses.ReceiptResponse;
pub const Filter = responses.Filter;
pub const FilterResults = responses.FilterResults;
pub const BlockResponse = responses.BlockResponse;
