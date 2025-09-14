# CLAUDE.md - EIPs and Hardforks Module AI Context

## MISSION CRITICAL: Protocol Evolution and Compatibility

The EIPs and hardforks module manages Ethereum protocol upgrades and feature activation. **ANY error in protocol version handling can cause consensus failures or network splits.** Protocol compliance must be exact across all hardforks.

## Critical Implementation Details

### Hardfork Management
- **Berlin**: EIP-2929 (gas cost increases), EIP-2930 (access lists)
- **London**: EIP-1559 (fee market), EIP-3198 (BASEFEE opcode)
- **Shanghai**: EIP-3651, EIP-3855, EIP-3860 (various optimizations)
- **Cancun**: EIP-4844 (proto-danksharding), EIP-1153 (transient storage)

### Key Responsibilities
- **Feature Activation**: Enable new opcodes/functionality at correct block numbers
- **Gas Cost Updates**: Apply new gas pricing rules per hardfork
- **Consensus Rules**: Enforce new validation rules and restrictions
- **Backward Compatibility**: Maintain compatibility with historical transactions
- **Configuration Management**: Handle network-specific activation blocks

### Critical Safety Requirements
- Never activate features before their designated block numbers
- Maintain exact consensus rules for each hardfork
- Handle chain reorganizations across hardfork boundaries
- Validate all EIP implementation compliance
- Prevent feature regression across upgrades

### EIP Implementation Patterns
```zig
// Example: EIP-1559 activation
pub fn is_london_active(block_number: u64, config: *const ChainConfig) bool {
    return block_number >= config.london_block;
}

pub fn calculate_gas_fee(base_fee: u64, max_fee: u64, priority_fee: u64) u64 {
    const effective_gas_price = @min(max_fee, base_fee + priority_fee);
    return effective_gas_price;
}
```

### Testing Requirements
- Test all hardfork transitions
- Validate historical transaction replay
- Cross-reference with official test vectors
- Ensure no consensus rule changes without activation

### Emergency Procedures
- Emergency hardfork deployment procedures
- Rollback mechanisms for failed upgrades
- Network coordination for consensus fixes
- Monitoring for consensus divergence

Remember: **Protocol upgrades affect the entire network.** Any deviation from official EIP specifications can cause permanent network splits and loss of consensus.