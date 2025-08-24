# Access List Documentation

## Overview

The Access List implements EIP-2929 warm/cold access tracking for gas optimization in the Ethereum Virtual Machine. It maintains separate collections of accessed addresses and storage slots, providing significantly reduced gas costs for subsequent accesses to the same resources. The module is configurable for different gas cost structures and supports pre-warming for transaction initialization.

## Architecture & Design

### Core Design Principles

1. **EIP-2929 Compliance**: Full implementation of warm/cold access mechanics
2. **Performance Optimization**: HashMap-based storage with efficient key hashing  
3. **Configurability**: Customizable gas costs and storage slot types
4. **Memory Efficiency**: Capacity retention between transactions to reduce allocations
5. **Type Safety**: Compile-time configuration validation and strong type checking

### Access List Architecture

```zig
pub fn createAccessList(comptime config: AccessListConfig) type {
    return struct {
        // Resource Management
        allocator: std.mem.Allocator,
        
        // Warm Access Tracking
        addresses: std.AutoHashMap(Address, void),      // Accessed addresses
        storage_slots: std.HashMap(StorageKey, void,    // Accessed storage slots
                                  StorageKeyContext, 80),
        
        // Configuration Constants
        COLD_ACCOUNT_ACCESS_COST: u64 = config.cold_account_access_cost,  // 2600
        WARM_ACCOUNT_ACCESS_COST: u64 = config.warm_account_access_cost,  // 100  
        COLD_SLOAD_COST: u64 = config.cold_sload_cost,                   // 2100
        WARM_SLOAD_COST: u64 = config.warm_sload_cost,                   // 100
    };
}
```

### Storage Key Design

```zig
const StorageKey = struct {
    address: Address,              // Contract address (20 bytes)
    slot: config.SlotType,         // Storage slot (default u256)
};

// High-performance hashing using Wyhash
const StorageKeyContext = struct {
    pub fn hash(self: @This(), key: StorageKey) u64 {
        var hasher = std.hash.Wyhash.init(0);
        hasher.update(&key.address);
        hasher.update(std.mem.asBytes(&key.slot));
        return hasher.final();
    }
    
    pub fn eql(self: @This(), a: StorageKey, b: StorageKey) bool {
        return std.mem.eql(u8, &a.address, &b.address) and a.slot == b.slot;
    }
};
```

### Configuration System

```zig
pub const AccessListConfig = struct {
    // EIP-2929 Standard Gas Costs
    cold_account_access_cost: u64 = 2600,  // Cold account access
    warm_account_access_cost: u64 = 100,   // Warm account access
    cold_sload_cost: u64 = 2100,           // Cold storage access
    warm_sload_cost: u64 = 100,            // Warm storage access
    SlotType: type = u256,                 // Storage slot type
    
    // Compile-time validation
    pub fn validate(comptime self: AccessListConfig) void {
        // Ensures gas costs are non-zero and properly ordered
        // Validates slot type is unsigned integer
    }
};
```

## API Reference

### Factory Function and Types

```zig
// Create configured AccessList type
pub fn createAccessList(comptime config: AccessListConfig) type

// Default implementation using EIP-2929 parameters
pub const AccessList = createAccessList(AccessListConfig{});

// Custom configuration example
const CustomAccessList = createAccessList(.{
    .cold_account_access_cost = 5000,
    .warm_account_access_cost = 200,
    .cold_sload_cost = 4000, 
    .warm_sload_cost = 150,
    .SlotType = u128,  // Smaller storage slots
});
```

### Access List Management

```zig
// Initialize access list
pub fn init(allocator: std.mem.Allocator) Self

// Clean up resources
pub fn deinit(self: *Self) void

// Clear for new transaction (retains capacity)
pub fn clear(self: *Self) void

// Usage example
var access_list = AccessList.init(allocator);
defer access_list.deinit();

// Between transactions
access_list.clear(); // Efficient - retains HashMap capacity
```

### Address Access Operations

```zig
// Access address and return gas cost
pub fn access_address(self: *Self, address: Address) !u64

// Check if address is warm (already accessed)  
pub fn is_address_warm(self: *Self, address: Address) bool

// Usage in EVM opcodes
const address = Address{ /* 20 bytes */ };
const gas_cost = try access_list.access_address(address);

switch (gas_cost) {
    AccessList.COLD_ACCOUNT_ACCESS_COST => {
        // First access - expensive (2600 gas)
        log.debug("Cold address access: {}", .{gas_cost});
    },
    AccessList.WARM_ACCOUNT_ACCESS_COST => {
        // Subsequent access - cheap (100 gas)  
        log.debug("Warm address access: {}", .{gas_cost});
    },
    else => unreachable,
}

// Check warmth without side effects
if (access_list.is_address_warm(address)) {
    // Address has been previously accessed
}
```

### Storage Slot Access Operations

```zig
// Access storage slot and return gas cost
pub fn access_storage_slot(
    self: *Self, 
    address: Address, 
    slot: config.SlotType
) !u64

// Check if storage slot is warm
pub fn is_storage_slot_warm(
    self: *Self, 
    address: Address, 
    slot: config.SlotType
) bool

// Usage in SLOAD/SSTORE operations
const contract_address = Address{ /* contract */ };
const storage_slot: u256 = 0x123456789abcdef;

const gas_cost = try access_list.access_storage_slot(contract_address, storage_slot);

switch (gas_cost) {
    AccessList.COLD_SLOAD_COST => {
        // First access to this slot (2100 gas)
        frame.gas_remaining -= 2100;
    },
    AccessList.WARM_SLOAD_COST => {
        // Subsequent access to this slot (100 gas)
        frame.gas_remaining -= 100;
    },
    else => unreachable,
}

// Warmth checking
if (access_list.is_storage_slot_warm(contract_address, storage_slot)) {
    // Storage slot is warm - subsequent access will be cheap
}
```

### Transaction Initialization

```zig
// Pre-warm addresses for transaction setup
pub fn pre_warm_addresses(self: *Self, addresses: []const Address) !void

// Transaction initialization example
const transaction_addresses = [_]Address{
    tx.origin,           // Transaction sender
    block.coinbase,      // Block miner/validator
    tx.to,              // Transaction target
    precompile_addresses[0..], // Precompiled contracts
};

try access_list.pre_warm_addresses(&transaction_addresses);

// All specified addresses are now warm
for (transaction_addresses) |addr| {
    const cost = try access_list.access_address(addr);
    std.debug.assert(cost == AccessList.WARM_ACCOUNT_ACCESS_COST);
}
```

### Gas Cost Constants

```zig
// EIP-2929 standard gas costs (accessible as constants)
AccessList.COLD_ACCOUNT_ACCESS_COST = 2600;  // Cold account access
AccessList.WARM_ACCOUNT_ACCESS_COST = 100;   // Warm account access  
AccessList.COLD_SLOAD_COST = 2100;           // Cold storage load
AccessList.WARM_SLOAD_COST = 100;            // Warm storage load

// Usage in gas calculation
const base_gas = GasConstants.GasCall;
const access_gas = try access_list.access_address(target_address);
const total_gas = base_gas + access_gas;

if (frame.gas_remaining < total_gas) {
    return error.OutOfGas;
}
frame.gas_remaining -= total_gas;
```

## Performance Characteristics

### HashMap Performance

The Access List uses optimized HashMap implementations:

```zig
// Address tracking - AutoHashMap for simple keys
addresses: std.AutoHashMap(Address, void)

// Storage tracking - Custom HashMap with optimized context
storage_slots: std.HashMap(StorageKey, void, StorageKeyContext, 80)
```

**Benefits**:
- **O(1) Average Access Time**: HashMap provides constant-time lookups
- **Wyhash Algorithm**: High-quality, fast hash function for StorageKey
- **Load Factor**: 80% load factor balances memory usage and collision rate
- **Capacity Retention**: `clear()` preserves capacity to avoid repeated allocations

### Memory Layout Optimization

```zig
// Storage key layout optimized for cache efficiency
const StorageKey = struct {
    address: Address,      // 20 bytes - first in struct for alignment
    slot: config.SlotType, // 32 bytes (u256) - follows address
}; // Total: 52 bytes per key, well-aligned for memory access
```

### Hash Function Performance

```zig
// Wyhash provides excellent performance characteristics:
pub fn hash(self: @This(), key: StorageKey) u64 {
    var hasher = std.hash.Wyhash.init(0);
    hasher.update(&key.address);        // 20 bytes
    hasher.update(std.mem.asBytes(&key.slot)); // 32 bytes  
    return hasher.final();              // Single 64-bit hash
}

// Benefits:
// - Single-pass hashing of 52-byte keys
// - Excellent collision resistance
// - CPU-optimized implementation
// - Branch-free operation for predictable performance
```

### Gas Calculation Efficiency

```zig
// Branch-free gas cost determination using HashMap return values
pub fn access_address(self: *Self, address: Address) !u64 {
    const result = try self.addresses.getOrPut(address);
    // HashMap insert returns found_existing flag
    return if (result.found_existing) 
        WARM_ACCOUNT_ACCESS_COST  // 100 gas
    else 
        COLD_ACCOUNT_ACCESS_COST; // 2600 gas
}
```

### Memory Usage Patterns

1. **Address Storage**: ~24 bytes per unique address (HashMap overhead + 20-byte key)
2. **Storage Slot**: ~72 bytes per unique slot (HashMap overhead + 52-byte key)  
3. **Capacity Growth**: HashMaps grow by powers of 2, amortizing allocation costs
4. **Transaction Reuse**: `clear()` retains capacity for subsequent transactions

## Testing

### Test Coverage

Comprehensive testing covers all access patterns and edge cases:

1. **Address Access**: Cold/warm transitions, multiple addresses, pre-warming
2. **Storage Access**: Different slots, same contract, cross-contract access  
3. **Configuration**: Custom gas costs, different slot types, validation
4. **Memory Management**: Allocation/deallocation, capacity retention, clear operations
5. **Performance**: Hash collision rates, access time distribution
6. **EIP Compliance**: Exact gas costs, transaction boundary behavior

### Test Execution

```bash
# Run all access list tests
zig build test

# Run access list specific tests  
zig build test -- --test-filter "AccessList"

# Run with memory leak detection
zig build test -Dvalgrind
```

### Critical Test Scenarios

```zig
test "AccessList - address access tracking" {
    var access_list = AccessList.init(testing.allocator);
    defer access_list.deinit();

    const test_address = [_]u8{1} ** 20;

    // First access should be cold (2600 gas)
    const cost1 = try access_list.access_address(test_address);
    try testing.expectEqual(AccessList.COLD_ACCOUNT_ACCESS_COST, cost1);

    // Second access should be warm (100 gas)
    const cost2 = try access_list.access_address(test_address);
    try testing.expectEqual(AccessList.WARM_ACCOUNT_ACCESS_COST, cost2);

    // Verify warmth checking
    try testing.expect(access_list.is_address_warm(test_address));
}

test "AccessList - storage slot access tracking" {
    var access_list = AccessList.init(testing.allocator);
    defer access_list.deinit();

    const contract_address = [_]u8{1} ** 20;
    const slot1: u256 = 42;
    const slot2: u256 = 100;

    // First access to slot1 - cold (2100 gas)
    const cost1 = try access_list.access_storage_slot(contract_address, slot1);
    try testing.expectEqual(AccessList.COLD_SLOAD_COST, cost1);

    // Second access to slot1 - warm (100 gas)
    const cost2 = try access_list.access_storage_slot(contract_address, slot1);
    try testing.expectEqual(AccessList.WARM_SLOAD_COST, cost2);

    // Different slot - cold again
    const cost3 = try access_list.access_storage_slot(contract_address, slot2);
    try testing.expectEqual(AccessList.COLD_SLOAD_COST, cost3);

    // Verify individual slot warmth
    try testing.expect(access_list.is_storage_slot_warm(contract_address, slot1));
    try testing.expect(access_list.is_storage_slot_warm(contract_address, slot2));
    try testing.expect(!access_list.is_storage_slot_warm(contract_address, 999));
}

test "AccessList - transaction boundary behavior" {
    var access_list = AccessList.init(testing.allocator);
    defer access_list.deinit();

    const address = [_]u8{1} ** 20;
    const slot: u256 = 42;

    // Make accesses warm
    _ = try access_list.access_address(address);
    _ = try access_list.access_storage_slot(address, slot);
    
    try testing.expect(access_list.is_address_warm(address));
    try testing.expect(access_list.is_storage_slot_warm(address, slot));

    // Clear for new transaction
    access_list.clear();

    // Should be cold again
    try testing.expect(!access_list.is_address_warm(address));
    try testing.expect(!access_list.is_storage_slot_warm(address, slot));
    
    // Verify cold costs
    try testing.expectEqual(AccessList.COLD_ACCOUNT_ACCESS_COST, 
                          try access_list.access_address(address));
    try testing.expectEqual(AccessList.COLD_SLOAD_COST,
                          try access_list.access_storage_slot(address, slot));
}

test "AccessList - custom configuration" {
    const CustomConfig = AccessListConfig{
        .cold_account_access_cost = 5000,
        .warm_account_access_cost = 200,
        .cold_sload_cost = 4000,
        .warm_sload_cost = 150,
        .SlotType = u128, // Different slot type
    };
    
    const CustomAccessList = createAccessList(CustomConfig);
    var access_list = CustomAccessList.init(testing.allocator);
    defer access_list.deinit();

    const address = [_]u8{1} ** 20;
    const slot: u128 = 42; // u128 instead of u256

    // Verify custom gas costs
    try testing.expectEqual(@as(u64, 5000), try access_list.access_address(address));
    try testing.expectEqual(@as(u64, 200), try access_list.access_address(address));
    
    try testing.expectEqual(@as(u64, 4000), try access_list.access_storage_slot(address, slot));
    try testing.expectEqual(@as(u64, 150), try access_list.access_storage_slot(address, slot));
}
```

## Context within EVM

### Integration with Host Interface

The Access List is used by the Host to provide accurate gas costs:

```zig
// Host implementation using access list
pub const HostImpl = struct {
    access_list: AccessList,
    database: DatabaseInterface,
    
    // Host vtable implementation
    pub fn access_address(self: *Self, address: Address) !u64 {
        return self.access_list.access_address(address);
    }
    
    pub fn access_storage_slot(self: *Self, address: Address, slot: u256) !u64 {
        return self.access_list.access_storage_slot(address, slot);
    }
};

// EVM initializes Host with access list
var host_impl = HostImpl{
    .access_list = AccessList.init(allocator),
    .database = database_interface,
};
const host = Host.init(&host_impl);
```

### Frame Integration

Frame opcodes use the access list through the Host interface:

```zig
// BALANCE opcode implementation with access list
pub fn op_balance(self: *Self) Error!void {
    const address_word = try self.stack.pop();
    const address = Address.from_word(address_word);
    
    // Access address through host (includes access list cost)
    const access_gas = if (self.host) |host|
        host.access_address(address) catch GasConstants.GasColdAccountAccess
    else
        GasConstants.GasColdAccountAccess;
        
    if (self.gas_remaining < access_gas) return Error.OutOfGas;
    self.gas_remaining -= @intCast(access_gas);
    
    // Get balance through host
    const balance = if (self.host) |host|
        host.get_balance(address)
    else 
        0;
        
    try self.stack.push(balance);
}

// SLOAD opcode with access list integration  
pub fn op_sload(self: *Self) Error!void {
    const key = try self.stack.pop();
    
    // Storage access includes access list cost
    const access_gas = if (self.host) |host|
        host.access_storage_slot(self.contract_address, key) catch GasConstants.GasColdSload
    else
        GasConstants.GasColdSload;
        
    if (self.gas_remaining < access_gas) return Error.OutOfGas; 
    self.gas_remaining -= @intCast(access_gas);
    
    const value = if (self.database) |db|
        try db.get_storage(self.contract_address, key)
    else
        0;
        
    try self.stack.push(value);
}
```

### EVM Transaction Lifecycle

The EVM coordinates access list lifecycle with transactions:

```zig
pub const Evm = struct {
    access_list: AccessList,
    
    pub fn execute_transaction(self: *Self, tx: Transaction) !CallResult {
        // Clear access list for new transaction
        self.access_list.clear();
        
        // Pre-warm standard addresses
        const prewarmed = [_]Address{
            tx.origin,        // Transaction sender
            self.block_info.coinbase, // Block producer
            tx.to,           // Transaction target
        };
        try self.access_list.pre_warm_addresses(&prewarmed);
        
        // Execute transaction with warmed access list
        const result = try self.execute_call(tx.params);
        
        return result;
    }
};
```

### Database Coordination

Access list works alongside database operations for complete gas accounting:

```zig
// Storage operation with full gas accounting
pub fn sstore_operation(
    access_list: *AccessList,
    database: DatabaseInterface,
    address: Address,
    slot: u256,
    value: u256
) !u64 {
    // Step 1: Access list gas cost
    const access_gas = try access_list.access_storage_slot(address, slot);
    
    // Step 2: Current storage value for SSTORE gas calculation
    const current_value = try database.get_storage(address, slot);
    
    // Step 3: Calculate total SSTORE gas cost  
    const sstore_gas = calculate_sstore_gas(current_value, value);
    
    // Step 4: Apply storage change
    try database.set_storage(address, slot, value);
    
    return access_gas + sstore_gas;
}
```

## EVM Specification Compliance

### EIP-2929: Gas Cost Increases

The Access List implements the exact EIP-2929 specification:

```zig
// EIP-2929 Gas Costs
COLD_ACCOUNT_ACCESS_COST = 2600;  // Increased from 700
WARM_ACCOUNT_ACCESS_COST = 100;   // Reduced subsequent access
COLD_SLOAD_COST = 2100;           // Increased from 800  
WARM_SLOAD_COST = 100;            // Reduced subsequent access

// Affected Opcodes:
// - BALANCE, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH (account access)
// - CALL, CALLCODE, DELEGATECALL, STATICCALL (account access)
// - SLOAD, SSTORE (storage access)
```

### Transaction Access Lists (EIP-2930)

Support for pre-warming through transaction access lists:

```zig
// EIP-2930 transaction format includes access_list field
pub const AccessListTx = struct {
    access_list: []const AccessListEntry,
    
    pub const AccessListEntry = struct {
        address: Address,
        storage_keys: []const u256,
    };
};

// Pre-warm from transaction access list  
pub fn apply_transaction_access_list(
    access_list: *AccessList, 
    tx_access_list: []const AccessListEntry
) !void {
    for (tx_access_list) |entry| {
        // Pre-warm address
        _ = try access_list.access_address(entry.address);
        
        // Pre-warm storage slots
        for (entry.storage_keys) |slot| {
            _ = try access_list.access_storage_slot(entry.address, slot);
        }
    }
}
```

### Gas Refund Interactions

Access list gas costs do not provide refunds, unlike SSTORE:

```zig
// SSTORE gas calculation with access list
pub fn calculate_sstore_total_gas(
    access_list: *AccessList,
    address: Address,
    slot: u256,
    current_value: u256,
    new_value: u256
) !struct { gas_cost: u64, gas_refund: i64 } {
    // Access list cost (no refund)
    const access_gas = try access_list.access_storage_slot(address, slot);
    
    // SSTORE gas and refund calculation  
    const sstore_result = calculate_sstore_gas_and_refund(current_value, new_value);
    
    return .{
        .gas_cost = access_gas + sstore_result.gas_cost,
        .gas_refund = sstore_result.gas_refund, // Only from SSTORE
    };
}
```

### Hard Fork Compatibility

The Access List is activated starting with the Berlin hard fork:

```zig
// Conditional access list usage based on hard fork
if (evm.hardfork_config.is_at_least(.BERLIN)) {
    // Use access list for gas calculations
    const gas_cost = try evm.access_list.access_address(target_address);
} else {
    // Pre-Berlin gas costs
    const gas_cost = GasConstants.GasCallValue; // 700 gas
}
```

The Access List provides efficient, EIP-2929 compliant warm/cold access tracking that significantly optimizes gas costs for repeated access patterns while maintaining full EVM specification compliance and high performance through optimized data structures and algorithms.