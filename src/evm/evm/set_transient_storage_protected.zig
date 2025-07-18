const std = @import("std");
const primitives = @import("primitives");
const Vm = @import("../evm.zig");
const ValidateStaticContextError = @import("validate_static_context.zig").ValidateStaticContextError;

pub const SetTransientStorageProtectedError = ValidateStaticContextError || std.mem.Allocator.Error;

/// Set a transient storage value with static context protection.
/// Transient storage (EIP-1153) is cleared at the end of each transaction.
pub fn set_transient_storage_protected(self: *Vm, address: primitives.Address.Address, slot: u256, value: u256) SetTransientStorageProtectedError!void {
    try self.validate_static_context();
    try self.state.set_transient_storage(address, slot, value);
}
