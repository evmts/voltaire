# Improve Overflow Checking and Error Messages

## Context

OX comparison revealed they have comprehensive bounds validation with detailed error messages. We should improve our overflow checking to catch bugs early and provide better developer experience.

## Current State

Our implementations sometimes lack explicit overflow checks or have generic error messages.

## Requirements

1. **Number Validation**:
   ```typescript
   // Add validation helpers
   function assertInRange(value: bigint, min: bigint, max: bigint, name: string): void
   function assertUint8(value: number): void
   function assertUint256(value: bigint): void
   // etc.
   ```

2. **Specific Checks Needed**:
   - **Hex conversions**: Size bounds (e.g., address must be 20 bytes)
   - **Number conversions**: Range checks for uint8-uint256, int8-int256
   - **Gas values**: Max gas, max priority fee, etc.
   - **Nonce**: Max nonce value
   - **ChainId**: Valid range
   - **Signature components**: r, s in [1, n-1], v values

3. **Error Types**:
   ```typescript
   class IntegerOverflowError extends BaseError
   class IntegerUnderflowError extends BaseError
   class InvalidSizeError extends BaseError
   class InvalidRangeError extends BaseError
   ```

4. **Implementation Strategy**:
   - Add validation functions in `src/primitives/Errors/` or utility module
   - Use in all conversion/serialization functions
   - Include value, expected range, and context in error messages
   - Zig: Use overflow arithmetic operators (@addWithOverflow, etc.)

5. **Testing**:
   - Test boundary values (0, max, max+1)
   - Test overflow scenarios
   - Verify error messages are helpful
   - Test all numeric types

6. **Documentation**:
   - JSDoc explaining valid ranges
   - Link to Ethereum specs for constraints
   - Examples of error handling

## Reference

OX implementation: Check various `node_modules/ox/core/*.ts` files for validation patterns

## Priority

**MEDIUM** - Improves robustness and developer experience

## Example

```typescript
// OX style
function assertSize(value: Hex, size: number) {
  if (Hex.size(value) !== size)
    throw new InvalidHexSizeError({ size, value })
}

// We should adopt similar patterns
```
