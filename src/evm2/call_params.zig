const primitives = @import("primitives");
const Address = primitives.Address.Address;

// TODO: Currently used in host which is unused
/// Call operation parameters for different call types
pub const CallParams = union(enum) {
    /// Regular CALL operation
    call: struct {
        caller: Address,
        to: Address,
        value: u256,
        input: []const u8,
        gas: u64,
    },
    /// CALLCODE operation: execute external code with current storage/context
    /// Executes code at `to`, but uses caller's storage and address context
    callcode: struct {
        caller: Address,
        to: Address,
        value: u256,
        input: []const u8,
        gas: u64,
    },
    /// DELEGATECALL operation (preserves caller context)
    delegatecall: struct {
        caller: Address, // Original caller, not current contract
        to: Address,
        input: []const u8,
        gas: u64,
    },
    /// STATICCALL operation (read-only)
    staticcall: struct {
        caller: Address,
        to: Address,
        input: []const u8,
        gas: u64,
    },
    /// CREATE operation
    create: struct {
        caller: Address,
        value: u256,
        init_code: []const u8,
        gas: u64,
    },
    /// CREATE2 operation
    create2: struct {
        caller: Address,
        value: u256,
        init_code: []const u8,
        salt: u256,
        gas: u64,
    },
};
