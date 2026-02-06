# Implement ABI Encoding/Decoding

## Context

OX comparison revealed we lack ABI encoding/decoding support. While lower priority than crypto primitives, ABI encoding is essential for contract interactions and provides significant value for Ethereum developers.

## Requirements

1. **TypeScript API**:
   ```typescript
   // In src/primitives/Abi/
   export function encode(types: string[], values: unknown[]): Hex
   export function decode(types: string[], data: Hex): unknown[]
   export function encodeFunctionData(abi: AbiFunction, args: unknown[]): Hex
   export function decodeFunctionData(abi: AbiFunction, data: Hex): unknown[]
   export function encodeEventTopics(abi: AbiEvent, args: unknown[]): Hex[]
   export function decodeEventLog(abi: AbiEvent, data: Hex, topics: Hex[]): unknown
   ```

2. **Support**:
   - **Elementary types**: uint8-uint256, int8-int256, address, bool, bytes1-bytes32
   - **Dynamic types**: bytes, string
   - **Arrays**: fixed-size and dynamic
   - **Tuples**: struct encoding
   - **ABIv2**: Nested arrays and structs

3. **Implementation Options**:
   - **Option A**: Zig implementation (performance, consistent with crypto)
   - **Option B**: TypeScript only (faster to implement, good enough for most cases)
   - **Option C**: Leverage existing library with thin wrapper

4. **Validation**:
   - Type checking before encoding
   - Length validation for fixed-size types
   - Range checking for integers
   - Proper padding and alignment

5. **Testing**:
   - Test vectors from Solidity ABI spec
   - Cross-validate with OX
   - Test all type categories
   - Test edge cases (empty arrays, max values, nested structs)

6. **Documentation**:
   - JSDoc with encoding examples
   - Link to Solidity ABI spec
   - Common patterns (function calls, event logs)
   - Performance notes

## Reference

OX implementation:
- `node_modules/ox/core/Abi*.ts`
- `node_modules/ox/core/AbiParameters.ts`

## Priority

**MEDIUM** - Valuable but lower ROI than crypto primitives

## Notes

- Consider using existing well-tested library (ethers, viem, abitype) rather than implementing from scratch
- If implementing, TypeScript-first may be pragmatic (complex spec, Zig would be significant effort)
- Focus on common use cases first (function calls, event logs)
