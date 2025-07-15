const primitives = @import("primitives");
const Vm = @import("../evm.zig");
const ValidateStaticContextError = @import("validate_static_context.zig").ValidateStaticContextError;

pub const SelfdestructProtectedError = ValidateStaticContextError;

/// Execute SELFDESTRUCT with static context protection.
/// NOT FULLY IMPLEMENTED - currently only validates static context.
/// TODO: Transfer remaining balance to beneficiary and mark contract for deletion.
pub fn selfdestruct_protected(self: *Vm, contract: primitives.Address.Address, beneficiary: primitives.Address.Address) SelfdestructProtectedError!void {
    _ = contract;
    _ = beneficiary;
    try self.validate_static_context();
}