# Implement Full Transaction Envelope Serialization

## Context

OX comparison revealed we have basic transaction types but lack complete envelope serialization for all EIP types. Need full support for EIP-1559, EIP-2930, EIP-4844, EIP-7702, and Legacy transactions.

## Requirements

1. **Transaction Types**:
   - **Legacy** (pre-EIP-2718): RLP([nonce, gasPrice, gasLimit, to, value, data, v, r, s])
   - **EIP-2930** (Type 1): 0x01 || RLP([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, v, r, s])
   - **EIP-1559** (Type 2): 0x02 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, v, r, s])
   - **EIP-4844** (Type 3): 0x03 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, maxFeePerBlobGas, blobVersionedHashes, v, r, s])
   - **EIP-7702** (Type 4): 0x04 || RLP([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, authorizationList, v, r, s])

2. **TypeScript API**:
   ```typescript
   // In src/primitives/Transaction/
   export function serialize(tx: Transaction): Uint8Array
   export function deserialize(bytes: Uint8Array): Transaction
   export function getType(tx: Transaction): TransactionType
   export function hash(tx: Transaction): Hash // keccak256(serialize(tx))
   ```

3. **Implementation**:
   - Use existing RLP module
   - Handle type prefix (0x01, 0x02, 0x03, 0x04) correctly
   - Validate all fields before serialization
   - Support both signed and unsigned transactions

4. **Validation**:
   - Type-specific field requirements
   - Field value ranges (nonce, gas, fees)
   - ChainId presence for typed transactions
   - Signature validation (r, s, v/yParity)
   - AccessList format validation
   - BlobVersionedHashes validation (EIP-4844)

5. **Testing**:
   - Test vectors from EIP specifications
   - Round-trip: deserialize(serialize(tx)) == tx
   - Cross-validate with OX
   - Test all transaction types
   - Test edge cases (empty fields, max values)

6. **Documentation**:
   - JSDoc explaining each transaction type
   - When to use which type
   - EIP links and rationale
   - Fee calculation differences

## Reference

OX implementation:
- `node_modules/ox/core/TransactionEnvelope*.ts`
- `node_modules/ox/core/Transaction.ts`

## Priority

**HIGH** - Essential for transaction handling
