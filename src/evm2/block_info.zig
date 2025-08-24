const primitives = @import("primitives");
const Address = primitives.Address.Address;

// TODO: Currently unused
/// Block information structure for Host interface
pub const BlockInfo = struct {
    /// Block number
    number: u64,
    /// Block timestamp
    timestamp: u64,
    /// Block difficulty
    difficulty: u256,
    /// Block gas limit
    gas_limit: u64,
    /// Coinbase (miner) address
    coinbase: Address,
    /// Base fee per gas (EIP-1559)
    base_fee: u256,
    /// Block hash of previous block
    prev_randao: [32]u8,
};
