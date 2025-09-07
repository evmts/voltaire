# EIPs and Hardforks

Ethereum Improvement Proposals (EIPs) and hardfork configurations for the Guillotine EVM implementation.

## Overview

This module provides comprehensive support for Ethereum's evolution through hardforks and EIP implementations. It consolidates all protocol upgrade logic, feature flags, and hardfork-specific behavior into a unified system that enables the EVM to correctly handle different network configurations and protocol versions.

## Components and Architecture

### Core Files

- **`eips.zig`** - Central EIP configuration system with feature flags
- **`hardfork.zig`** - Hardfork enumeration and version management  
- **`hardfork_c.zig`** - C-compatible hardfork interface for FFI

### EIP Implementations

#### State Management EIPs
- **`beacon_roots.zig`** - EIP-4788: Beacon block root in EVM (Cancun)
- **`historical_block_hashes.zig`** - EIP-2935: Historical block hashes from state (Prague)

#### Validator Operations
- **`validator_deposits.zig`** - EIP-6110: Supply validator deposits on chain (Prague)
- **`validator_withdrawals.zig`** - EIP-7002: Execution layer triggerable exits (Prague)

#### Account Authorization
- **`authorization_processor.zig`** - EIP-7702: Set EOA account code (Prague)

## Key Features

### Hardfork Management
- **Protocol Evolution**: Support for all major Ethereum hardforks from Frontier to Prague
- **Backward Compatibility**: Ensures correct behavior across different network states
- **Feature Gating**: Compile-time and runtime feature flags based on hardfork activation
- **Gas Cost Management**: Hardfork-specific gas pricing and operation costs

### EIP Implementation
- **Modular Design**: Each EIP implemented as a separate, focused module
- **State Consistency**: Proper state transitions for protocol upgrades
- **Validation Logic**: Comprehensive validation for new protocol features
- **Integration Points**: Clean interfaces with the main EVM execution engine

### Configuration System
```zig
// Example: Configure EVM for specific hardfork
const eips = Eips{ .hardfork = .CANCUN };

// Check feature availability
if (eips.eip_4788_beacon_roots_enabled()) {
    // Handle beacon root operations
}

// Apply hardfork-specific behavior
if (eips.hardfork.isAtLeast(.SHANGHAI)) {
    try eips.eip_3651_warm_coinbase_address(access_list, coinbase);
}
```

## Integration Points

### EVM Core Integration
- **Opcode Dispatch**: Hardfork-specific opcode availability and gas costs
- **State Access**: Integration with state management for EIP-specific storage
- **Transaction Processing**: Support for new transaction types and validation rules
- **Precompile System**: EIP-specific precompiled contract implementations

### Host Interface
- **Block Context**: Access to block-level data for EIP implementations
- **State Queries**: Read/write access to world state for protocol operations
- **Event Emission**: Log generation for protocol-level events

### Database Integration
- **State Persistence**: Proper storage of EIP-specific state data
- **Migration Support**: State migration logic for protocol upgrades
- **Consistency Guarantees**: Atomic updates during protocol transitions

## Usage Examples

### Basic Hardfork Configuration
```zig
const eips_and_hardforks = @import("eips_and_hardforks");

// Create EIP configuration for Cancun hardfork
const eips = eips_and_hardforks.Eips{ .hardfork = .CANCUN };

// Check if EIP-4788 is active
if (eips.eip_4788_beacon_roots_enabled()) {
    // Process beacon root storage
    try eips_and_hardforks.beacon_roots.store_beacon_root(
        host, block_timestamp, beacon_root
    );
}
```

### Historical Data Access
```zig
// EIP-2935: Access historical block hashes
if (eips.eip_2935_historical_block_hashes_enabled()) {
    const historical_hash = try eips_and_hardforks.historical_block_hashes
        .get_block_hash(host, block_number);
}
```

### Validator Operations
```zig
// EIP-6110: Process validator deposits
if (eips.eip_6110_validator_deposits_enabled()) {
    try eips_and_hardforks.validator_deposits.process_deposits(
        host, deposit_data
    );
}

// EIP-7002: Handle validator exits
if (eips.eip_7002_validator_exits_enabled()) {
    try eips_and_hardforks.validator_withdrawals.process_exit_request(
        host, validator_index
    );
}
```

### Account Authorization (EIP-7702)
```zig
// Configure EOA with contract code
if (eips.eip_7702_eoa_code_enabled()) {
    try eips_and_hardforks.authorization_processor.set_eoa_code(
        host, eoa_address, contract_code, authorization_list
    );
}
```

## Design Principles

### Modularity
Each EIP is implemented as an independent module with clear boundaries and minimal coupling to other components.

### Performance
- **Compile-time Optimization**: Feature flags resolved at compile time where possible
- **Minimal Runtime Overhead**: Efficient hardfork checks and EIP dispatch
- **Memory Efficiency**: Careful allocation management in protocol operations

### Correctness
- **Specification Compliance**: Strict adherence to EIP specifications
- **Test Coverage**: Comprehensive test suites for all EIP implementations
- **Edge Case Handling**: Robust error handling for protocol edge cases

### Maintainability
- **Clear Documentation**: Each EIP module documents its purpose and behavior
- **Version Tracking**: Clear mapping between EIPs and hardfork activations
- **Future Compatibility**: Architecture supports easy addition of new EIPs

## Testing Strategy

The module includes extensive tests covering:
- **Hardfork Transitions**: Verify correct behavior across protocol upgrades
- **EIP Functionality**: Unit tests for each EIP implementation
- **Integration Tests**: End-to-end testing with EVM execution
- **Edge Cases**: Boundary conditions and error scenarios
- **Consensus Compatibility**: Validation against reference implementations

## Future Extensibility

The architecture is designed to easily support future EIPs:
1. Add new EIP module following established patterns
2. Update `eips.zig` with feature flag method
3. Integrate with relevant EVM components
4. Add comprehensive test coverage
5. Update documentation and examples

This modular approach ensures that Guillotine can quickly adapt to new Ethereum protocol upgrades while maintaining backward compatibility and performance.