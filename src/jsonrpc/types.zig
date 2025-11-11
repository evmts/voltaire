/// Shared types for Ethereum JSON-RPC
///
/// This module re-exports all hand-written base types used across JSON-RPC methods.
pub const Address = @import("types/Address.zig");
pub const Hash = @import("types/Hash.zig");
pub const Quantity = @import("types/Quantity.zig");
pub const BlockTag = @import("types/BlockTag.zig");
pub const BlockSpec = @import("types/BlockSpec.zig");
