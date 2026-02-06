# Add Branded Safety Types

**Priority: LOW**

Create additional branded types for type safety.

## Task
Add branded types for sensitive/confusable values.

## Types to Add

### BrandedPrivateKey
Prevent accidental private key exposure or misuse.

```typescript
type BrandedPrivateKey = Uint8Array & { __tag: "PrivateKey" };

// Methods
from(hex: Hex): BrandedPrivateKey
toPublicKey(): BrandedPublicKey
toAddress(): Address
sign(hash: Hash): Signature
// Never expose raw bytes without explicit intent
```

### BrandedPublicKey
Distinguish from generic Hex/Uint8Array.

```typescript
type BrandedPublicKey = Uint8Array & { __tag: "PublicKey" };

// Methods
from(hex: Hex): BrandedPublicKey
fromPrivateKey(pk: BrandedPrivateKey): BrandedPublicKey
toAddress(): Address
verify(hash: Hash, sig: Signature): boolean
```

### BrandedChainId
Prevent chain mixing bugs.

```typescript
type BrandedChainId = number & { __tag: "ChainId" };

// Methods
from(value: number): BrandedChainId
toNumber(): number
equals(other: BrandedChainId): boolean
isMainnet(): boolean
```

### BrandedNonce
Prevent nonce reuse/confusion.

```typescript
type BrandedNonce = Uint8Array & { __tag: "Nonce" };

// Methods
from(value: number | Hex): BrandedNonce
toNumber(): number
increment(): BrandedNonce
```

### BrandedGasLimit / BrandedGasPrice
Prevent gas parameter confusion.

```typescript
type BrandedGasLimit = bigint & { __tag: "GasLimit" };
type BrandedGasPrice = bigint & { __tag: "GasPrice" };
```

## Benefits
- Prevent mixing incompatible values
- Prevent accidental exposure of secrets
- Catch bugs at compile time
- Self-documenting code

## Files
Create in `src/primitives/` with appropriate structure.

## Verification
```bash
bun run test -- BrandedPrivateKey BrandedPublicKey BrandedChainId BrandedNonce
```
