const std = @import("std");
const primitives = @import("primitives");
const CallResult = @import("call_result.zig").CallResult;
const Log = @import("../log.zig");
const Vm = @import("../evm.zig");

const DatabaseError = @import("../state/database_interface.zig").DatabaseError;
pub const StaticcallContractError = std.mem.Allocator.Error || DatabaseError;

/// Execute a STATICCALL operation.
/// Basic implementation that handles calls to empty contracts.
/// TODO: Execute target contract in guaranteed read-only mode.
pub fn staticcall_contract(self: *Vm, caller: primitives.Address.Address, to: primitives.Address.Address, input: []const u8, gas: u64) StaticcallContractError!CallResult {
    Log.debug("VM.staticcall_contract: STATICCALL from {any} to {any}, gas={}", .{ caller, to, gas });

    // Check if target address has code
    const account_info = try self.state.database.get_account(to);
    
    // If account doesn't exist or has no code, STATICCALL succeeds with empty output
    if (account_info == null or std.mem.eql(u8, &account_info.?.code_hash, &[_]u8{0} ** 32)) {
        Log.debug("VM.staticcall_contract: calling empty contract, returning success", .{});
        _ = input;
        return CallResult{ .success = true, .gas_left = gas, .output = null };
    }

    // TODO: For contracts with code, execute them in static context
    Log.debug("VM.staticcall_contract: contract execution not implemented yet", .{});
    _ = input;

    return CallResult{ .success = false, .gas_left = gas, .output = null };
}
