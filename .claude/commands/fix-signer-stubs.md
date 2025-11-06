# Implement Signer Methods

**Priority: CRITICAL**

`signTransaction()` and `signTypedData()` throw NotImplemented errors.

## Task
Implement missing methods in PrivateKeySignerImpl.

## Files
- `src/crypto/signers/private-key-signer.ts:55,62`

## Implementation

### signTransaction()
1. Serialize transaction based on type (EIP-1559, EIP-2930, Legacy)
2. Get signing hash via `Transaction.getSigningHash()`
3. Sign hash with secp256k1
4. Attach signature (r, s, v) to transaction
5. Return signed transaction

**Dependencies needed:**
- Transaction serialization (currently NotImplemented stub)
- May need to implement `Transaction.serialize()` first
- Use `src/crypto/secp256k1/` for signing

### signTypedData()
1. Encode EIP-712 typed data
2. Get domain separator
3. Hash typed data
4. Sign with secp256k1
5. Return signature

**Dependencies:**
- May need EIP-712 encoding utilities
- Use existing keccak256 and secp256k1

## Blockers
Check if Transaction.serialize() exists. If not, this task depends on transaction serialization implementation.

## Verification
```bash
bun run test -- PrivateKeySigner
```
