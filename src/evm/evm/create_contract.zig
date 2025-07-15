const std = @import("std");
const primitives = @import("primitives");
const ExecutionError = @import("../execution/execution_error.zig");
const CreateResult = @import("create_result.zig").CreateResult;
const Vm = @import("../evm.zig");

pub const CreateContractError = std.mem.Allocator.Error || primitives.Address.CalculateAddressError || @import("../state/database_interface.zig").DatabaseError || ExecutionError.Error;

/// Create a new contract using CREATE opcode semantics.
///
/// Increments creator's nonce, calculates address via keccak256(rlp([sender, nonce])),
/// transfers value if specified, executes init code, and deploys resulting bytecode.
///
/// Parameters:
/// - creator: Account initiating contract creation
/// - value: Wei to transfer to new contract (0 for no transfer)
/// - init_code: Bytecode executed to generate contract code
/// - gas: Maximum gas for entire creation process
///
/// Returns CreateResult with success=false if:
/// - Creator balance < value (insufficient funds)
/// - Contract exists at calculated address (collision)
/// - Init code reverts or runs out of gas
/// - Deployed bytecode > 24,576 bytes (EIP-170)
/// - Insufficient gas for deployment (200 gas/byte)
///
/// Time complexity: O(init_code_length + deployed_code_length)
/// Memory: Allocates space for deployed bytecode
///
/// See also: create2_contract() for deterministic addresses
pub fn create_contract(self: *Vm, creator: primitives.Address, value: u256, init_code: []const u8, gas: u64) CreateContractError!CreateResult {
    const nonce = try self.state.increment_nonce(creator);
    const new_address = try primitives.Address.calculate_create_address(self.allocator, creator, nonce);
    return self.create_contract_internal(creator, value, init_code, gas, new_address);
}