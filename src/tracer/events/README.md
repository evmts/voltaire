# EVM Events Module Structure

This directory contains a modular event system for comprehensive EVM tracing and observability.

## File Organization

### Core Files
- `events.zig` - Main module with core EVM events and re-exports of all event types
- `metadata.zig` - Common metadata, categories, severity levels, and filters

### Event Categories

#### `events.zig` - Core EVM Events (main module)
- Transaction lifecycle (start/end)
- VM execution steps
- Call/Create operations
- Error events (revert, out of gas, stack/memory errors)
- Precompile interactions
- Contract events (selfdestruct, logs)

#### `state.zig` - State Management Events  
- Storage operations (read/write/cold access)
- Transient storage (EIP-1153)
- Account changes (balance, nonce, code)
- Account lifecycle (creation/deletion)
- State commits and checkpoints
- Access list tracking (EIP-2929)

#### `gas_and_execution.zig` - Gas and Execution Events
- Gas tracking (refunds, stipends, intrinsic)
- Memory expansion
- Function selector detection
- External code operations
- Jump analysis
- EIP-1559 fee tracking
- EIP-4844 blob operations
- Coinbase interactions

#### `token.zig` - Token Detection Events
- ERC20 operations and detection
- ERC721/ERC1155 events
- Token pattern recognition
- Function selector matching
- Event signature detection

#### `defi.zig` - DeFi Protocol Events
- MEV detection (arbitrage, sandwiches)
- Flash loans
- DEX swaps
- Protocol detection:
  - Uniswap (V1-V4)
  - Compound
  - Aave
  - MakerDAO
  - Curve

#### `proxy_and_contracts.zig` - Contract Pattern Events
- Diamond proxy (EIP-2535)
- Proxy patterns (transparent, UUPS, beacon)
- Multi-signature wallets
- Timelock contracts
- ENS operations

#### `mainnet_and_layer2.zig` - Chain-Specific Events
- Beacon chain deposits (staking)
- Validator withdrawals
- Slashing events
- Sync committee updates
- Layer 2 bridges
- Rollup batches
- State root publications

## Usage

```zig
const events = @import("tracer/events/events.zig");

// Create an event
const transfer_event = events.EvmEvent{
    .erc20_transfer = events.token.Erc20Transfer{
        .token = token_address,
        .from = sender,
        .to = receiver,
        .amount = value,
        // ...
    }
};

// Get event metadata
const category = events.getEventCategory(transfer_event);
const severity = events.getEventSeverity(transfer_event);

// Check token signatures
if (events.isErc20TransferTopic(topic)) {
    // Handle ERC20 transfer
}
```

## Event Flow

1. **Collection**: Events are emitted during EVM execution
2. **Categorization**: Events are classified by type and severity
3. **Filtering**: Events can be filtered based on criteria
4. **Serialization**: Events can be serialized to various formats
5. **Analysis**: Events enable debugging, monitoring, and analytics

## Adding New Events

1. Choose the appropriate module based on event category
2. Add the event struct definition
3. Add the event to the main `EvmEvent` union in `events.zig`
4. Update categorization and severity mappings
5. Add any supporting types needed

## Design Principles

- **Comprehensive**: Cover all aspects of EVM execution
- **Modular**: Organized by logical categories
- **Type-safe**: Strong typing with Zig's type system
- **Zero-cost**: No runtime overhead when tracing is disabled
- **Standards-compliant**: Match Ethereum JSON-RPC trace formats