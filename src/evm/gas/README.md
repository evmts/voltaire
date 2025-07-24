# Gas Cost Calculations

Storage gas cost calculations for different hardforks, implementing the complex gas pricing rules that have evolved through various EIPs.

## Purpose

This folder contains the gas cost logic for storage operations (SSTORE), which is one of the most complex areas of EVM gas calculation due to:
- Different costs for cold vs warm storage access (EIP-2929)
- Refunds for clearing storage (setting to zero)
- Evolution of gas costs across multiple hardforks
- Optimization between binary size and runtime performance

## Files

### `storage_costs.zig`
Comprehensive storage gas cost calculation with hardfork support.

**Key Types**:
- `StorageStatus`: Categorizes storage operations
  - `Unchanged`: Value remains the same (current == new)
  - `Added`: Zero to non-zero (current == 0, new != 0)
  - `Deleted`: Non-zero to zero (current != 0, new == 0)
  - `Modified`: Non-zero to different non-zero
  
- `StorageCost`: Result containing gas cost and refund amount

**Features**:
- Pre-computed lookup table for O(1) gas cost retrieval
- Runtime calculation for size-optimized builds
- Support for all hardforks from Frontier to Cancun
- Automatic status determination from values

**Hardfork Evolution**:

1. **Pre-Constantinople** (Frontier → Byzantium):
   - Unchanged: 200 gas
   - Added: 20,000 gas
   - Deleted: 5,000 gas + 15,000 refund
   - Modified: 5,000 gas

2. **Istanbul** (EIP-2200):
   - Unchanged: 800 gas (warm slot)
   - Added: 20,000 gas
   - Deleted: 5,000 gas + 15,000 refund
   - Modified: 5,000 gas

3. **Berlin** (EIP-2929 - Cold/Warm Access):
   - Unchanged: 0 gas (no-op for warm slot)
   - Added: 20,000 gas
   - Deleted: 2,900 gas + 4,800 refund
   - Modified: 2,900 gas
   - Note: Cold access adds 2,100 gas on top

4. **London** (EIP-3529 - Reduced Refunds):
   - Same base costs as Berlin
   - Refunds capped at gas_used / 5

**Performance Optimization**:
- Compile-time table generation for normal builds
- Runtime calculation for size-optimized builds
- Table uses ~2KB of memory for instant lookups

**API**:
```zig
// Get cost for specific status
const cost = getStorageCost(.LONDON, .Added);

// Calculate from values
const cost = calculateStorageCost(.LONDON, current_value, new_value);
```

**Used By**: 
- SSTORE opcode implementation
- Gas estimation
- Transaction validation

## Design Rationale

### Why Pre-computed Tables?

Storage operations are frequent in smart contracts, making gas calculation a hot path. The pre-computed table approach provides:
- O(1) lookup time
- No branching in the common case
- Predictable performance

### Status-Based Approach

Rather than checking values repeatedly, we categorize operations into four statuses. This:
- Simplifies the gas logic
- Makes hardfork differences clearer
- Enables table-based optimization

### Hardfork Complexity

Storage gas costs have changed significantly:
- **Economic incentives**: High cost for new storage, refunds for cleanup
- **DoS prevention**: Reduced refunds in London to prevent refund abuse
- **Performance**: Berlin's cold/warm distinction reflects actual node costs

## Testing

The module includes tests for:
- Status determination from values
- Cost calculation accuracy across all hardforks
- Table lookup vs runtime calculation equivalence
- Compile-time table verification

## Future Considerations

- Additional hardforks will require table updates
- Verkle trees may fundamentally change storage costs
- State rent proposals could add time-based costs
- Cross-shard storage may need new cost models