# Viem Account Abstraction Analysis

**Date**: 2026-01-25
**Priority**: Reference
**Category**: Architecture Analysis

## Overview

This document analyzes viem's Account abstraction (LocalAccount, JsonRpcAccount, SmartAccount) and compares with voltaire-effect's AccountService.

## Account Types Comparison

### viem Account Hierarchy

```
Account (union type)
├── JsonRpcAccount      - Remote signing via JSON-RPC
├── LocalAccount        - Local signing with private key
│   ├── PrivateKeyAccount
│   ├── HDAccount
│   └── Custom (via toAccount)
└── SmartAccount        - ERC-4337 smart contract accounts
```

### voltaire-effect Account Hierarchy

```
AccountService
├── LocalAccount(privateKey)
└── JsonRpcAccount(address)
```

## LocalAccount Comparison

### Properties

| Property | viem LocalAccount | voltaire-effect LocalAccount |
|----------|-------------------|------------------------------|
| `address` | ✅ Address | ✅ AddressType |
| `publicKey` | ✅ Hex | ❌ **Missing** |
| `source` | ✅ 'privateKey' \| 'hd' \| 'custom' | ❌ Missing (has type) |
| `type` | ✅ 'local' | ✅ 'local' |
| `nonceManager` | ✅ Optional NonceManager | ❌ **Missing** |

### Methods

| Method | viem | voltaire-effect |
|--------|------|-----------------|
| `sign({ hash })` | ✅ Raw hash signing | ❌ **Missing** (only signMessage) |
| `signAuthorization` | ✅ EIP-7702 | ❌ **Missing** |
| `signMessage` | ✅ | ✅ |
| `signTransaction` | ✅ With custom serializer option | ⚠️ No serializer option |
| `signTypedData` | ✅ | ✅ |

### NonceManager Integration

viem allows account-level nonce management:

```typescript
// viem
import { createNonceManager, jsonRpc } from 'viem'

const account = privateKeyToAccount('0x...', {
  nonceManager: createNonceManager({ source: jsonRpc() })
})
```

voltaire-effect has `NonceManagerService` but it's not integrated at the account level - it's a separate service.

**Gap**: Account should optionally accept a NonceManager for automatic nonce handling.

## HD Account Support

### viem HDAccount

```typescript
import { mnemonicToAccount, hdKeyToAccount } from 'viem/accounts'

// From mnemonic
const account = mnemonicToAccount('abandon abandon...', {
  accountIndex: 0,      // m/44'/60'/${accountIndex}'/0/0
  addressIndex: 0,      // m/44'/60'/0'/0/${addressIndex}
  changeIndex: 0,       // m/44'/60'/0'/${changeIndex}/0
  path: undefined,      // Or custom path
  passphrase: undefined // BIP-39 passphrase
})

account.getHdKey()  // Access underlying HDKey for derivation
```

### voltaire-effect

```typescript
import { fromMnemonic } from 'voltaire-effect/services/Account'

const layer = fromMnemonic(mnemonic, { passphrase })
```

**Gaps**:
- ❌ No `accountIndex`, `addressIndex`, `changeIndex` options
- ❌ No `path` option for custom derivation paths
- ❌ No `getHdKey()` method for further derivation
- ❌ Can't derive child accounts from a parent

## Custom Account Sources

### viem toAccount

```typescript
import { toAccount } from 'viem/accounts'

// Create custom account from signing functions
const account = toAccount({
  address: '0x...',
  nonceManager: customNonceManager,
  sign: async ({ hash }) => { /* custom signing */ },
  signAuthorization: async (auth) => { /* EIP-7702 */ },
  signMessage: async ({ message }) => { /* EIP-191 */ },
  signTransaction: async (tx, { serializer }) => { /* with custom serializer */ },
  signTypedData: async (typedData) => { /* EIP-712 */ }
})
```

### voltaire-effect

No equivalent. Must implement full AccountService layer.

**Recommendation**: Add `toAccount` factory for custom signing implementations (hardware wallets, KMS, etc.)

## Smart Account (ERC-4337) Support

### viem SmartAccountImplementation

```typescript
interface SmartAccountImplementation {
  client: Client
  entryPoint: {
    abi: Abi
    address: Address
    version: EntryPointVersion  // '0.6' | '0.7'
  }
  
  getAddress(): Promise<Address>
  decodeCalls?(data: Hex): Promise<Call[]>
  encodeCalls(calls: Call[]): Promise<Hex>
  getFactoryArgs(): Promise<{ factory?, factoryData? }>
  getNonce?(params?): Promise<bigint>
  getStubSignature(userOp?): Promise<Hex>
  
  sign?({ hash }): Promise<Hex>
  signMessage({ message }): Promise<Hex>
  signTypedData(typedData): Promise<Hex>
  signUserOperation(userOp): Promise<Hex>
  
  userOperation?: {
    estimateGas?(userOp): Promise<GasEstimate>
  }
  
  // EIP-7702 support
  authorization?: {
    account: PrivateKeyAccount
    address: Address
  }
  
  nonceKeyManager?: NonceManager
}
```

### voltaire-effect

**No smart account support at all.**

**Required for Smart Account support**:
1. `SmartAccount` type/service
2. `UserOperation` type definitions
3. `Bundler` service for submitting user operations
4. `Paymaster` service integration
5. EntryPoint ABI handling
6. Gas estimation for user operations

## JsonRpcAccount Comparison

### viem

```typescript
type JsonRpcAccount = {
  address: Address
  type: 'json-rpc'
}
```

Signing is delegated to the connected JSON-RPC provider.

### voltaire-effect

```typescript
// JsonRpcAccount.ts - delegates to TransportService
const JsonRpcAccount = (address: AddressType) => Layer.effect(...)
```

**Equivalent** - both delegate signing to the transport/provider.

## WebAuthn Account

### viem

```typescript
interface WebAuthnAccount {
  id: string
  publicKey: Hex
  type: 'webAuthn'
  
  sign({ hash }): Promise<WebAuthnSignReturnType>
  signMessage({ message }): Promise<WebAuthnSignReturnType>
  signTypedData(typedData): Promise<WebAuthnSignReturnType>
}
```

### voltaire-effect

**Not supported.**

**Gap**: No WebAuthn/passkey account support for smart wallet use cases.

## Authorization (EIP-7702) Support

### viem Types

```typescript
type Authorization = {
  address: Address      // Contract to delegate to
  chainId: number
  nonce: number
} & Signature  // r, s, yParity

type AuthorizationRequest = {
  address: Address | contractAddress: Address
  chainId: number
  nonce: number
}

// Signing
import { signAuthorization } from 'viem/accounts'
const signedAuth = await signAuthorization({
  privateKey: '0x...',
  address: '0x...',
  chainId: 1,
  nonce: 0
})
```

### voltaire-effect

- ✅ TransactionRequest supports `authorizationList` field
- ✅ Transaction serialization supports type 4
- ❌ No `signAuthorization` helper
- ❌ No `prepareAuthorization` for nonce lookup
- ❌ Account doesn't have `signAuthorization` method

## Missing Account Utilities

| Utility | viem | voltaire-effect |
|---------|------|-----------------|
| `generateMnemonic` | ✅ | ❌ |
| `generatePrivateKey` | ✅ | ❌ |
| `mnemonicToAccount` | ✅ | ⚠️ `fromMnemonic` |
| `hdKeyToAccount` | ✅ | ❌ |
| `privateKeyToAccount` | ✅ | ⚠️ `LocalAccount` |
| `publicKeyToAddress` | ✅ | Via Address module |
| `privateKeyToAddress` | ✅ | ❌ |
| `parseAccount` | ✅ | ❌ |

## Recommendations

### High Priority

1. **Add `sign({ hash })` method to AccountService**
   - Raw hash signing needed for many protocols

2. **Add `signAuthorization` method**
   - EIP-7702 is live on mainnet

3. **Add `publicKey` property to LocalAccount**
   - Required for many signature verification flows

4. **Add `nonceManager` option to LocalAccount**
   - Essential for high-throughput transaction sending

5. **Add HD derivation options**
   - `accountIndex`, `addressIndex`, `changeIndex`, `path`
   - `getHdKey()` for further derivation

### Medium Priority

6. **Add `toAccount` factory**
   - Enable custom signing implementations (hardware wallets, KMS)

7. **Add account utilities**
   - `generateMnemonic()`
   - `generatePrivateKey()`
   - `privateKeyToAddress()`

8. **Add signTransaction serializer option**
   - Custom serializers for L2 chains

### Lower Priority

9. **SmartAccount service**
   - ERC-4337 support
   - Bundler integration
   - Paymaster support

10. **WebAuthn account support**
    - Passkey-based signing
    - Smart wallet integration
