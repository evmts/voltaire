# viem-account Requirements

Extracted from viem source code analysis (viem/_esm/accounts/).

## Account Types

### LocalAccount<source, address>
- `address: Address` - checksummed address
- `publicKey: Hex` - uncompressed public key (0x04 prefixed, 65 bytes hex)
- `source: string` - account source identifier ('privateKey', 'hd', 'custom')
- `type: 'local'` - account type literal
- `nonceManager?: NonceManager` - optional nonce management
- `sign({ hash })` - sign raw hash, return Hex signature
- `signAuthorization(authorization)` - sign EIP-7702 authorization
- `signMessage({ message })` - sign EIP-191 prefixed message
- `signTransaction(transaction, { serializer? })` - sign and serialize transaction
- `signTypedData(typedData)` - sign EIP-712 typed data

### PrivateKeyAccount extends LocalAccount<'privateKey'>
- All LocalAccount methods
- `sign` and `signAuthorization` are non-nullable (required)
- `source: 'privateKey'`

### HDAccount extends LocalAccount<'hd'>
- All LocalAccount methods
- `getHdKey(): HDKey` - returns HD key for derivation
- `sign` is non-nullable (required)
- `source: 'hd'`

### JsonRpcAccount
- `address: Address`
- `type: 'json-rpc'`
- No signing methods (defers to provider)

## Factory Functions

### privateKeyToAccount(privateKey: Hex, options?: { nonceManager? }): PrivateKeyAccount
1. Derive public key: `secp256k1.getPublicKey(privateKey, false)` (uncompressed)
2. Derive address: `keccak256(publicKey.slice(4)).slice(-40)` then checksum
3. Return account with all signing methods bound to private key

### hdKeyToAccount(hdKey: HDKey, options?: HDOptions): HDAccount
1. Derive child key using path: `m/44'/60'/${accountIndex}'/${changeIndex}/${addressIndex}`
2. Create privateKeyToAccount from derived private key
3. Add `getHdKey()` method
4. Set `source: 'hd'`

### toAccount(source: AccountSource): LocalAccount | JsonRpcAccount
- If source is string (address): return JsonRpcAccount
- If source is CustomSource: validate address, return LocalAccount with all methods

## Signing Specifications

### sign({ hash, privateKey, to })
- Input: 32-byte hash (Keccak256)
- Algorithm: ECDSA secp256k1 with lowS normalization
- Output: `{ r: Hex, s: Hex, v: bigint, yParity: number }`
- v: 27n or 28n (Ethereum format)
- yParity: 0 or 1 (EIP-155 format)

### signMessage({ message, privateKey })
- Message types:
  - `string` - UTF-8 encode
  - `{ raw: Hex }` - use as-is
  - `{ raw: Uint8Array }` - convert to hex
- Prefix: `"\x19Ethereum Signed Message:\n" + byteLength`
- Hash: `keccak256(prefix + message)`
- Sign hash, return 65-byte hex signature

### signTypedData({ domain, types, primaryType, message, privateKey })
- Hash using EIP-712: `keccak256("\x19\x01" + domainSeparator + structHash)`
- Sign hash, return 65-byte hex signature

### signTransaction({ privateKey, transaction, serializer })
- For EIP-4844: exclude sidecars from signing hash
- Hash: `keccak256(serializer(transaction))`
- Sign hash
- Return `serializer(transaction, signature)`

### signAuthorization({ chainId, nonce, address, privateKey })
- EIP-7702 authorization signing
- Hash: `keccak256('0x05' || rlp([chainId, address, nonce]))`
- Sign hash
- Return `{ address, chainId, nonce, r, s, v, yParity }`

## Type Definitions

```typescript
type Hex = `0x${string}`
type Address = `0x${string}` // 20 bytes checksummed
type Hash = `0x${string}` // 32 bytes

type SignableMessage = string | { raw: Hex | Uint8Array }

type TypedDataDefinition = {
  domain?: EIP712Domain
  types: Record<string, TypeProperty[]>
  primaryType: string
  message: Record<string, unknown>
}

type Signature = {
  r: Hex
  s: Hex
  v: bigint
  yParity: number
}

type SerializedSignature = Hex // 65 bytes: r + s + v
```

## Error Types

- `InvalidAddressError` - address validation failed
- `InvalidPrivateKeyError` - private key validation failed
- `SigningError` - signing operation failed

## Implementation Notes

1. **Async by default**: All sign methods return Promise (for hardware wallet compat)
2. **lowS normalization**: Always normalize s to lower half of curve order
3. **Recovery**: Calculate recovery bit by trying values 0-3 against public key
4. **Checksum**: EIP-55 mixed-case checksum for addresses
5. **Extra entropy**: Optional extraEntropy parameter for non-deterministic signatures
