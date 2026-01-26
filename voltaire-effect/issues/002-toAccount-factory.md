# toAccount Factory for Custom Signers

**Priority**: P2
**Status**: Not Started

## Summary

Add toAccount factory to allow users to bring custom signing implementations (hardware wallets, remote signers, HSMs).

## Use Case

```typescript
const customAccount = toAccount({
  address: '0x...',
  signMessage: async (message) => { /* custom logic */ },
  signTransaction: async (tx) => { /* custom logic */ },
  signTypedData: async (data) => { /* custom logic */ },
})
```

## Implementation

```typescript
// src/services/Account/toAccount.ts
export const toAccount = (options: {
  address: Address
  signMessage: (message: Hex) => Effect.Effect<Signature, SignerError>
  signTransaction: (tx: TransactionRequest) => Effect.Effect<Hex, SignerError>
  signTypedData: (data: TypedData) => Effect.Effect<Signature, SignerError>
}): Layer.Layer<AccountService> =>
  Layer.succeed(AccountService, {
    address: options.address,
    signMessage: options.signMessage,
    signTransaction: options.signTransaction,
    signTypedData: options.signTypedData,
  })
```

## Files
- src/services/Account/toAccount.ts (NEW)
- src/services/Account/toAccount.test.ts (NEW)
- src/services/Account/index.ts (UPDATE exports)
