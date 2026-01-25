# Signature Utilities Gaps

**Date**: 2026-01-25
**Priority**: Medium
**Category**: Missing Utilities

## Overview

viem has extensive signature utilities for parsing, formatting, and verifying signatures. voltaire-effect has basic signing but lacks many utilities.

## Signature Parsing/Formatting

### viem Utilities

| Utility | Purpose | voltaire-effect |
|---------|---------|-----------------|
| `parseSignature` | Hex → { r, s, v/yParity } | ❌ |
| `serializeSignature` | { r, s, v } → Hex | ❌ |
| `parseCompactSignature` | EIP-2098 compact → signature | ❌ |
| `serializeCompactSignature` | Signature → EIP-2098 compact | ❌ |
| `compactSignatureToSignature` | Convert compact to full | ❌ |
| `signatureToCompactSignature` | Convert full to compact | ❌ |

### Impact

Users can't easily convert between signature formats without manual implementation.

## ERC-6492 (Counterfactual Signatures)

### viem

```typescript
import { 
  isErc6492Signature,
  parseErc6492Signature,
  serializeErc6492Signature 
} from 'viem'

// Check if signature is ERC-6492 wrapped
const isWrapped = isErc6492Signature(sig)

// Parse wrapped signature
const { address, data, signature } = parseErc6492Signature(wrappedSig)

// Create wrapped signature
const wrapped = serializeErc6492Signature({
  address: factoryAddress,
  data: factoryCalldata,
  signature: innerSignature
})
```

### voltaire-effect

**Not implemented.**

**Impact**: Can't verify signatures from undeployed smart accounts (account abstraction).

## ERC-8010 (Key-Scoped Signatures)

### viem

```typescript
import {
  isErc8010Signature,
  parseErc8010Signature,
  serializeErc8010Signature
} from 'viem'

// For multi-key accounts (e.g., passkey + backup key)
const wrapped = serializeErc8010Signature({
  keyId: 0n,
  signature: innerSignature
})
```

### voltaire-effect

**Not implemented.**

**Impact**: Can't work with key-scoped smart account signatures.

## Signature Recovery

### viem

```typescript
import {
  recoverAddress,
  recoverMessageAddress,
  recoverTypedDataAddress,
  recoverTransactionAddress,
  recoverPublicKey
} from 'viem'

// Recover signer address from raw hash + signature
const address = await recoverAddress({ hash, signature })

// Recover from personal_sign message
const address = await recoverMessageAddress({ message, signature })

// Recover from EIP-712 typed data
const address = await recoverTypedDataAddress({
  domain, types, primaryType, message, signature
})

// Recover from signed transaction
const address = await recoverTransactionAddress({
  serializedTransaction
})

// Recover full public key
const publicKey = await recoverPublicKey({ hash, signature })
```

### voltaire-effect

**No recovery utilities.**

**Impact**: Can't verify who signed a message/transaction.

## Signature Verification

### viem

```typescript
import { 
  verifyMessage, 
  verifyTypedData, 
  verifyHash 
} from 'viem'

// Verify personal_sign
const valid = await verifyMessage(client, {
  address: '0x...',
  message: 'Hello',
  signature: '0x...'
})

// Verify EIP-712
const valid = await verifyTypedData(client, {
  address: '0x...',
  domain, types, primaryType, message,
  signature: '0x...'
})

// Verify raw hash (with smart account support)
const valid = await verifyHash(client, {
  address: '0x...',
  hash: '0x...',
  signature: '0x...'
})
```

**Features**:
- Supports EOA (ecrecover)
- Supports smart accounts (EIP-1271)
- Supports ERC-6492 (counterfactual accounts)
- Chain-specific verification via `chain.verifyHash`

### voltaire-effect

**No verification utilities.**

**Impact**: Apps can't verify signatures - must implement manually.

## Message Hashing

### viem

```typescript
import { hashMessage, hashTypedData, toPrefixedMessage } from 'viem'

// Hash for personal_sign (EIP-191)
const hash = hashMessage('Hello World')
const hash = hashMessage({ raw: '0x1234' })

// Hash for EIP-712
const hash = hashTypedData({ domain, types, primaryType, message })

// Create prefixed message (without hashing)
const prefixed = toPrefixedMessage('Hello World')
```

### voltaire-effect

Has internal hashing in LocalAccount but not exported as utilities.

## Recommendations

### High Priority

1. **Add signature recovery utilities**
   - `recoverAddress`
   - `recoverMessageAddress`
   - `recoverTypedDataAddress`
   - `recoverPublicKey`

2. **Add signature verification**
   - `verifyMessage`
   - `verifyTypedData`
   - `verifyHash`
   - With EIP-1271 smart account support

3. **Export message hashing utilities**
   - `hashMessage`
   - `hashTypedData`

### Medium Priority

4. **Add signature parsing/formatting**
   - `parseSignature`
   - `serializeSignature`

5. **Add ERC-6492 support**
   - `isErc6492Signature`
   - `parseErc6492Signature`
   - `serializeErc6492Signature`

### Lower Priority

6. **Add compact signature support (EIP-2098)**
   - Saves 1 byte per signature
   - Used by some protocols

7. **Add ERC-8010 support**
   - Key-scoped signatures for multi-key accounts
