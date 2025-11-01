# Authorization

EIP-7702 authorization implementation for set code delegation in EOA accounts.

## Overview

Authorizations (introduced in [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702)) allow Externally Owned Accounts (EOAs) to temporarily delegate their code execution to a smart contract. This enables account abstraction features for regular EOAs without requiring a full migration to smart contract wallets.

**Key Benefits:**
- Account abstraction for EOAs
- Sponsored transactions (gas abstraction)
- Batch operations
- Social recovery
- Custom validation logic
- Temporary, revocable delegation

**When to Use:**
- Enabling account abstraction features for EOAs
- Implementing sponsored transactions
- Batch transaction execution
- Temporary permission grants
- Social recovery mechanisms

## Quick Start

```typescript
import { Authorization } from '@tevm/voltaire';
import type { Address } from '@tevm/voltaire';

// Create unsigned authorization
const unsigned: Authorization.Unsigned = {
  chainId: 1n,
  address: contractAddress,  // Address to delegate code to
  nonce: 0n
};

// Sign it (when implemented)
// const auth = Authorization.sign.call(unsigned, privateKey);

// Validate authorization
const auth: Authorization.Item = {
  chainId: 1n,
  address: contractAddress,
  nonce: 0n,
  yParity: 0,
  r: 0x123...n,
  s: 0x456...n
};

Authorization.validate.call(auth);

// Calculate gas cost
const gas = Authorization.getGasCost.call(auth, true);  // true = empty account
console.log(`Gas required: ${gas}`);
```

## Core Concepts

### Set Code Delegation

EIP-7702 allows an EOA to set its code to point to a contract's code:

```
EOA Account
├── Balance: Original EOA balance
├── Nonce: Original EOA nonce
└── Code: → Points to delegated contract code
```

**Important:**
- Delegation is **per-transaction** - resets after transaction
- Original EOA retains ownership and keys
- Delegated contract executes in EOA's context
- EOA's storage remains separate

### Authorization Workflow

1. **Create Unsigned Authorization**
   ```typescript
   const unsigned = { chainId, address, nonce };
   ```

2. **Sign Authorization** (creates signature over authorization data)
   ```typescript
   const auth = Authorization.sign.call(unsigned, privateKey);
   ```

3. **Include in Transaction**
   - Authorization list included in EIP-7702 transaction
   - Each authorization processed at transaction start

4. **Execution**
   - EOA code set to delegated contract
   - Transaction executes with delegated logic
   - Code delegation reverts after transaction

## Core Types

### Authorization.Item

Complete signed authorization.

```typescript
type Item = {
  chainId: bigint;      // Chain ID where valid
  address: Address;     // Contract to delegate to
  nonce: bigint;        // Account nonce
  yParity: number;      // Signature Y parity (0 or 1)
  r: bigint;            // Signature r value
  s: bigint;            // Signature s value
};
```

### Authorization.Unsigned

Authorization before signing.

```typescript
type Unsigned = {
  chainId: bigint;
  address: Address;
  nonce: bigint;
};
```

### Authorization.DelegationDesignation

Result of processing authorization.

```typescript
type DelegationDesignation = {
  authority: Address;         // Signer (EOA granting permission)
  delegatedAddress: Address;  // Contract receiving delegation
};
```

## Constants

### EIP-7702 Constants

```typescript
Authorization.MAGIC_BYTE = 0x05;                    // Signing hash prefix
Authorization.PER_EMPTY_ACCOUNT_COST = 25000n;      // Gas for empty account
Authorization.PER_AUTH_BASE_COST = 12500n;          // Base gas per authorization
```

### Signature Constants

```typescript
Authorization.SECP256K1_N = 0xfff...n;              // Curve order
Authorization.SECP256K1_HALF_N = SECP256K1_N >> 1n; // N/2 for malleability check
```

## Type Guards

### isItem

Check if value is signed Authorization.Item.

```typescript
Authorization.isItem(value: unknown): value is Authorization.Item
```

```typescript
if (Authorization.isItem(data)) {
  // TypeScript knows data is Authorization.Item
  Authorization.validate.call(data);
}
```

### isUnsigned

Check if value is Authorization.Unsigned.

```typescript
Authorization.isUnsigned(value: unknown): value is Authorization.Unsigned
```

## Validation

### validate

Validate authorization structure and signature parameters.

```typescript
Authorization.validate.call(auth: Authorization.Item): void
```

**Checks:**
- Chain ID must be non-zero
- Address cannot be zero address
- yParity must be 0 or 1
- Signature r and s must be non-zero
- r must be < SECP256K1_N
- s must be ≤ SECP256K1_HALF_N (no malleable signatures)

```typescript
const auth: Authorization.Item = {...};

try {
  Authorization.validate.call(auth);
  console.log('Valid authorization');
} catch (e) {
  if (e instanceof Authorization.ValidationError) {
    console.error('Invalid:', e.message);
  }
}
```

**Throws:** `Authorization.ValidationError`

## Hashing

### hash

Calculate signing hash for authorization.

**Status:** Not yet implemented

```typescript
Authorization.hash.call(unsigned: Authorization.Unsigned): Hash
```

**Formula:** `keccak256(MAGIC_BYTE || rlp([chainId, address, nonce]))`

```typescript
const unsigned: Authorization.Unsigned = {
  chainId: 1n,
  address: contractAddress,
  nonce: 0n
};

const sigHash = Authorization.hash.call(unsigned);
// Sign sigHash with secp256k1 private key
```

## Creation

### sign

Create signed authorization from unsigned.

**Status:** Not yet implemented

```typescript
Authorization.sign.call(
  unsigned: Authorization.Unsigned,
  privateKey: Uint8Array
): Authorization.Item
```

```typescript
const unsigned: Authorization.Unsigned = {
  chainId: 1n,
  address: contractAddress,
  nonce: 0n
};

const privateKey = new Uint8Array(32); // Your private key
const auth = Authorization.sign.call(unsigned, privateKey);
```

## Verification

### verify

Recover authority (signer) from authorization.

**Status:** Not yet implemented

```typescript
Authorization.verify.call(auth: Authorization.Item): Address
```

```typescript
const auth: Authorization.Item = {...};
const authority = Authorization.verify.call(auth);
console.log(`Authorized by: ${formatAddress(authority)}`);
```

**Throws:** `Authorization.ValidationError` if invalid

## Gas Calculations

### calculateGasCost

Calculate total gas cost for authorization list.

```typescript
Authorization.calculateGasCost.call(
  authList: Authorization.Item[],
  emptyAccounts: number
): bigint
```

```typescript
const authList: Authorization.Item[] = [auth1, auth2, auth3];
const emptyAccountCount = 2;

const gas = Authorization.calculateGasCost.call(authList, emptyAccountCount);
// gas = (3 * 12500) + (2 * 25000) = 87500
```

**Formula:** `(authList.length * PER_AUTH_BASE_COST) + (emptyAccounts * PER_EMPTY_ACCOUNT_COST)`

### getGasCost

Calculate gas cost for single authorization.

```typescript
Authorization.getGasCost.call(
  auth: Authorization.Item,
  isEmpty: boolean
): bigint
```

```typescript
const auth: Authorization.Item = {...};

const gasIfEmpty = Authorization.getGasCost.call(auth, true);
// 12500 + 25000 = 37500

const gasIfNotEmpty = Authorization.getGasCost.call(auth, false);
// 12500
```

## Processing

### process

Process single authorization and return delegation.

**Status:** Depends on unimplemented `verify()`

```typescript
Authorization.process.call(auth: Authorization.Item): Authorization.DelegationDesignation
```

```typescript
const auth: Authorization.Item = {...};
const delegation = Authorization.process.call(auth);

console.log(`${delegation.authority} delegates to ${delegation.delegatedAddress}`);
```

### processAll

Process authorization list and return all delegations.

**Status:** Depends on unimplemented `verify()`

```typescript
Authorization.processAll.call(authList: Authorization.Item[]): Authorization.DelegationDesignation[]
```

```typescript
const authList: Authorization.Item[] = [auth1, auth2, auth3];
const delegations = Authorization.processAll.call(authList);

delegations.forEach(d => {
  console.log(`${d.authority} -> ${d.delegatedAddress}`);
});
```

## Utilities

### format

Format authorization to human-readable string.

```typescript
Authorization.format.call(auth: Authorization.Item | Authorization.Unsigned): string
```

```typescript
const auth: Authorization.Item = {
  chainId: 1n,
  address: contractAddress,
  nonce: 42n,
  yParity: 0,
  r: 0x123n,
  s: 0x456n
};

console.log(Authorization.format.call(auth));
// "Authorization(chain=1, to=0x1234...5678, nonce=42, r=0x123, s=0x456, v=0)"
```

### equals

Check if two authorizations are equal.

```typescript
Authorization.equals.call(auth1: Authorization.Item, auth2: Authorization.Item): boolean
```

```typescript
const auth1: Authorization.Item = {...};
const auth2: Authorization.Item = {...};

if (Authorization.equals.call(auth1, auth2)) {
  console.log('Authorizations are identical');
}
```

## Common Patterns

### Creating Authorization List

```typescript
function createAuthList(
  delegations: Array<{ eoa: Address, contract: Address, nonce: bigint }>,
  chainId: bigint,
  privateKeys: Uint8Array[]
): Authorization.Item[] {
  const authList: Authorization.Item[] = [];

  for (let i = 0; i < delegations.length; i++) {
    const unsigned: Authorization.Unsigned = {
      chainId,
      address: delegations[i].contract,
      nonce: delegations[i].nonce
    };

    // When sign() is implemented:
    // const auth = Authorization.sign.call(unsigned, privateKeys[i]);
    // authList.push(auth);
  }

  return authList;
}
```

### Gas Estimation

```typescript
function estimateAuthorizationGas(
  authList: Authorization.Item[],
  accountStates: Map<Address, boolean>  // true = empty
): bigint {
  // Count empty accounts
  let emptyCount = 0;
  for (const auth of authList) {
    const isEmpty = accountStates.get(auth.address) ?? false;
    if (isEmpty) emptyCount++;
  }

  return Authorization.calculateGasCost.call(authList, emptyCount);
}
```

### Validation Pipeline

```typescript
function validateAuthList(authList: Authorization.Item[]): {
  valid: Authorization.Item[];
  invalid: Array<{ auth: Authorization.Item; error: string }>;
} {
  const valid: Authorization.Item[] = [];
  const invalid: Array<{ auth: Authorization.Item; error: string }> = [];

  for (const auth of authList) {
    try {
      Authorization.validate.call(auth);
      valid.push(auth);
    } catch (e) {
      if (e instanceof Authorization.ValidationError) {
        invalid.push({ auth, error: e.message });
      }
    }
  }

  return { valid, invalid };
}
```

### Batch Authorization Creation

```typescript
interface AuthRequest {
  chainId: bigint;
  delegate: Address;
  nonce: bigint;
}

function batchCreateAuthorizations(
  requests: AuthRequest[],
  privateKey: Uint8Array
): Authorization.Item[] {
  return requests.map(req => {
    const unsigned: Authorization.Unsigned = {
      chainId: req.chainId,
      address: req.delegate,
      nonce: req.nonce
    };

    // When sign() is implemented:
    // return Authorization.sign.call(unsigned, privateKey);

    // For now, return placeholder
    throw new Error('Authorization.sign() not yet implemented');
  });
}
```

## Use Cases

### Sponsored Transactions

Allow a relayer to pay gas for user transactions:

```typescript
// User creates authorization delegating to sponsor contract
const unsigned: Authorization.Unsigned = {
  chainId: 1n,
  address: sponsorContractAddress,
  nonce: await getAccountNonce(userEOA)
};

// User signs authorization
const auth = Authorization.sign.call(unsigned, userPrivateKey);

// Relayer includes in transaction
transaction.authorizationList = [auth];
transaction.gasPrice = relayerGasPrice;

// Sponsor contract pays gas, executes user's intended action
```

### Batch Operations

Execute multiple operations in a single transaction:

```typescript
// Delegate to batch executor contract
const auth: Authorization.Item = {
  chainId: 1n,
  address: batchExecutorAddress,
  nonce: currentNonce,
  yParity: 0,
  r: signatureR,
  s: signatureS
};

// Batch executor can now:
// - Approve multiple tokens
// - Swap on multiple DEXes
// - Transfer to multiple recipients
// All in one transaction with one signature
```

### Social Recovery

Implement social recovery for EOAs:

```typescript
// Guardian creates authorization
const guardianAuth: Authorization.Unsigned = {
  chainId: 1n,
  address: recoveryModuleAddress,
  nonce: guardianNonce
};

// Guardian signs
const auth = Authorization.sign.call(guardianAuth, guardianPrivateKey);

// Recovery module (when executed) can:
// - Verify guardian consensus
// - Execute recovery operations
// - Transfer assets to new account
```

### Temporary Permissions

Grant temporary permissions without key handover:

```typescript
// Delegate to time-locked contract
const tempAuth: Authorization.Unsigned = {
  chainId: 1n,
  address: timeLockDelegateAddress,
  nonce: currentNonce
};

// Time-lock contract enforces:
// - Expiration time
// - Allowed operations
// - Spending limits
// - Revocation conditions
```

## Best Practices

### 1. Always Validate

```typescript
// Good: Validate before processing
try {
  Authorization.validate.call(auth);
  processAuthorization(auth);
} catch (e) {
  handleInvalidAuth(e);
}

// Bad: Assuming validity
processAuthorization(auth);  // May fail unexpectedly
```

### 2. Check Nonce Consistency

```typescript
// Good: Verify nonce matches account state
const currentNonce = await getAccountNonce(authority);
if (auth.nonce !== currentNonce) {
  throw new Error('Nonce mismatch');
}

// Bad: Ignoring nonce
processAuthorization(auth);  // Will fail on-chain
```

### 3. Estimate Gas Accurately

```typescript
// Good: Check if accounts are empty
const isEmpty = await isAccountEmpty(auth.address);
const gas = Authorization.getGasCost.call(auth, isEmpty);

// Bad: Assuming all accounts are empty
const gas = Authorization.getGasCost.call(auth, true);  // May overestimate
```

### 4. Handle Failures Gracefully

```typescript
// Good: Process with error handling
const results = authList.map(auth => {
  try {
    return { auth, result: Authorization.process.call(auth) };
  } catch (e) {
    return { auth, error: e };
  }
});

// Bad: Fail on first error
const results = authList.map(auth => Authorization.process.call(auth));
```

### 5. Use Type Guards

```typescript
// Good: Verify types before processing
function handleAuth(data: unknown) {
  if (Authorization.isItem(data)) {
    Authorization.validate.call(data);
    return processAuth(data);
  }
  throw new Error('Invalid authorization data');
}

// Bad: Assuming types
function handleAuth(data: any) {
  Authorization.validate.call(data);  // Unsafe
}
```

### 6. Prevent Signature Malleability

The `validate()` function automatically checks for malleable signatures:

```typescript
// Validation ensures s <= N/2
// This prevents someone from creating a second valid signature
// for the same authorization
Authorization.validate.call(auth);  // Throws if s > N/2
```

### 7. Chain-Specific Authorizations

```typescript
// Good: Explicit chain ID
const auth: Authorization.Unsigned = {
  chainId: 1n,  // Mainnet only
  address: contractAddress,
  nonce: 0n
};

// Bad: Reusing cross-chain
// Authorization signed for chain 1 invalid on chain 137
```

## Security Considerations

### 1. Signature Verification

Always verify signatures before executing delegated code:

```typescript
const authority = Authorization.verify.call(auth);
// Verify authority is expected/authorized
```

### 2. Nonce Tracking

Prevent replay attacks by tracking nonces:

```typescript
const usedNonces = new Set<string>();
const key = `${authority}-${auth.nonce}`;

if (usedNonces.has(key)) {
  throw new Error('Nonce already used');
}
usedNonces.add(key);
```

### 3. Chain ID Validation

Prevent cross-chain replay:

```typescript
if (auth.chainId !== expectedChainId) {
  throw new Error('Wrong chain ID');
}
```

### 4. Address Validation

Ensure delegated address is trusted:

```typescript
const trustedContracts = new Set([...]);

if (!trustedContracts.has(auth.address)) {
  throw new Error('Untrusted delegation target');
}
```

### 5. Gas Limits

Set appropriate gas limits to prevent DoS:

```typescript
const maxGas = Authorization.calculateGasCost.call(authList, maxEmpty);
if (requiredGas > maxGas) {
  throw new Error('Gas limit exceeded');
}
```

## Performance Considerations

### Operation Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `isItem` | O(1) | Type checking |
| `isUnsigned` | O(1) | Type checking |
| `validate` | O(1) | Constant checks |
| `hash` | O(1) | RLP + keccak256 |
| `sign` | O(1) | secp256k1 signing |
| `verify` | O(1) | Signature recovery |
| `calculateGasCost` | O(n) | n = list length |
| `processAll` | O(n) | n = list length |
| `format` | O(1) | String formatting |
| `equals` | O(1) | Field comparison |

### Optimization Tips

1. **Batch validations** - validate all before processing
2. **Cache gas calculations** - if list doesn't change
3. **Pre-compute hashes** - reuse signing hashes when possible
4. **Limit list size** - large lists increase gas costs significantly

## Examples

### Complete Authorization Flow

```typescript
// 1. Create unsigned authorization
const unsigned: Authorization.Unsigned = {
  chainId: 1n,
  address: await deployContract('DelegateLogic'),
  nonce: await getAccountNonce(myEOA)
};

// 2. Sign (when implemented)
// const auth = Authorization.sign.call(unsigned, myPrivateKey);

// 3. Validate
Authorization.validate.call(auth);

// 4. Estimate gas
const isEmpty = await isAccountEmpty(auth.address);
const gas = Authorization.getGasCost.call(auth, isEmpty);

// 5. Include in transaction
const tx = {
  ...regularTxFields,
  authorizationList: [auth],
  gasLimit: gas + executionGas
};

// 6. Send transaction
await sendTransaction(tx);
```

## References

- [EIP-7702: Set EOA Account Code](https://eips.ethereum.org/EIPS/eip-7702)
- [EIP-2718: Typed Transaction Envelope](https://eips.ethereum.org/EIPS/eip-2718)
- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)

## API Summary

### Type Guards
- `isItem(value)` - Check if value is Authorization.Item
- `isUnsigned(value)` - Check if value is Authorization.Unsigned

### Validation
- `validate.call(auth)` - Validate authorization structure

### Hashing & Signing (Not Implemented)
- `hash.call(unsigned)` - Calculate signing hash
- `sign.call(unsigned, privateKey)` - Create signed authorization
- `verify.call(auth)` - Recover authority address

### Gas Calculations
- `calculateGasCost.call(authList, emptyAccounts)` - Total gas cost
- `getGasCost.call(auth, isEmpty)` - Single authorization cost

### Processing (Not Implemented)
- `process.call(auth)` - Process single authorization
- `processAll.call(authList)` - Process authorization list

### Utilities
- `format.call(auth)` - Format to string
- `equals.call(auth1, auth2)` - Check equality
