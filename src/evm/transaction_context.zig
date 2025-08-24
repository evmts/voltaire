/// Transaction context for EVM execution
const Address = @import("primitives").Address.Address;

/// Transaction context
pub const TransactionContext = struct {
    /// Transaction gas limit
    gas_limit: u64,
    /// Coinbase address (miner/validator)
    coinbase: Address,
    /// Chain ID - supports chain IDs up to 65535
    /// NOTE: chain_id is used by the CHAINID opcode
    chain_id: u16,
};