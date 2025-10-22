# hardfork.zig - Ethereum Protocol Upgrade Management

> **⚠️ AI-GENERATED DOCUMENTATION**: This file was automatically generated from source code analysis. While efforts have been made to ensure accuracy, please verify critical details against the source code at `/Users/williamcory/primitives/src/primitives/hardfork.zig`.

## Module Purpose and Overview

The `hardfork` module provides comprehensive management of Ethereum protocol upgrades (hardforks) throughout the network's history. Hardforks represent coordinated protocol changes that modify consensus rules, introduce new features, or adjust gas costs.

This module is critical for:
- **Version Management**: Tracking which protocol rules apply at given block heights or timestamps
- **Feature Activation**: Determining when new EIPs (Ethereum Improvement Proposals) become active
- **Gas Calculations**: Selecting appropriate gas cost functions based on active hardfork
- **Consensus Validation**: Ensuring transactions and blocks conform to the correct protocol version
- **Testing**: Supporting both block-based and timestamp-based fork transitions

The module supports all major Ethereum hardforks from FRONTIER (genesis) through OSAKA (future), and provides flexible transition parsing for testing scenarios.

## Complete API Reference

### Types

#### `Hardfork`
```zig
pub const Hardfork = enum {
    FRONTIER,          // Genesis (Block 0)
    HOMESTEAD,         // Block 1,150,000
    DAO,               // Block 1,920,000 (DAO fork)
    TANGERINE_WHISTLE, // Block 2,463,000 (EIP-150)
    SPURIOUS_DRAGON,   // Block 2,675,000 (EIP-155, EIP-160, EIP-161, EIP-170)
    BYZANTIUM,         // Block 4,370,000 (EIP-100, EIP-140, EIP-196, EIP-197, EIP-198, EIP-211, EIP-214, EIP-658)
    CONSTANTINOPLE,    // Block 7,280,000 (EIP-145, EIP-1014, EIP-1052, EIP-1283)
    PETERSBURG,        // Block 7,280,000 (reverts EIP-1283)
    ISTANBUL,          // Block 9,069,000 (EIP-152, EIP-1108, EIP-1344, EIP-1884, EIP-2028, EIP-2200)
    MUIR_GLACIER,      // Block 9,200,000 (difficulty bomb delay)
    BERLIN,            // Block 12,244,000 (EIP-2565, EIP-2929, EIP-2718, EIP-2930)
    LONDON,            // Block 12,965,000 (EIP-1559, EIP-3198, EIP-3529, EIP-3541)
    ARROW_GLACIER,     // Block 13,773,000 (difficulty bomb delay)
    GRAY_GLACIER,      // Block 15,050,000 (difficulty bomb delay)
    MERGE,             // Block 15,537,394 (EIP-3675 - PoS transition)
    SHANGHAI,          // Timestamp 1681338455 (EIP-3651, EIP-3855, EIP-3860, EIP-4895)
    CANCUN,            // Timestamp 1710338135 (EIP-4844, EIP-1153, EIP-4788, EIP-5656, EIP-6780, EIP-7516)
    PRAGUE,            // Future (EIP-2537, EIP-7702)
    OSAKA,             // Future

    pub const DEFAULT = Hardfork.PRAGUE;

    pub fn toInt(self: Hardfork) u32;
    pub fn isAtLeast(self: Hardfork, target: Hardfork) bool;
    pub fn isBefore(self: Hardfork, target: Hardfork) bool;
    pub fn fromString(name: []const u8) ?Hardfork;
};
```

The primary enumeration representing all Ethereum hardforks in chronological order.

**Methods:**
- `toInt()` - Returns the ordinal position (0 for FRONTIER, 1 for HOMESTEAD, etc.)
- `isAtLeast(target)` - Returns true if this hardfork is at or after the target
- `isBefore(target)` - Returns true if this hardfork is before the target
- `fromString(name)` - Parses a hardfork name (case-insensitive)

#### `ForkTransition`
```zig
pub const ForkTransition = struct {
    from_fork: Hardfork,
    to_fork: Hardfork,
    at_block: ?u64,
    at_timestamp: ?u64,

    pub fn fromString(name: []const u8) ?ForkTransition;
    pub fn getActiveFork(self: ForkTransition, block_number: u64, timestamp: u64) Hardfork;
};
```

Represents a transition between two hardforks at a specific block number or timestamp. Used primarily for testing to simulate hardfork activation.

**Fields:**
- `from_fork` - The starting hardfork
- `to_fork` - The target hardfork
- `at_block` - Optional block number for block-based activation
- `at_timestamp` - Optional timestamp for timestamp-based activation

**Methods:**
- `fromString(name)` - Parses transition strings like "ShanghaiToCancunAtTime15k" or "BerlinToLondonAt12965000"
- `getActiveFork(block_number, timestamp)` - Returns the active hardfork based on current block/timestamp

## Example Code Snippets

### Basic Hardfork Comparison

```zig
const hardfork = @import("hardfork.zig");

pub fn isEIP1559Active(fork: hardfork.Hardfork) bool {
    // EIP-1559 activated in London hardfork
    return fork.isAtLeast(.LONDON);
}

pub fn supportsBlobs(fork: hardfork.Hardfork) bool {
    // EIP-4844 (blob transactions) activated in Cancun
    return fork.isAtLeast(.CANCUN);
}

pub fn usesPushZero(fork: hardfork.Hardfork) bool {
    // PUSH0 opcode (EIP-3855) activated in Shanghai
    return fork.isAtLeast(.SHANGHAI);
}
```

### Gas Cost Selection Based on Hardfork

```zig
const hardfork = @import("hardfork.zig");
const gas = @import("gas_constants.zig");

pub fn getSstoreGasCost(fork: hardfork.Hardfork, is_cold: bool, original: u256, current: u256, new: u256) u64 {
    if (fork.isAtLeast(.BERLIN)) {
        // EIP-2929: Cold access costs
        return gas.sstoreGasCostBerlin(is_cold, original, current, new);
    } else if (fork.isAtLeast(.ISTANBUL)) {
        // EIP-2200: Net gas metering
        return gas.sstoreGasCostIstanbul(original, current, new);
    } else if (fork.isAtLeast(.CONSTANTINOPLE)) {
        // EIP-1283: Net gas metering (original)
        return gas.sstoreGasCostConstantinople(original, current, new);
    } else {
        // Pre-Constantinople: Simple pricing
        return if (current == 0 and new != 0) 20000 else 5000;
    }
}
```

### Parsing Hardfork Names

```zig
const hardfork = @import("hardfork.zig");

pub fn parseNetworkConfig(config: []const u8) !hardfork.Hardfork {
    if (hardfork.Hardfork.fromString(config)) |fork| {
        return fork;
    }
    return error.InvalidHardfork;
}

// Usage
const fork1 = try parseNetworkConfig("london");       // .LONDON
const fork2 = try parseNetworkConfig("SHANGHAI");     // .SHANGHAI
const fork3 = try parseNetworkConfig("Cancun");       // .CANCUN
```

### Fork Transitions for Testing

```zig
const hardfork = @import("hardfork.zig");

test "simulate hardfork transition" {
    // Parse transition: Shanghai until timestamp 15000, then Cancun
    const transition = hardfork.ForkTransition.fromString("ShanghaiToCancunAtTime15k") orelse unreachable;

    // Before transition
    const fork1 = transition.getActiveFork(100, 10000);
    try std.testing.expectEqual(hardfork.Hardfork.SHANGHAI, fork1);

    // After transition
    const fork2 = transition.getActiveFork(200, 20000);
    try std.testing.expectEqual(hardfork.Hardfork.CANCUN, fork2);
}

test "block-based transition" {
    // Parse transition: Berlin until block 12965000, then London
    const transition = hardfork.ForkTransition.fromString("BerlinToLondonAt12965000") orelse unreachable;

    const fork1 = transition.getActiveFork(12000000, 0);
    try std.testing.expectEqual(hardfork.Hardfork.BERLIN, fork1);

    const fork2 = transition.getActiveFork(13000000, 0);
    try std.testing.expectEqual(hardfork.Hardfork.LONDON, fork2);
}
```

### Feature Detection Pattern

```zig
const hardfork = @import("hardfork.zig");

pub const Features = struct {
    eip1559: bool,      // Base fee + priority fee
    eip2930: bool,      // Access lists
    eip3860: bool,      // Init code size limit
    eip4844: bool,      // Blob transactions
    eip1153: bool,      // Transient storage
    eip7702: bool,      // Set code transactions

    pub fn fromHardfork(fork: hardfork.Hardfork) Features {
        return .{
            .eip1559 = fork.isAtLeast(.LONDON),
            .eip2930 = fork.isAtLeast(.BERLIN),
            .eip3860 = fork.isAtLeast(.SHANGHAI),
            .eip4844 = fork.isAtLeast(.CANCUN),
            .eip1153 = fork.isAtLeast(.CANCUN),
            .eip7702 = fork.isAtLeast(.PRAGUE),
        };
    }
};
```

## Implementation Details

### Chronological Ordering

The `Hardfork` enum is ordered chronologically, enabling simple comparison operators. This design allows:
- **Direct integer comparison** via `@intFromEnum()`
- **Efficient range checks** using `isAtLeast()` and `isBefore()`
- **Sequential iteration** through fork history

### Transition Activation

Ethereum hardforks activate in two ways:
1. **Block-based**: Activated at a specific block number (pre-Merge)
2. **Timestamp-based**: Activated at a specific Unix timestamp (post-Merge)

The `ForkTransition` type supports both:
```zig
// Block-based: "BerlinToLondonAt12965000"
.at_block = 12965000, .at_timestamp = null

// Timestamp-based: "ShanghaiToCancunAtTime1710338135"
.at_block = null, .at_timestamp = 1710338135
```

### String Parsing

The `fromString()` method uses case-insensitive matching:
```zig
pub fn fromString(name: []const u8) ?Hardfork {
    inline for (@typeInfo(Hardfork).Enum.fields) |field| {
        if (std.ascii.eqlIgnoreCase(name, field.name)) {
            return @enumFromInt(field.value);
        }
    }
    return null;
}
```

### Transition String Format

`ForkTransition.fromString()` supports flexible formats:
- **Full names**: "ShanghaiToCancunAtTime15000"
- **Block-based**: "BerlinToLondonAt12965000"
- **Timestamp suffix**: "AtTime" or "At" for timestamp vs block
- **Numeric parsing**: Supports "15k", "1.5M", or exact numbers

Examples:
- `"HomesteadToByzantiumAt4370000"` → Block 4,370,000
- `"LondonToMergeAtTime15537394"` → Timestamp 15,537,394
- `"ShanghaiToCancunAtTime15k"` → Timestamp 15,000

### Default Hardfork

The `DEFAULT` constant points to the most recent stable hardfork suitable for general use:
```zig
pub const DEFAULT = Hardfork.PRAGUE;
```

This default is used when no specific hardfork is configured, ensuring compatibility with modern Ethereum features.

## Error Types

This module defines no custom error types. Operations that can fail return optional types (`?Hardfork`, `?ForkTransition`) with `null` indicating parse failure.

Potential errors from calling code:
- **InvalidHardfork**: Unrecognized hardfork name
- **InvalidTransition**: Malformed transition string
- **ForkMismatch**: Attempting operations across incompatible forks

## Testing Considerations

### Test Coverage

The module includes comprehensive tests covering:

1. **Enum Ordering**: Verifying chronological order with `toInt()`
2. **Comparison Methods**: Testing `isAtLeast()` and `isBefore()`
3. **String Parsing**: All hardfork names (case variations)
4. **Transition Parsing**: Block-based and timestamp-based transitions
5. **Active Fork Detection**: Testing `getActiveFork()` logic
6. **Edge Cases**: Invalid names, malformed transitions, boundary conditions

### Test Patterns

```zig
test "Hardfork chronological ordering" {
    try std.testing.expect(Hardfork.FRONTIER.toInt() == 0);
    try std.testing.expect(Hardfork.HOMESTEAD.toInt() == 1);
    try std.testing.expect(Hardfork.CANCUN.toInt() > Hardfork.SHANGHAI.toInt());
}

test "Hardfork comparison methods" {
    try std.testing.expect(Hardfork.LONDON.isAtLeast(.BERLIN));
    try std.testing.expect(Hardfork.LONDON.isAtLeast(.LONDON));
    try std.testing.expect(!Hardfork.LONDON.isAtLeast(.SHANGHAI));

    try std.testing.expect(Hardfork.BERLIN.isBefore(.LONDON));
    try std.testing.expect(!Hardfork.LONDON.isBefore(.LONDON));
}

test "Hardfork string parsing" {
    try std.testing.expectEqual(Hardfork.LONDON, Hardfork.fromString("london"));
    try std.testing.expectEqual(Hardfork.CANCUN, Hardfork.fromString("CANCUN"));
    try std.testing.expectEqual(Hardfork.SHANGHAI, Hardfork.fromString("Shanghai"));
    try std.testing.expectEqual(null, Hardfork.fromString("invalid"));
}
```

### Critical Test Cases

1. **EIP Activation**: Verify each hardfork correctly enables its EIPs
   - Istanbul enables EIP-1108 (cheaper precompile gas)
   - London enables EIP-1559 (base fee)
   - Cancun enables EIP-4844 (blobs)

2. **Gas Cost Changes**: Test gas calculations across forks
   - SSTORE costs change in Constantinople, Istanbul, Berlin
   - Precompile costs change in Istanbul, Berlin
   - Memory expansion costs remain constant

3. **Transaction Types**: Validate transaction type support
   - Legacy (type 0): All forks
   - Access list (type 1): Berlin+
   - EIP-1559 (type 2): London+
   - Blob (type 3): Cancun+
   - Set code (type 4): Prague+

4. **Opcode Availability**: Test opcode activation
   - CHAINID (0x46): Istanbul+
   - BASEFEE (0x48): London+
   - PUSH0 (0x5F): Shanghai+
   - BLOBHASH (0x49): Cancun+
   - TLOAD/TSTORE (0x5C/0x5D): Cancun+

### Integration Testing

When testing EVM execution:
- Create test fixtures for each hardfork
- Validate fork-specific behavior changes
- Test transition boundaries (last block of old fork, first block of new fork)
- Verify gas costs match specification
- Test backward compatibility

### Mainnet vs Testnet

Different networks activate forks at different heights/timestamps:
- **Mainnet**: Production activation heights
- **Goerli**: Testnet with different activation schedule
- **Sepolia**: Testnet with different activation schedule
- **Custom**: Test scenarios with arbitrary transitions

The `ForkTransition` type enables testing across all scenarios.

## Related Modules

- **gas_constants.zig**: Uses hardfork to select gas cost functions
- **opcode.zig**: Opcode availability depends on hardfork
- **transaction.zig**: Transaction types require specific hardforks
- **state.zig**: State root calculations vary by fork
- **bytecode.zig**: Bytecode validation rules change with forks

## Standards and Specifications

### Major EIP Groups by Hardfork

**Homestead (1,150,000)**
- EIP-2: Homestead hard fork changes
- EIP-7: DELEGATECALL opcode

**Tangerine Whistle (2,463,000)**
- EIP-150: Gas cost changes for IO-heavy operations

**Spurious Dragon (2,675,000)**
- EIP-155: Simple replay attack protection
- EIP-160: EXP cost increase
- EIP-161: State trie clearing
- EIP-170: Contract code size limit

**Byzantium (4,370,000)**
- EIP-100: Difficulty adjustment
- EIP-140: REVERT opcode
- EIP-196: Elliptic curve addition precompile
- EIP-197: Elliptic curve scalar multiplication precompile
- EIP-198: Big integer modular exponentiation precompile
- EIP-211: RETURNDATASIZE and RETURNDATACOPY opcodes
- EIP-214: STATICCALL opcode
- EIP-658: Embedding transaction status in receipts

**Constantinople/Petersburg (7,280,000)**
- EIP-145: Bitwise shifting instructions
- EIP-1014: CREATE2 opcode
- EIP-1052: EXTCODEHASH opcode
- EIP-1283: Net gas metering for SSTORE (reverted in Petersburg)

**Istanbul (9,069,000)**
- EIP-152: Blake2 precompile
- EIP-1108: Reduce alt_bn128 precompile gas costs
- EIP-1344: CHAINID opcode
- EIP-1884: Repricing for trie-size-dependent opcodes
- EIP-2028: Transaction data gas cost reduction
- EIP-2200: Net gas metering for SSTORE (v2)

**Berlin (12,244,000)**
- EIP-2565: ModExp gas cost
- EIP-2929: Gas cost increases for state access opcodes
- EIP-2718: Typed transaction envelope
- EIP-2930: Optional access lists

**London (12,965,000)**
- EIP-1559: Fee market change (base fee + priority fee)
- EIP-3198: BASEFEE opcode
- EIP-3529: Reduction in refunds
- EIP-3541: Reject new contracts starting with 0xEF byte

**Merge (15,537,394)**
- EIP-3675: Upgrade consensus to Proof-of-Stake
- EIP-4399: Supplant DIFFICULTY opcode with PREVRANDAO

**Shanghai (Timestamp: 1681338455)**
- EIP-3651: Warm COINBASE
- EIP-3855: PUSH0 instruction
- EIP-3860: Limit and meter initcode
- EIP-4895: Beacon chain push withdrawals

**Cancun (Timestamp: 1710338135)**
- EIP-1153: Transient storage opcodes (TLOAD/TSTORE)
- EIP-4844: Shard blob transactions
- EIP-4788: Beacon block root in the EVM
- EIP-5656: MCOPY instruction
- EIP-6780: SELFDESTRUCT only in same transaction
- EIP-7516: BLOBBASEFEE opcode

**Prague (Future)**
- EIP-2537: BLS12-381 precompiles
- EIP-7702: Set EOA account code

## Safety Considerations

### Protocol Consensus

**CRITICAL**: Incorrect hardfork detection leads to consensus failures:
- Transactions valid on one fork may be invalid on another
- Gas costs must exactly match the active fork
- Opcode availability must be strictly enforced
- State root calculations must use correct trie rules

### Replay Protection

- EIP-155 (Spurious Dragon) adds chain ID to prevent cross-chain replay
- Transactions signed pre-EIP155 are valid but not replay-protected
- Chain ID must be validated based on hardfork

### Gas Cost Attacks

- Gas cost changes in hardforks prevent DOS attacks
- EIP-150: Increased IO operation costs
- EIP-1884: Repriced SLOAD and balance operations
- EIP-2929: Cold vs warm access differentiation

### Feature Availability

Always check hardfork before using features:
```zig
if (!fork.isAtLeast(.LONDON)) {
    return error.EIP1559NotSupported;
}
```

### Test Network Compatibility

Production code must handle multiple networks:
- Mainnet, Goerli, Sepolia have different fork schedules
- Custom test networks may have non-standard transitions
- Use `ForkTransition` for flexible testing

---

**Source:** `/Users/williamcory/primitives/src/primitives/hardfork.zig` (737 lines)
**Last Updated:** 2025-10-21
