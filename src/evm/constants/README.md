# Constants

EVM-related constants, particularly memory limits and gas calculations.

## Purpose

This folder contains constants that define operational limits and cost calculations for the EVM. While the EVM specification doesn't impose hard memory limits, practical implementations must set reasonable boundaries to prevent denial-of-service attacks and ensure predictable resource usage.

## Files

### `memory_limits.zig`
Defines memory size limits and gas cost calculations for EVM memory operations.

**Constants**:
- `MAX_MEMORY_SIZE`: 32 MB (33,554,432 bytes)
  - Standard limit matching many production EVM implementations
  - At this size, gas cost would be ~2.15 billion gas (far exceeding any block limit)
- `CONSERVATIVE_MEMORY_LIMIT`: 16 MB 
  - More restrictive limit for conservative implementations
- `PERMISSIVE_MEMORY_LIMIT`: 64 MB
  - More lenient limit for permissive implementations

**Functions**:
- `calculate_memory_gas_cost(size_bytes)`: Computes gas cost for memory allocation
  - Formula: `3 * words + (words² / 512)`
  - Linear component: 3 gas per word
  - Quadratic component: Prevents excessive memory usage
- `is_memory_size_reasonable(size_bytes, available_gas)`: Checks if allocation is feasible

**Gas Cost Examples**:
- 32 bytes (1 word): 3 gas
- 1 KB: ~96 gas
- 1 MB: >1 million gas
- 32 MB: >2 billion gas

**Used By**: 
- Memory operations (MLOAD, MSTORE, MSTORE8)
- RETURN, REVERT (for output memory)
- CREATE, CREATE2 (for init code)
- CALL family (for input/output memory)
- LOG operations (for log data)

## Design Rationale

The quadratic gas cost formula serves two purposes:
1. **Resource Protection**: Prevents cheap allocation of large memory regions
2. **DoS Prevention**: Makes memory exhaustion attacks economically infeasible

The 32 MB limit is chosen because:
- It's large enough for any reasonable smart contract operation
- The gas cost at this size already exceeds any possible transaction gas limit
- It matches limits used by major EVM implementations

## Performance Considerations

- Memory gas calculations are performed frequently during execution
- The quadratic formula uses efficient integer arithmetic
- Word count calculation is optimized in the primitives module
- Limits prevent runaway memory allocation that could crash the VM

## Testing

The module includes tests verifying:
- Correct gas calculations for various memory sizes
- Reasonable size determination based on available gas
- Edge cases around memory limits