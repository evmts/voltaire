# Hardfork Management

Comprehensive hardfork support system that tracks Ethereum protocol changes and enables the EVM to behave correctly for any point in Ethereum's history.

## Purpose

The hardfork system provides:
- Enumeration of all Ethereum hardforks from Frontier to Cancun
- Feature availability tracking (which opcodes/features are active)
- Chain-specific rules and configurations
- Clean abstraction for hardfork-dependent behavior

## Architecture

The system uses a data-driven approach where hardfork rules are encoded in compile-time tables, providing:
- Zero runtime overhead for hardfork checks
- Complete feature tracking for all EIPs
- Easy addition of new hardforks
- Type-safe hardfork comparisons

## Files

### `hardfork.zig`
Defines all Ethereum hardforks and their chronological ordering.

**Hardforks Supported**:
1. **FRONTIER** (July 2015) - Initial Ethereum release
2. **HOMESTEAD** (March 2016) - Contract creation gas fix, DELEGATECALL
3. **DAO_FORK** (July 2016) - TheDAO recovery
4. **TANGERINE_WHISTLE** (October 2016) - Gas cost adjustments (EIP-150)
5. **SPURIOUS_DRAGON** (November 2016) - State clearing, replay protection
6. **BYZANTIUM** (October 2017) - REVERT, STATICCALL, precompiles
7. **CONSTANTINOPLE** (February 2019) - CREATE2, bitwise ops, EXTCODEHASH
8. **PETERSBURG** (February 2019) - Revert EIP-1283
9. **ISTANBUL** (December 2019) - Gas repricing, CHAINID, SELFBALANCE
10. **MUIR_GLACIER** (January 2020) - Difficulty bomb delay
11. **BERLIN** (April 2021) - Gas cost updates, access lists (EIP-2929)
12. **LONDON** (August 2021) - EIP-1559, BASEFEE, reduced refunds
13. **ARROW_GLACIER** (December 2021) - Difficulty bomb delay
14. **GRAY_GLACIER** (June 2022) - Difficulty bomb delay
15. **MERGE** (September 2022) - Proof of Stake, PREVRANDAO
16. **SHANGHAI** (April 2023) - Withdrawals, PUSH0
17. **CANCUN** (March 2024) - Proto-danksharding, transient storage

**Future Placeholders**:
- **PRAGUE** - Verkle trees preparation
- **VERKLE** - State tree migration

**Key Methods**:
- `isEnabled()`: Check if hardfork is active
- `format()`: String representation for debugging

**Used By**: Chain rules, opcode availability, gas calculations

### `chain_rules.zig`
Feature availability matrix for each hardfork.

**Rule Categories**:

1. **Opcode Availability**:
   - Basic opcodes (always available)
   - `DELEGATECALL` (Homestead+)
   - `REVERT`, `RETURNDATASIZE`, `RETURNDATACOPY` (Byzantium+)
   - `STATICCALL` (Byzantium+)
   - `CREATE2`, `EXTCODEHASH` (Constantinople+)
   - `CHAINID`, `SELFBALANCE` (Istanbul+)
   - `BASEFEE` (London+)
   - `PUSH0` (Shanghai+)
   - `TLOAD`, `TSTORE`, `BLOBHASH` (Cancun+)

2. **Precompiled Contracts**:
   - 0x1-0x4: Always available (ECRECOVER, SHA256, RIPEMD160, IDENTITY)
   - 0x5: MODEXP (Byzantium+)
   - 0x6-0x8: BN254 operations (Byzantium+)
   - 0x9: BLAKE2F (Istanbul+)
   - 0xa: KZG point evaluation (Cancun+)

3. **Gas Model Changes**:
   - Call gas mechanics (Tangerine Whistle)
   - SSTORE gas changes (multiple hardforks)
   - Access list support (Berlin+)
   - Dynamic gas costs (Istanbul+)

4. **Transaction Types**:
   - Legacy transactions (always)
   - Access list transactions (Berlin+)
   - Dynamic fee transactions (London+)
   - Blob transactions (Cancun+)

5. **EVM Behavioral Changes**:
   - Empty account cleanup (Spurious Dragon+)
   - CREATE2 address generation (Constantinople+)
   - SELFDESTRUCT restrictions (London+)
   - Difficulty → PREVRANDAO (Merge+)

**Key Functions**:
- `getChainRules()`: Get complete rule set for hardfork
- Individual feature checks (e.g., `has_push0`, `has_blob_hash`)

**Implementation**:
- Compile-time table generation
- Zero runtime overhead
- Comprehensive EIP tracking

**Used By**: 
- Jump table (opcode availability)
- Gas calculations
- Transaction validation
- Precompile routing

## Usage Examples

### Configuring EVM for Specific Hardfork
```zig
const vm = Vm.init(.{
    .hardfork = .LONDON,
    // EVM will enforce London rules
});
```

### Checking Feature Availability
```zig
const rules = ChainRules.getChainRules(.SHANGHAI);
if (rules.has_push0) {
    // PUSH0 opcode is available
}
```

### Comparing Hardforks
```zig
if (hardfork.isEnabled(.BERLIN)) {
    // Access lists are available
}
```

## Hardfork Evolution

### Major Milestones

1. **Frontier → Homestead**: Basic stability fixes
2. **Byzantium**: Major feature additions (REVERT, new precompiles)
3. **Constantinople**: CREATE2 and bitwise operations
4. **Istanbul**: Gas repricing for DoS prevention
5. **Berlin**: Access lists for gas predictability
6. **London**: EIP-1559 fee market reform
7. **Merge**: Proof of Stake transition
8. **Shanghai**: Withdrawals enabled
9. **Cancun**: Blob transactions for L2 scaling

### EIP Implementation

The system tracks numerous EIPs including:
- EIP-150: Gas cost changes (Tangerine Whistle)
- EIP-1559: Dynamic base fee (London)
- EIP-2929: Access lists (Berlin)
- EIP-3529: Reduced refunds (London)
- EIP-4844: Blob transactions (Cancun)
- And many more...

## Design Principles

1. **Data-Driven**: Rules encoded in tables, not code
2. **Zero Overhead**: Compile-time resolution where possible
3. **Completeness**: Every protocol change is tracked
4. **Type Safety**: Hardforks are strongly typed enums
5. **Extensibility**: Easy to add new hardforks

## Testing Considerations

When testing:
- Always specify the hardfork explicitly
- Test boundary conditions at hardfork transitions
- Verify deprecated features are disabled
- Check gas costs change appropriately

## Future Hardforks

**Prague**:
- Preparation for Verkle trees
- Additional EVM improvements

**Verkle**:
- New state tree structure
- Stateless client support
- Major storage model changes

## Implementation Notes

- Hardfork enum values are chronologically ordered
- Comparison operators work naturally (newer > older)
- Chain rules use efficient bit flags internally
- Tables are generated at compile time for performance

## Related Components

- **Jump Table**: Uses chain rules for opcode availability
- **Gas Calculations**: Different costs per hardfork
- **Storage**: Clearing rules change by hardfork
- **Precompiles**: New contracts added over time
- **Transactions**: Type support varies by hardfork