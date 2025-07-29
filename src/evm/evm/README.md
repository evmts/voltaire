# EVM Core Execution

Core VM execution logic for contract calls, creation, and state modifications. This folder contains the heart of the EVM implementation, handling all contract interactions and execution flow.

## Purpose

This directory implements the core execution engine that:
- Executes contract calls (CALL, DELEGATECALL, STATICCALL, CALLCODE)
- Creates new contracts (CREATE, CREATE2)
- Manages execution context and call frames
- Handles state modifications (storage, logs, balance changes)
- Validates operations and enforces EVM rules
- Manages gas consumption and refunds

## Architecture

The execution model follows a call stack approach where:
1. Each contract call creates a new execution frame
2. Frames maintain their own memory, stack, and return data
3. State changes are journaled for potential reversion
4. Gas is tracked and consumed throughout execution

## Files

### Core Execution Engine

#### `interpret.zig`
Main interpreter loop that executes EVM bytecode.

**Key Functions**:
- `interpret()`: Core interpreter that fetches and executes opcodes
- Manages program counter advancement
- Handles gas consumption per operation
- Dispatches to opcode implementations via jump table

**Execution Flow**:
1. Fetch opcode at current PC
2. Check and consume gas
3. Execute operation via jump table
4. Handle result (continue, return, revert, etc.)
5. Advance PC and repeat

**Used By**: All contract execution paths (calls and creates)

#### `run_result.zig`
Defines execution result types and outcomes.

**Result Types**:
- `Continue`: Normal execution continues
- `Stop`: STOP opcode or end of code
- `Return`: Successful return with data
- `SelfDestruct`: Contract self-destruction
- `Revert`: Execution reverted
- `CallOrCreate`: Nested call/create needed

**Gas Handling**:
- Tracks gas used vs gas refunded
- Manages gas stipends for calls
- Handles out-of-gas scenarios

**Used By**: Interpreter and all execution functions

### Contract Call Operations

#### `call_contract.zig`
Implements the CALL opcode for external contract calls.

**Features**:
- Value transfer with balance checks
- Gas stipend calculation (2300 gas for non-zero value)
- Input/output memory management
- Call depth limit enforcement (1024)

**Process**:
1. Validate caller has sufficient balance
2. Create new call frame with specified gas
3. Transfer value (if any)
4. Execute called contract
5. Copy return data to caller's memory

**Used By**: CALL opcode (0xF1)

#### `delegatecall_contract.zig`
Implements DELEGATECALL for code execution in caller's context.

**Key Differences from CALL**:
- Preserves original sender and value
- No value transfer occurs
- Storage modifications affect caller's storage
- Used for library/proxy patterns

**Security**: Validates no value transfer attempted

**Used By**: DELEGATECALL opcode (0xF4)

#### `staticcall_contract.zig`
Implements STATICCALL for read-only contract calls.

**Features**:
- Enforces read-only execution (no state changes)
- No value transfer allowed
- Reverts on any state modification attempt
- Used for view/pure functions

**Validation**: Sets static context flag preventing writes

**Used By**: STATICCALL opcode (0xFA)

#### `callcode_contract.zig`
Implements deprecated CALLCODE opcode.

**Behavior**:
- Executes code in caller's context (like DELEGATECALL)
- Can transfer value (unlike DELEGATECALL)
- Deprecated in favor of DELEGATECALL
- Maintained for backwards compatibility

**Used By**: CALLCODE opcode (0xF2)

### Contract Creation Operations

#### `create_contract.zig`
Implements CREATE opcode for deploying new contracts.

**Process**:
1. Generate contract address (sender + nonce)
2. Check address doesn't exist
3. Transfer endowment value
4. Execute initialization code
5. Store resulting code (if successful)
6. Enforce code size limit (24KB)

**Gas**: Charges 32,000 base + code storage costs

**Used By**: CREATE opcode (0xF0)

#### `create2_contract.zig`
Implements CREATE2 for deterministic contract addresses.

**Address Formula**: `keccak256(0xff || sender || salt || keccak256(init_code))`

**Benefits**:
- Predictable addresses before deployment
- Counterfactual instantiation
- Same address on any chain

**Used By**: CREATE2 opcode (0xF5)

#### `create_contract_internal.zig`
Shared logic for both CREATE and CREATE2.

**Common Steps**:
- Nonce increment
- Balance checks and transfers
- Init code execution
- Code storage and size validation
- Gas refund calculation

**Used By**: CREATE and CREATE2 implementations

#### `create_contract_protected.zig` / `create2_contract_protected.zig`
Journal-wrapped versions ensuring atomic state changes.

**Features**:
- Automatic state reversion on failure
- Journal checkpoint management
- Clean error handling

**Used By**: High-level create operations

### State Modification Operations

#### `emit_log.zig` / `emit_log_protected.zig`
Implements LOG0-LOG4 opcodes for event emission.

**Validation**:
- Checks static context (no logs in read-only calls)
- Validates topic count (0-4)
- Manages memory access for log data

**Gas**: 375 base + 375 per topic + 8 per byte

**Used By**: LOG0 (0xA0) through LOG4 (0xA4)

#### `set_storage_protected.zig`
Protected storage modification with journaling.

**Features**:
- Records original value for reversion
- Calculates gas refunds for storage cleanup
- Implements EIP-2200 gas calculations

**Used By**: SSTORE operations

#### `set_balance_protected.zig`
Protected balance modifications with journaling.

**Safety**: Ensures atomic balance updates with automatic reversion

**Used By**: Value transfers in calls/creates

#### `set_code_protected.zig`
Protected code storage for contract deployment.

**Validation**:
- Enforces 24KB code size limit
- Calculates deployment gas costs
- Journals for atomic updates

**Used By**: Contract creation finalization

#### `set_transient_storage_protected.zig`
Protected transient storage (EIP-1153) modifications.

**Features**:
- Transaction-scoped storage
- Automatic cleanup after transaction
- No gas refunds (always warm)

**Used By**: TSTORE operations

#### `selfdestruct_protected.zig`
Implements SELFDESTRUCT with state protection.

**Process**:
1. Mark contract for destruction
2. Transfer balance to beneficiary
3. Clear contract code and storage
4. Add to selfdestruct set

**Note**: Actual cleanup may be deferred (EIP-6049)

**Used By**: SELFDESTRUCT opcode (0xFF)

### Utility Functions

#### `execute_precompile_call.zig`
Executes calls to precompiled contracts (addresses 1-9).

**Precompiles**:
- 0x1: ECRECOVER
- 0x2: SHA256
- 0x3: RIPEMD160
- 0x4: IDENTITY
- 0x5: MODEXP
- 0x6-0x8: BN254 operations
- 0x9: BLAKE2F

**Used By**: Call operations to precompile addresses

#### `validate_static_context.zig`
Ensures no state modifications in static calls.

**Prevents**:
- Storage writes (SSTORE)
- Log emissions (LOG*)
- Contract creation
- Self destruction
- Balance modifications

**Used By**: All state-modifying operations

#### `validate_value_transfer.zig`
Validates balance sufficiency for value transfers.

**Checks**:
- Sender has sufficient balance
- No overflow in calculations
- No value in static calls

**Used By**: All value-transferring operations

#### `set_context.zig`
Updates execution context for contract calls.

**Manages**:
- Sender/receiver addresses
- Code being executed
- Value being transferred
- Gas limits

**Used By**: All call operations

#### `return_data.zig`
Manages return data buffer accessibility.

**Rules**:
- Set after any call completes
- Cleared at transaction start
- Available via RETURNDATASIZE/RETURNDATACOPY

**Used By**: Call operations and return opcodes

### Result Types

#### `call_result.zig`
Result structure for call operations.

**Contains**:
- Success/failure status
- Gas consumed/refunded
- Return data
- State changes to apply/revert

**Used By**: All call operations

#### `create_result.zig`
Result structure for create operations.

**Contains**:
- Created contract address
- Success/failure status
- Deployment gas costs
- Init code return data

**Used By**: CREATE/CREATE2 operations

## Execution Flow

### Contract Call Flow
1. Caller prepares gas, value, and input data
2. VM validates call (depth, balance, gas)
3. New execution frame created
4. Context switched to called contract
5. Bytecode interpreted until completion
6. Results returned to caller
7. State changes applied or reverted

### Contract Creation Flow
1. Creator prepares value and init code
2. VM generates contract address
3. Address availability checked
4. New frame created for init code
5. Init code executed
6. Resulting code stored (with size check)
7. Address returned to creator

## Error Handling

Execution can fail due to:
- Out of gas
- Stack overflow/underflow
- Invalid opcode
- Call depth exceeded
- Insufficient balance
- State modification in static context
- Code size limit exceeded
- Address collision (CREATE2)

All errors result in:
- State changes reverted (via journal)
- Gas consumed (no refund)
- Error propagated to caller

## Gas Management

Gas is consumed for:
- Each opcode execution (base cost)
- Memory expansion
- Storage operations
- Call stipends
- Contract creation
- Precompile execution

Gas is refunded for:
- Storage cleanup (setting to zero)
- Self-destruct (in some cases)

## Security Considerations

- Call depth limited to 1024
- Code size limited to 24KB
- Stack limited to 1024 items
- Memory expansion has quadratic cost
- Reentrancy protection via gas limits
- Static calls prevent state modification
- Balance checks prevent overdrafts

## Testing

Each file includes comprehensive tests covering:
- Success and failure cases
- Gas consumption accuracy
- State change verification
- Edge cases and error conditions
- Integration with other components