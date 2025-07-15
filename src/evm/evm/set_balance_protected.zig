const std = @import("std");
const primitives = @import("primitives");
const Vm = @import("../evm.zig");
const ValidateStaticContextError = @import("validate_static_context.zig").ValidateStaticContextError;

pub const SetBalanceProtectedError = ValidateStaticContextError || std.mem.Allocator.Error || @import("../state/database_interface.zig").DatabaseError;

/// Set an account balance with static context protection.
/// Prevents balance modifications during static calls.
pub fn set_balance_protected(self: *Vm, address: primitives.Address.Address, balance: u256) SetBalanceProtectedError!void {
    try self.validate_static_context();
    try self.state.set_balance(address, balance);
}