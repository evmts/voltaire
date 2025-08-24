# Host Documentation

## Overview

The Host interface provides the EVM with access to blockchain state and external services through a clean, vtable-based abstraction. It handles all operations that require interaction beyond the current execution context, including account queries, storage operations, nested calls, event logging, and blockchain environment access.

## Architecture & Design

### Core Design Principles

1. **Zero-Cost Abstraction**: Function pointers eliminate virtual dispatch overhead
2. **Type Safety**: Compile-time interface validation with clear error types  
3. **Complete Interface**: All EVM external operations supported through single interface
4. **Implementation Agnostic**: Works with memory databases, persistent storage, or network backends
5. **Hard Fork Awareness**: Built-in support for different Ethereum protocol versions

### Host Interface Structure

```zig
pub const Host = struct {
    ptr: *anyopaque,           // Pointer to implementation
    vtable: *const VTable,     // Function pointer table
    
    pub const VTable = struct {
        // Account and balance operations
        get_balance: *const fn (ptr: *anyopaque, address: Address) u256,
        account_exists: *const fn (ptr: *anyopaque, address: Address) bool,
        get_code: *const fn (ptr: *anyopaque, address: Address) []const u8,
        
        // Storage operations
        get_storage: *const fn (ptr: *anyopaque, address: Address, slot: u256) u256,
        set_storage: *const fn (ptr: *anyopaque, address: Address, slot: u256, value: u256) anyerror!void,
        
        // Call operations
        inner_call: *const fn (ptr: *anyopaque, params: CallParams) anyerror!CallResult,
        
        // Event logging
        emit_log: *const fn (ptr: *anyopaque, contract_address: Address, topics: []const u256, data: []const u8) void,
        
        // State management
        create_snapshot: *const fn (ptr: *anyopaque) u32,
        revert_to_snapshot: *const fn (ptr: *anyopaque, snapshot_id: u32) void,
        
        // ... complete interface definition
    };
};
```

## API Reference

### Host Interface Creation

```zig
// Create Host interface from any implementation
pub fn init(implementation: anytype) Host

// Usage example:
var my_host_impl = MyHostImpl.init();
const host = Host.init(&my_host_impl);
```

**Requirements**: Implementation must be a pointer to a struct with methods matching the VTable interface.

### Account Operations

#### Balance and Existence

```zig
// Get account balance
get_balance(address: Address) u256

// Check if account exists
account_exists(address: Address) bool

// Get contract code
get_code(address: Address) []const u8
```

**EVM Usage**: ADDRESS, BALANCE, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH opcodes

#### Storage Operations

```zig
// Get storage value
get_storage(address: Address, slot: u256) u256

// Set storage value (with gas cost tracking)
set_storage(address: Address, slot: u256, value: u256) !void
```

**EVM Usage**: SLOAD, SSTORE opcodes with EIP-2929 gas cost calculation

### Call Operations

#### Inner Calls

```zig
// Execute nested EVM call
inner_call(params: CallParams) !CallResult
```

**Supported Call Types**:
- `CALL`: Regular contract call with value transfer
- `CALLCODE`: Execute external code in current context (deprecated)  
- `DELEGATECALL`: Execute external code preserving caller context
- `STATICCALL`: Read-only contract call
- `CREATE`: Deploy new contract
- `CREATE2`: Deploy contract with deterministic address

### Event System

```zig
// Emit log event
emit_log(
    contract_address: Address, 
    topics: []const u256, 
    data: []const u8
) void
```

**EVM Usage**: LOG0, LOG1, LOG2, LOG3, LOG4 opcodes for smart contract events

### State Management

#### Journal Integration

```zig
// Create snapshot for rollback
create_snapshot() u32

// Revert to previous snapshot  
revert_to_snapshot(snapshot_id: u32) void

// Record original values for gas refunds
record_storage_change(address: Address, slot: u256, original_value: u256) !void
get_original_storage(address: Address, slot: u256) ?u256
```

**Usage**: Enables proper transaction rollback and gas refund calculation

### Access List (EIP-2929)

```zig
// Access address and return gas cost
access_address(address: Address) !u64

// Access storage slot and return gas cost  
access_storage_slot(contract_address: Address, slot: u256) !u64
```

**Gas Costs**:
- **Cold Access**: 2600 gas for address, 2100 gas for storage
- **Warm Access**: 100 gas for both address and storage
- **Pre-warming**: Transaction access lists reduce costs

### Contract Lifecycle

#### Creation Tracking (EIP-6780)

```zig
// Register contract as created in current transaction
register_created_contract(address: Address) !void

// Check if contract was created in current transaction
was_created_in_tx(address: Address) bool
```

**Usage**: SELFDESTRUCT only allowed for contracts created in same transaction

#### Destruction Tracking

```zig
// Mark contract for destruction
mark_for_destruction(contract_address: Address, recipient: Address) !void
```

**Usage**: SELFDESTRUCT opcode implementation with EIP-6780 compliance

### Blockchain Environment

#### Block Information

```zig
// Get current block information
get_block_info() BlockInfo

// Get block hash by number
get_block_hash(block_number: u64) ?[32]u8
```

**EVM Usage**: BLOCKHASH, COINBASE, TIMESTAMP, NUMBER, DIFFICULTY, GASLIMIT opcodes

#### Transaction Context

```zig
// Get transaction gas price
get_gas_price() u256

// Get current call input/calldata
get_input() []const u8

// Get return data from last call
get_return_data() []const u8

// Get chain ID
get_chain_id() u16
```

**EVM Usage**: GASPRICE, CALLDATALOAD, CALLDATASIZE, RETURNDATASIZE, CHAINID opcodes

#### EIP-4844 Blob Transactions

```zig
// Get blob hash for given index
get_blob_hash(index: u256) ?[32]u8

// Get blob base fee
get_blob_base_fee() u256
```

**EVM Usage**: BLOBHASH, BLOBBASEFEE opcodes for data availability

### Hard Fork Support

```zig
// Check if hard fork is active
is_hardfork_at_least(target: Hardfork) bool

// Get current hard fork
get_hardfork() Hardfork
```

**Usage**: Enables conditional opcode behavior based on network upgrade status

### Call Frame Metadata

```zig
// Check if current context is static (read-only)
get_is_static() bool

// Get current call depth
get_depth() u11
```

**Usage**: Static call enforcement, call depth limit validation

## Call Parameters and Results

### CallParams Structure

```zig
pub const CallParams = union(enum) {
    call: struct {
        caller: Address,
        to: Address,
        value: u256,
        input: []const u8,
        gas: u64,
    },
    
    delegatecall: struct {
        caller: Address,      // Original caller, not current contract
        to: Address,
        input: []const u8,
        gas: u64,
    },
    
    staticcall: struct {
        caller: Address,
        to: Address,
        input: []const u8,
        gas: u64,
    },
    
    create: struct {
        caller: Address,
        value: u256,
        init_code: []const u8,
        gas: u64,
    },
    
    create2: struct {
        caller: Address,
        value: u256,
        init_code: []const u8,
        salt: u256,
        gas: u64,
    },
    
    // Utility methods
    pub fn getGas(self: CallParams) u64;
    pub fn getCaller(self: CallParams) Address;
    pub fn getInput(self: CallParams) []const u8;
    pub fn hasValue(self: CallParams) bool;
    pub fn isReadOnly(self: CallParams) bool;
    pub fn isCreate(self: CallParams) bool;
};
```

### CallResult Structure

```zig
pub const CallResult = struct {
    success: bool,
    gas_left: u64,
    output: []const u8,
    logs: []const Log = &.{},
    
    // Constructor methods
    pub fn success_with_output(gas_left: u64, output: []const u8) CallResult;
    pub fn success_empty(gas_left: u64) CallResult;
    pub fn failure(gas_left: u64) CallResult;
    pub fn revert_with_data(gas_left: u64, revert_data: []const u8) CallResult;
    
    // Utility methods
    pub fn isSuccess(self: CallResult) bool;
    pub fn isFailure(self: CallResult) bool;
    pub fn hasOutput(self: CallResult) bool;
    pub fn gasConsumed(self: CallResult, original_gas: u64) u64;
};
```

## Performance Characteristics

### Zero-Cost Abstraction

The Host interface compiles to direct function calls:

```zig
// This Host call...
const balance = host.vtable.get_balance(host.ptr, address);

// Compiles to direct function pointer call (no virtual dispatch overhead)
```

**Benefits**:
- No runtime type checking or method lookup
- Equivalent performance to direct function calls
- Compile-time interface validation

### Vtable Generation

The `Host.init()` function generates specialized vtables at compile time:

```zig
// Compile-time generation eliminates runtime overhead
const gen = struct {
    fn vtable_get_balance(ptr: *anyopaque, address: Address) u256 {
        const self: Impl = @ptrCast(@alignCast(ptr));
        return self.get_balance(address);
    }
    // ... other vtable functions generated
};
```

### Call Optimization

- **Inline Candidates**: Simple getter methods often inlined by compiler
- **Branch Prediction**: Consistent calling patterns improve prediction
- **Cache Efficiency**: Vtable stored with Host instance for better locality

## Testing

### Test Coverage

Host interface tests focus on:

1. **Interface Compliance**: All required methods properly implemented
2. **Type Safety**: Correct parameter and return type handling
3. **Call Semantics**: Proper call type behavior and restrictions
4. **Error Handling**: Appropriate error propagation and handling
5. **Performance**: Vtable dispatch overhead measurement

### Test Execution

```bash
# Run all host interface tests
zig build test

# Run host-specific tests
zig build test -- --test-filter "host"
```

### Mock Implementation Testing

Host interfaces are typically tested with mock implementations:

```zig
const MockHost = struct {
    storage: std.HashMap(u256, u256),
    balances: std.HashMap(Address, u256),
    
    pub fn get_balance(self: *@This(), address: Address) u256 {
        return self.balances.get(address) orelse 0;
    }
    
    pub fn get_storage(self: *@This(), address: Address, slot: u256) u256 {
        return self.storage.get(slot) orelse 0;
    }
    
    // ... implement all required methods
};
```

## Context within EVM

### Integration with EVM Execution

The Host is embedded within EVM for external operations:

```zig
pub const Evm = struct {
    host: Host,  // Host interface instance
    
    pub fn execute_transaction(self: *Self, params: CallParams) !CallResult {
        // Use host for nested calls
        return self.host.inner_call(params);
    }
};
```

### Integration with Frame

Frame opcodes delegate external operations to Host:

```zig
// BALANCE opcode implementation
pub fn op_balance(self: *Self) Error!void {
    const address_word = try self.stack.pop();
    const address = Address.from_word(address_word);
    
    // Delegate to host for balance lookup
    const balance = self.host.vtable.get_balance(self.host.ptr, address);
    try self.stack.push(balance);
}
```

### State Change Coordination

Host coordinates state changes with journal system:

```zig
// SSTORE implementation through host
pub fn set_storage(self: *Self, address: Address, slot: u256, value: u256) !void {
    // Check if we need to record original value
    if (self.journal.get_original_storage(address, slot) == null) {
        const original = self.database.get_storage(address, slot);
        try self.journal.record_storage_change(snapshot_id, address, slot, original);
    }
    
    // Apply the change
    try self.database.set_storage(address, slot, value);
}
```

## EVM Specification Compliance

### Call Type Semantics

1. **CALL**: Transfer value, execute in target context
2. **CALLCODE**: Transfer value, execute in caller context (deprecated)
3. **DELEGATECALL**: Preserve value/caller, execute in caller context
4. **STATICCALL**: No state changes allowed, read-only execution
5. **CREATE/CREATE2**: Deploy new contract, run initialization code

### Gas Cost Accuracy

The Host implements accurate EVM gas costs:

1. **Cold vs Warm Access**: EIP-2929 access list gas costs
2. **Storage Refunds**: Original value tracking for SSTORE refunds
3. **Call Costs**: Base costs plus value transfer and account creation
4. **Memory Expansion**: Quadratic growth costs for large memory operations

### Error Handling

Proper error propagation for all EVM failure modes:

1. **Out of Gas**: Stop execution, consume all gas
2. **Stack Overflow/Underflow**: Runtime validation errors
3. **Invalid Jump**: Jump to non-JUMPDEST locations
4. **Revert**: Clean rollback with return data preservation

The Host interface serves as the critical bridge between EVM execution and the broader blockchain environment, enabling secure, efficient, and compliant smart contract execution through a clean, high-performance abstraction layer.