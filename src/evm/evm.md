# EVM

Transaction execution orchestrator for Ethereum smart contracts.

## Synopsis

```zig
const EvmType = Evm(config);
var evm = try EvmType.init(allocator, database, block_info, context, gas_price, origin, hardfork);
const result = try evm.call(call_params);
```

## Description

Manages transaction-level execution, call stacks, state transitions, and gas accounting. Coordinates Frame execution contexts, Host interfaces, and database storage for complete EVM operation.

## Architecture & Design

### Core Design Principles

1. **Transaction-Level Orchestration**: Manages complete transaction lifecycle from initiation to completion
2. **Call Stack Management**: Handles nested call depth tracking with configurable limits
3. **State Consistency**: Ensures atomic state changes through snapshot-based rollback
4. **Resource Management**: Comprehensive gas accounting and memory allocation tracking
5. **Modular Integration**: Clean interfaces with Frame, Host, Database, and Planner components

### EVM Architecture

```zig
pub fn Evm(comptime config: EvmConfig) type {
    return struct {
        // Core Execution State
        depth: DepthType,                           // Current call depth (0 = root)
        static_stack: [max_call_depth]bool,        // Static call context tracking
        
        // Resource Management
        allocator: std.mem.Allocator,              // Memory allocator
        database: DatabaseInterface,               // State storage interface
        
        // Transaction State Tracking
        journal: JournalType,                      // State change journal for rollback
        created_contracts: CreatedContracts,       // EIP-6780 contract creation tracking
        self_destruct: SelfDestruct,              // SELFDESTRUCT operation tracking
        access_list: AccessList,                   // EIP-2929 warm/cold access tracking
        
        // Execution Environment
        block_info: BlockInfo,                     // Block-level information
        context: TransactionContext,               // Transaction context
        hardfork_config: Hardfork,                // Network upgrade configuration
        
        // Runtime State
        current_input: []const u8,                 // Current call input data
        return_data: []const u8,                   // Last call return data
        gas_price: u256,                          // Transaction gas price
        origin: Address,                          // Transaction originator (tx.origin)
        
        // Component Integration
        planner: PlannerType,                     // Bytecode analysis and optimization
        logs: ArrayList(Log),                     // Transaction event logs
        current_snapshot_id: SnapshotIdType,      // Active journal snapshot
    };
}
```

### Smart Configuration System

The EVM uses intelligent type selection based on configuration parameters:

```zig
pub const EvmConfig = struct {
    max_call_depth: u11 = 1024,              // Maximum call stack depth
    max_input_size: u18 = 131072,             // 128KB input limit
    frame_config: FrameConfig = .{ .has_database = true },
    enable_precompiles: bool = true,          // Precompiled contract support
    planner_strategy: PlannerStrategy = .minimal,
    block_info_config: BlockInfoConfig = .{},
    
    // Smart type selection for call depth tracking
    pub fn get_depth_type(self: EvmConfig) type {
        return if (self.max_call_depth <= std.math.maxInt(u8))
            u8   // Standard depth fits in u8
        else if (self.max_call_depth <= std.math.maxInt(u11))
            u11  // Extended depth
        else
            @compileError("max_call_depth too large");
    }
};
```

### Journal Integration

The EVM integrates a configurable journal system for state management:

```zig
// Journal configuration based on EVM settings
const journal_config = JournalConfig{
    .SnapshotIdType = if (config.max_call_depth <= 255) u8 else u16,
    .WordType = config.frame_config.WordType,
    .NonceType = u64,
    .initial_capacity = 128,
};
```

## API Reference

### EVM Creation and Management

```zig
// Create EVM instance with full context
pub fn init(
    allocator: std.mem.Allocator,
    database: DatabaseInterface,
    block_info: BlockInfo,
    context: TransactionContext, 
    gas_price: u256,
    origin: Address,
    hardfork_config: Hardfork
) !Self

// Clean up EVM resources
pub fn deinit(self: *Self) void

// Configuration examples
const config = EvmConfig{
    .max_call_depth = 1024,
    .max_input_size = 131072,
    .frame_config = .{
        .stack_size = 1024,
        .has_database = true,
        .TracerType = NoOpTracer,
    },
    .enable_precompiles = true,
    .planner_strategy = .minimal,
};

const EvmType = Evm(config);
```

### Transaction Context Setup

```zig
// Block information
const block_info = BlockInfo{
    .number = 18_000_000,
    .timestamp = 1672531200,
    .difficulty = 0,                    // Post-merge (proof-of-stake)
    .gas_limit = 30_000_000,
    .coinbase = miner_address,
    .base_fee = 20_000_000_000,        // 20 gwei
    .prev_randao = random_seed,
};

// Transaction context
const tx_context = TransactionContext{
    .gas_limit = 21_000_000,
    .coinbase = miner_address,
    .chain_id = 1,                     // Ethereum mainnet
};

// Initialize EVM with context
var evm = try EvmType.init(
    allocator,
    database,
    block_info,
    tx_context,
    20_000_000_000,    // gas_price (20 gwei)
    sender_address,    // tx.origin
    .CANCUN            // Latest hardfork
);
```

### Call Operations

#### Main Call Entry Point

```zig
// Primary entry point - routes to appropriate handler
pub fn call(self: *Self, params: CallParams) Error!CallResult

// CallParams union supports all operation types:
const call_params = CallParams{ .call = .{
    .caller = sender_address,
    .to = contract_address,
    .value = 1000000000000000000,  // 1 ETH in wei
    .input = calldata,
    .gas = 100000,
}};

const result = try evm.call(call_params);
```

#### Regular CALL Operation

```zig
// CALL: Execute contract with value transfer
pub fn call_regular(self: *Self, params: anytype) Error!CallResult

// Features:
// - Balance validation and transfer
// - Precompile detection and execution
// - Contract code retrieval and execution
// - Automatic snapshot creation and rollback
// - Gas limit validation and depth checking

const call_result = try evm.call_regular(.{
    .caller = from_address,
    .to = to_address,
    .value = wei_amount,
    .input = function_call_data,
    .gas = gas_limit,
});

if (call_result.success) {
    // Handle successful execution
    const output = call_result.output;
    const gas_used = original_gas - call_result.gas_left;
} else {
    // Handle failure or revert
    const revert_data = call_result.output;
}
```

#### DELEGATECALL Operation

```zig
// DELEGATECALL: Execute external code in caller context
pub fn delegatecall_handler(self: *Self, params: anytype) Error!CallResult

// Key characteristics:
// - Preserves original caller (msg.sender)
// - Uses caller's storage and balance
// - No value transfer (preserves parent value)
// - Useful for proxy contracts and libraries

const delegate_params = .{
    .caller = original_caller,  // Preserved from parent call
    .to = library_address,      // Code source
    .input = function_data,
    .gas = available_gas,
};
```

#### STATICCALL Operation

```zig
// STATICCALL: Read-only contract execution
pub fn staticcall_handler(self: *Self, params: anytype) Error!CallResult

// Characteristics:
// - No state modifications allowed
// - No value transfer (always 0)
// - Reverts on any state-changing operation
// - Used for view/pure functions

const static_params = .{
    .caller = msg_sender,
    .to = contract_address,
    .input = view_function_data,
    .gas = gas_limit,
};
```

#### Contract Creation Operations

```zig
// CREATE: Deploy new contract
pub fn create_handler(self: *Self, params: anytype) Error!CallResult

// CREATE2: Deploy with deterministic address  
pub fn create2_handler(self: *Self, params: anytype) Error!CallResult

// CREATE parameters
const create_params = .{
    .caller = deployer_address,
    .value = initial_balance,
    .init_code = constructor_bytecode,
    .gas = deployment_gas,
};

// CREATE2 parameters (adds salt for address determination)
const create2_params = .{
    .caller = deployer_address,
    .value = initial_balance,
    .init_code = constructor_bytecode,
    .salt = deterministic_salt,
    .gas = deployment_gas,
};
```

### Core Execution Engine

```zig
// Internal frame execution with full context
fn execute_frame(
    self: *Self,
    code: []const u8,              // Contract bytecode
    input: []const u8,             // Call input data
    gas: u64,                      // Gas limit
    address: Address,              // Execution context address
    caller: Address,               // Message sender
    value: u256,                   // Value being transferred
    is_static: bool,               // Static call restriction
    snapshot_id: SnapshotIdType    // Journal snapshot for rollback
) !CallResult

// Process:
// 1. Increment call depth with automatic cleanup
// 2. Create FrameInterpreter with configuration
// 3. Execute bytecode through interpreter
// 4. Handle execution results and errors
// 5. Convert Frame errors to CallResult format
```

### State Management

#### Journal Operations

```zig
// Create snapshot for rollback capability
fn create_snapshot(self: *Self) SnapshotIdType {
    return self.journal.create_snapshot();
}

// Revert to previous state
fn revert_to_snapshot(self: *Self, snapshot_id: SnapshotIdType) void {
    self.journal.revert_to_snapshot(snapshot_id);
}

// Usage pattern
const snapshot = evm.create_snapshot();
// ... perform operations that might fail ...
if (should_revert) {
    evm.revert_to_snapshot(snapshot);
}
```

#### Contract Lifecycle Tracking

```zig
// EIP-6780: Track contracts created in current transaction
created_contracts: CreatedContracts,

// Register new contract creation
try evm.created_contracts.register(new_contract_address);

// Check if contract was created in this transaction
const was_created = evm.created_contracts.contains(contract_address);

// SELFDESTRUCT tracking
self_destruct: SelfDestruct,

// Mark contract for destruction
try evm.self_destruct.mark(contract_address, beneficiary_address);
```

#### Access List Management (EIP-2929)

```zig
// Warm/cold access tracking for gas optimization
access_list: AccessList,

// Access address (returns gas cost)
const gas_cost = try evm.access_list.access_address(address);

// Access storage slot
const storage_gas = try evm.access_list.access_storage(address, slot);

// Pre-warm addresses/storage for reduced costs
try evm.access_list.warm_address(prewarmed_address);
try evm.access_list.warm_storage(address, slot);
```

### Log Management

```zig
// Event log collection and management
logs: std.ArrayList(Log),

// Internal log collection
fn emit_log(self: *Self, address: Address, topics: []const u256, data: []const u8) !void {
    const log = Log{
        .address = address,
        .topics = try self.allocator.dupe(u256, topics),
        .data = try self.allocator.dupe(u8, data),
    };
    try self.logs.append(log);
}

// Extract logs for transaction result
fn takeLogs(self: *Self) []const Log {
    const result = self.logs.toOwnedSlice() catch &.{};
    return result;
}
```

### Precompiled Contracts

```zig
// Precompile execution when enabled
if (config.enable_precompiles and precompiles.is_precompile(address)) {
    const result = try self.execute_precompile_call(
        address,
        input,
        gas,
        is_static
    );
}

// Supported precompiles:
// 0x01: ECDSA recovery
// 0x02: SHA-256 hash
// 0x03: RIPEMD-160 hash  
// 0x04: Identity (datacopy)
// 0x05: Modular exponentiation
// 0x06-0x08: Elliptic curve operations (BN254)
// 0x09: Blake2f compression
```

## Performance Characteristics

### Memory Layout Optimization

The EVM is designed for cache efficiency and minimal memory allocation:

```zig
// Hot path fields grouped for cache locality
depth: DepthType,                    // 1-2 bytes
allocator: std.mem.Allocator,        // 8 bytes  
database: DatabaseInterface,         // 16 bytes (vtable interface)
journal: JournalType,               // Variable size, pre-allocated

// Component interfaces (minimal overhead)
created_contracts: CreatedContracts, // HashMap with pre-allocation
self_destruct: SelfDestruct,        // HashMap with pre-allocation  
access_list: AccessList,            // Optimized warm/cold tracking
planner: PlannerType,               // LRU cache with configurable size
```

### Call Stack Performance

1. **Depth Tracking**: Smart type selection (u8/u11) based on max_call_depth
2. **Static Stack**: Fixed-size boolean array for static context tracking
3. **Branch Optimization**: Cold branch hints for depth limit checks

```zig
// Depth limit check with branch hint
if (self.depth >= config.max_call_depth) {
    @branchHint(.cold);  // Rare in normal execution
    return CallResult.failure(0);
}
```

### Resource Management

1. **Pre-allocated Capacity**: Journal, logs, and data structures start with reasonable sizes
2. **Lazy Allocation**: Components only allocate when needed
3. **Automatic Cleanup**: RAII patterns with defer statements
4. **Memory Pooling**: Reuse of temporary allocations where possible

### Gas Accounting Performance

```zig
// Efficient gas type conversion and bounds checking
const gas_i32 = @as(i32, @intCast(@min(gas, std.math.maxInt(i32))));

// Fast gas remaining calculation
const gas_left = @as(u64, @intCast(@max(interpreter.frame.gas_remaining, 0)));
```

### Journal System Benefits

1. **Snapshot Creation**: O(1) operation (simple counter increment)
2. **Rollback Performance**: O(n) where n = entries since snapshot
3. **Memory Efficiency**: ArrayList with automatic growth and capacity retention

## Testing

### Test Coverage

EVM testing covers all major functionality areas:

1. **Call Operations**: All call types with various parameter combinations
2. **State Management**: Journal snapshots, rollback scenarios
3. **Error Handling**: Comprehensive error condition testing
4. **Resource Limits**: Call depth, input size, gas limit validation
5. **Integration**: Database, Host, Frame, and Planner coordination
6. **Configuration**: Different configuration options and type selection
7. **Precompiles**: Precompiled contract execution and edge cases

### Test Execution

```bash
# Run all EVM tests
zig build test

# Run EVM-specific tests
zig build test -- --test-filter "EVM"

# Debug logging during tests
const test_config = EvmConfig{
    .frame_config = .{
        .TracerType = DebuggingTracer,
        .has_database = true,
    },
};
```

### Critical Test Scenarios

```zig
test "EVM call_regular handler basic functionality" {
    const allocator = std.testing.allocator;
    const config = EvmConfig{};
    const EvmType = Evm(config);
    
    // Setup test environment
    var db = MemoryDatabase.init(allocator);
    defer db.deinit();
    
    var evm = try EvmType.init(
        allocator,
        db.to_database_interface(),
        test_block_info,
        test_tx_context,
        20_000_000_000,
        sender_address,
        .CANCUN
    );
    defer evm.deinit();
    
    // Test successful call
    const call_params = CallParams{ .call = .{
        .caller = sender_address,
        .to = contract_address,
        .value = 0,
        .input = &.{},
        .gas = 100000,
    }};
    
    const result = try evm.call(call_params);
    try std.testing.expect(result.success);
    try std.testing.expectEqual(@as(u64, 100000), result.gas_left);
}

test "EVM nested call depth tracking" {
    // ... test call depth limits and stack management
}

test "EVM state rollback functionality" {
    // ... test journal snapshots and state reversion
}

test "EVM gas accounting accuracy" {
    // ... verify precise gas consumption calculation
}
```

## Context within EVM

### Integration with Frame Execution

The EVM coordinates Frame execution for bytecode processing:

```zig
// EVM creates and manages Frame instances
var interpreter = try FrameInterpreter(config.frame_config).init(
    self.allocator,
    contract_code,
    gas_limit,
    self.database
);
defer interpreter.deinit();

// Execute through Frame interpreter
const result = try interpreter.execute();

// Convert Frame errors to EVM CallResult
return switch (exec_error) {
    error.STOP => CallResult.success_with_output(gas_left, output),
    error.REVERT => CallResult.revert_with_data(gas_left, output),
    error.OutOfGas => CallResult.failure(0),
    // ... other error mappings
};
```

### Host Interface Integration

EVM implements the Host interface for Frame operations:

```zig
// EVM serves as Host for Frame external operations
const host = Host.init(&evm);

// Frame delegates external operations to EVM
frame.host = host;

// EVM handles Host interface methods:
// - get_balance, get_code, get_storage
// - emit_log, inner_call, create_snapshot
// - access_address, access_storage_slot
// - block information and transaction context
```

### Database Coordination

The EVM manages state through the database interface:

```zig
// EVM coordinates database operations
database: DatabaseInterface,

// Account management
const account = try evm.database.get_account(address);
try evm.database.set_account(address, modified_account);

// Storage operations with journal integration
const original_value = try evm.database.get_storage(address, key);
try evm.journal.record_storage_change(snapshot, address, key, original_value);
try evm.database.set_storage(address, key, new_value);
```

### Planner Integration

The EVM uses the Planner for bytecode optimization:

```zig
// EVM maintains planner instance with LRU cache
planner: PlannerType,

// Bytecode optimization workflow
const plan = try evm.planner.create_plan(contract_bytecode);
defer plan.deinit();

// Plan provides optimized instruction stream for Frame execution
const result = try evm.execute_plan(plan, frame);
```

## EVM Specification Compliance

### Call Semantics

1. **CALL**: Regular call with value transfer and target context
2. **CALLCODE**: Execute target code in caller context (deprecated)
3. **DELEGATECALL**: Preserve original caller and value, use caller storage
4. **STATICCALL**: Read-only execution, no state modifications allowed
5. **CREATE/CREATE2**: Contract deployment with initialization code execution

### Gas Model Accuracy

1. **Base Costs**: Exact gas consumption per EVM specification
2. **Dynamic Costs**: Memory expansion, storage access patterns, precompiles
3. **Call Costs**: Address access, value transfer, account creation
4. **Refund Calculation**: SSTORE refunds, SELFDESTRUCT refunds

### State Transition Rules

1. **Atomicity**: Complete success or complete rollback for each call
2. **Journal Consistency**: All state changes tracked for accurate rollback
3. **Access List**: EIP-2929 warm/cold access cost implementation
4. **Contract Creation**: EIP-6780 SELFDESTRUCT restrictions

### Hard Fork Support

```zig
hardfork_config: Hardfork,

// Hard fork conditional behavior
if (evm.hardfork_config.is_at_least(.BERLIN)) {
    // EIP-2929: Access list gas costs
    gas_cost = if (is_warm) 100 else 2600;
}

if (evm.hardfork_config.is_at_least(.LONDON)) {
    // EIP-1559: Base fee mechanics
    // EIP-3529: Reduced gas refunds
}

if (evm.hardfork_config.is_at_least(.CANCUN)) {
    // EIP-4844: Blob transactions
    // EIP-1153: Transient storage
    // EIP-6780: SELFDESTRUCT restrictions
}
```

### Error Handling Compliance

The EVM provides comprehensive error handling for all failure modes:

```zig
pub const Error = error{
    InvalidJump,          // JUMP to invalid destination
    OutOfGas,            // Insufficient gas for operation  
    StackUnderflow,      // Stack underflow condition
    StackOverflow,       // Stack overflow condition
    ContractNotFound,    // Contract code not available
    PrecompileError,     // Precompiled contract failure
    MemoryError,         // Memory operation failure
    StorageError,        // Storage operation failure
    CallDepthExceeded,   // Maximum call depth reached
    InsufficientBalance, // Insufficient balance for value transfer
    ContractCollision,   // Contract address collision
    InvalidBytecode,     // Malformed bytecode
    StaticCallViolation, // State modification in static context
    InvalidOpcode,       // Undefined opcode encountered
    RevertExecution,     // REVERT opcode execution
    Stop,               // STOP opcode (normal termination)
};
```

### Predefined Configurations

```zig
// Performance-optimized configuration
const fast_config = EvmConfig.optimizeFast();  // Uses .advanced planner

// Size-optimized configuration
const small_config = EvmConfig.optimizeSmall(); // Uses .minimal planner

// Custom configuration
const custom_config = EvmConfig{
    .max_call_depth = 512,        // Reduced call depth
    .max_input_size = 65536,      // 64KB input limit
    .enable_precompiles = false,   // Disable precompiles
    .planner_strategy = .minimal,  // Minimal optimization
    .frame_config = .{
        .stack_size = 512,         // Smaller stack
        .memory_limit = 1048576,   // 1MB memory limit
        .has_database = true,
        .TracerType = NoOpTracer,  // No tracing overhead
    },
};
```

The EVM serves as the comprehensive transaction execution engine, orchestrating all aspects of smart contract execution while maintaining strict EVM specification compliance, optimal performance characteristics, and clean architectural boundaries with integrated components.