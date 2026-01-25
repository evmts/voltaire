# Signature Utilities Gaps

<issue>
<metadata>
priority: P1
category: viem-parity
files: [src/crypto/, src/primitives/Signature/]
reviews: []
</metadata>

<gap_analysis>
Viem has extensive signature utilities. Voltaire-effect has basic signing but lacks recovery, verification, and format conversion utilities.

<status_matrix>
| Utility | Viem | Voltaire | tevm-monorepo | Priority |
|---------|------|----------|---------------|----------|
| parseSignature | ✅ | ❌ | ❌ | P1 |
| serializeSignature | ✅ | ❌ | ❌ | P1 |
| parseCompactSignature (EIP-2098) | ✅ | ❌ | ❌ | P2 |
| recoverAddress | ✅ | ❌ | ✅ @tevm/utils | P0 |
| recoverMessageAddress | ✅ | ❌ | ✅ @tevm/utils | P0 |
| recoverPublicKey | ✅ | ❌ | ✅ @tevm/utils | P0 |
| recoverTypedDataAddress | ✅ | ❌ | ❌ | P1 |
| verifyMessage | ✅ | ❌ | ✅ @tevm/utils | P0 |
| verifyTypedData | ✅ | ❌ | ❌ | P1 |
| verifyHash (EIP-1271) | ✅ | ❌ | ❌ | P1 |
| hashMessage (EIP-191) | ✅ | ❌ | ✅ @tevm/utils | P0 |
| hashTypedData (EIP-712) | ✅ | ❌ | ❌ | P1 |
| ERC-6492 (counterfactual) | ✅ | ❌ | ❌ | P2 |
| ERC-8010 (key-scoped) | ✅ | ❌ | ❌ | P3 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>Signature Recovery</feature>
<location>viem/src/utils/signature/recoverAddress.ts</location>
<implementation>
```typescript
import {
  recoverAddress,
  recoverMessageAddress,
  recoverTypedDataAddress,
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

// Recover full public key
const publicKey = await recoverPublicKey({ hash, signature })
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Signature Verification</feature>
<location>viem/src/actions/public/verifyMessage.ts</location>
<implementation>
```typescript
import { verifyMessage, verifyTypedData, verifyHash } from 'viem'

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
Features: EOA (ecrecover), smart accounts (EIP-1271), ERC-6492 (counterfactual)
</implementation>
</viem_reference>

<viem_reference>
<feature>ERC-6492 Counterfactual Signatures</feature>
<location>viem/src/utils/signature/isErc6492Signature.ts</location>
<implementation>
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

// Create wrapped signature for undeployed smart account
const wrapped = serializeErc6492Signature({
  address: factoryAddress,
  data: factoryCalldata,
  signature: innerSignature
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>tevm-monorepo Reference Implementation</feature>
<location>tevm-monorepo/packages/utils/src/signature.js</location>
<implementation>
```typescript
// Already implemented in @tevm/utils - can wrap with Effect

export function recoverPublicKey({ hash, signature }) {
  const v = signature.yParity !== undefined
    ? signature.yParity
    : signature.v !== undefined
      ? signature.v - 27
      : throw new Error('Either v or yParity must be provided')

  const publicKey = ecrecover(toBytes(hash), BigInt(v), rBytes, sBytes)
  return `0x04${toHex(publicKey).slice(2)}`
}

export function recoverAddress({ hash, signature }) {
  const publicKey = recoverPublicKey({ hash, signature })
  const addressHash = keccak256(publicKeyBytes)
  return getAddress(`0x${addressHash.slice(-40)}`)
}

export function recoverMessageAddress({ message, signature }) {
  const hash = hashMessage(message)
  return recoverAddress({ hash, signature })
}

export function verifyMessage({ address, message, signature }) {
  try {
    const recoveredAddress = recoverMessageAddress({ message, signature })
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch {
    return false
  }
}
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// Wrap @tevm/utils with Effect for consistent API

import { recoverPublicKey as tevmRecoverPublicKey } from '@tevm/utils'

// Effect-wrapped signature recovery
const recoverPublicKey = (params: { hash: Hex; signature: Signature }): 
  Effect<Hex, SignatureError> =>
  Effect.try({
    try: () => tevmRecoverPublicKey(params),
    catch: (e) => new SignatureError({ 
      message: 'Failed to recover public key',
      cause: e 
    })
  })

const recoverAddress = (params: { hash: Hex; signature: Signature }): 
  Effect<Address, SignatureError> =>
  Effect.gen(function* () {
    const publicKey = yield* recoverPublicKey(params)
    const publicKeyBytes = Hex.toBytes(publicKey).slice(1)
    const addressHash = Keccak256.hash(publicKeyBytes)
    return Address.fromHex(`0x${Hex.toHex(addressHash).slice(-40)}`)
  })

const recoverMessageAddress = (params: { message: string; signature: Signature }): 
  Effect<Address, SignatureError> =>
  Effect.gen(function* () {
    const hash = yield* hashMessage(params.message)
    return yield* recoverAddress({ hash, signature: params.signature })
  })

// Verification with EIP-1271 smart account support
const verifyMessage = (params: { 
  address: Address
  message: string
  signature: Hex 
}): Effect<boolean, ProviderError, ProviderService> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService
    
    // First try EOA verification
    const eoa = yield* recoverMessageAddress({
      message: params.message,
      signature: parseSignature(params.signature)
    }).pipe(Effect.option)
    
    if (Option.isSome(eoa) && Address.equals(eoa.value, params.address)) {
      return true
    }
    
    // Try EIP-1271 smart account verification
    const hash = yield* hashMessage(params.message)
    const result = yield* provider.call({
      to: params.address,
      data: encodeIsValidSignature(hash, params.signature)
    }).pipe(Effect.option)
    
    return Option.isSome(result) && result.value === EIP1271_MAGIC_VALUE
  })

// Signature parsing/formatting
const parseSignature = (sig: Hex): Effect<Signature, SignatureError> =>
  Effect.try({
    try: () => {
      if (sig.length === 132) {
        // Standard 65-byte signature
        const r = `0x${sig.slice(2, 66)}` as Hex
        const s = `0x${sig.slice(66, 130)}` as Hex
        const v = parseInt(sig.slice(130, 132), 16)
        return { r, s, v, yParity: (v - 27) as 0 | 1 }
      } else if (sig.length === 130) {
        // EIP-2098 compact signature
        return parseCompactSignature(sig)
      }
      throw new Error(`Invalid signature length: ${sig.length}`)
    },
    catch: (e) => new SignatureError({ message: 'Failed to parse signature', cause: e })
  })

const serializeSignature = (sig: Signature): Hex => {
  const r = sig.r.slice(2).padStart(64, '0')
  const s = sig.s.slice(2).padStart(64, '0')
  const v = (sig.v ?? (sig.yParity! + 27)).toString(16).padStart(2, '0')
  return `0x${r}${s}${v}` as Hex
}

// ERC-6492 counterfactual signature utilities
const isErc6492Signature = (sig: Hex): boolean =>
  sig.endsWith(ERC6492_MAGIC_SUFFIX)

const parseErc6492Signature = (sig: Hex): Effect<{
  address: Address
  data: Hex
  signature: Hex
}, SignatureError> =>
  Effect.try({
    try: () => {
      const decoded = ABI.decode(['address', 'bytes', 'bytes'], sig.slice(0, -64))
      return {
        address: decoded[0] as Address,
        data: decoded[1] as Hex,
        signature: decoded[2] as Hex
      }
    },
    catch: (e) => new SignatureError({ message: 'Invalid ERC-6492 signature', cause: e })
  })
```
</effect_solution>

<implementation>
<new_files>
- src/crypto/Signature/recoverPublicKey.ts
- src/crypto/Signature/recoverAddress.ts
- src/crypto/Signature/recoverMessageAddress.ts
- src/crypto/Signature/recoverTypedDataAddress.ts
- src/crypto/Signature/verifyMessage.ts
- src/crypto/Signature/verifyTypedData.ts
- src/crypto/Signature/verifyHash.ts
- src/crypto/Signature/parseSignature.ts
- src/crypto/Signature/serializeSignature.ts
- src/crypto/Signature/hashMessage.ts
- src/crypto/Signature/hashTypedData.ts
- src/crypto/Signature/erc6492.ts
</new_files>

<phases>
1. **Phase 1 - Wrap @tevm/utils** (P0)
   - Effect wrappers for recoverAddress, recoverMessageAddress, recoverPublicKey
   - Effect wrappers for verifyMessage, hashMessage
   - Export from voltaire-effect

2. **Phase 2 - Add Missing Recovery** (P1)
   - recoverTypedDataAddress
   - hashTypedData (EIP-712)

3. **Phase 3 - Signature Parsing** (P1)
   - parseSignature (hex → {r,s,v})
   - serializeSignature ({r,s,v} → hex)
   - parseCompactSignature (EIP-2098)

4. **Phase 4 - Smart Account Verification** (P1)
   - verifyHash with EIP-1271 support
   - verifyTypedData with EIP-1271 support

5. **Phase 5 - ERC-6492 Counterfactual** (P2)
   - isErc6492Signature
   - parseErc6492Signature
   - serializeErc6492Signature
   - verifyHash with ERC-6492 unwrapping

6. **Phase 6 - ERC-8010 Key-Scoped** (P3)
   - For multi-key smart accounts
</phases>
</implementation>

<tests>
```typescript
describe('recoverAddress', () => {
  it('recovers signer from hash and signature', () =>
    Effect.gen(function* () {
      const address = yield* recoverAddress({
        hash: '0x82ff40c0a986c6a5cfad4ddf4c3aa6996f1a7837f9c398e17e5de5cbd5a12b28',
        signature: {
          r: 0x99e71a99cb2270b8cac5254f9e99b6210c6c10224a1579cf389ef88b20a1abe9n,
          s: 0x129ff05af364204442bdb53ab6f18a99ab48acc9326fa689f228040429e3ca66n,
          v: 27
        }
      })
      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    }))
})

describe('verifyMessage', () => {
  it('verifies EOA signature', () =>
    Effect.gen(function* () {
      const valid = yield* verifyMessage({
        address: signerAddress,
        message: 'Hello',
        signature: sig
      })
      expect(valid).toBe(true)
    }))
  
  it('verifies smart account via EIP-1271', () =>
    Effect.gen(function* () {
      const valid = yield* verifyMessage({
        address: smartAccountAddress,
        message: 'Hello',
        signature: sig
      })
      expect(valid).toBe(true)
    }).pipe(Effect.provide(providerLayer)))
})

describe('parseSignature', () => {
  it('parses 65-byte signature', () =>
    Effect.gen(function* () {
      const sig = yield* parseSignature('0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b')
      expect(sig.v).toBe(27)
      expect(sig.yParity).toBe(0)
    }))
})
```
</tests>

<references>
- https://viem.sh/docs/utilities/recoverAddress
- https://viem.sh/docs/utilities/verifyMessage
- https://eips.ethereum.org/EIPS/eip-191
- https://eips.ethereum.org/EIPS/eip-1271
- https://eips.ethereum.org/EIPS/eip-6492
- tevm-monorepo/packages/utils/src/signature.js
</references>
</issue>
