# Add Transaction Utility Methods

**Priority: MEDIUM**

Missing common transaction helper methods.

## Task
Add utility methods to Transaction namespace.

## Methods to Add

### Inspection
```typescript
getRecipient(tx): Address | null          // Get to field, null if creation
isContractCreation(tx): boolean           // Check if to is null
isContractCall(tx): boolean               // Check if to exists and data present
```

### Validation
```typescript
validateGasPrice(tx): void                // Check gas price reasonable
validateGasLimit(tx): void                // Check gas limit valid
validateNonce(tx): void                   // Check nonce format
validateValue(tx): void                   // Check value valid
validateChainId(tx): void                 // Check chainId present
```

### Builders
```typescript
withNonce(tx, nonce): Transaction         // Return new tx with nonce
withGasLimit(tx, gas): Transaction        // Return new tx with gas
withGasPrice(tx, price): Transaction      // Return new tx with price
withData(tx, data): Transaction           // Return new tx with data
replaceWith(tx, opts): Transaction        // Fee bump (increase gas price)
```

### EIP-Specific
```typescript
// EIP-4844
getBlobCount(tx): number                  // Get blob count
getBlobVersionedHashes(tx): Hash[]        // Get blob hashes

// EIP-7702
getAuthorizationCount(tx): number         // Get auth list count
getAuthorizations(tx): Authorization[]    // Get auth list
```

## Files
Add to `src/primitives/Transaction/` namespace.

## Verification
```bash
bun run test -- Transaction
```
