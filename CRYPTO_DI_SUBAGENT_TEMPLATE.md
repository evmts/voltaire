# Crypto Dependency Injection - Subagent Template

## Mission

Convert `[MODULE_NAME].[METHOD_NAME]` to factory pattern with explicit crypto dependency injection.

## Pattern Established (from Address)

### Factory Function Structure

```typescript
/**
 * Factory: [Brief description]
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Uint8Array) => Uint8Array} [deps.otherCrypto] - Other crypto if needed
 * @returns {([params]) => ReturnType} Function that [does the thing]
 */
export function MethodName({ keccak256, otherCrypto }) {
  return function methodName([params]) {
    // implementation using deps.keccak256, deps.otherCrypto
  }
}
```

**Key rules:**
- Factory name = PascalCase (e.g., `FromPublicKey`, `ToChecksummed`)
- Returned function name = camelCase (e.g., `fromPublicKey`, `toChecksummed`)
- Remove ALL direct crypto imports from implementation file
- Preserve ALL JSDoc comments and types
- No defaults - crypto always explicit

## Files to Change

### 1. Implementation File(s)
**Location:** `src/primitives/[Module]/Branded[Module]/[methodName].js`

**Changes:**
- Convert to factory: `export function MethodName(deps) { return function methodName(...) {...} }`
- Remove direct crypto imports (keccak256, secp256k1, rlpEncode, etc.)
- Use `deps.cryptoFn` instead of direct `cryptoFn()`
- Keep all JSDoc, error handling, helper functions

### 2. Exports File
**Location:** `src/primitives/[Module]/Branded[Module]/index.ts`

**Changes:**
- Export factory: `export { MethodName } from './methodName.js'`
- Import crypto dependencies at top of file
- Create wrapper with auto-injected crypto:
  ```typescript
  import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js'

  // Factory export (tree-shakeable)
  export { MethodName } from './methodName.js'

  // Wrapper export (convenient, backward compat)
  export const methodName = MethodName({ keccak256, ...otherDeps })
  ```
- Update namespace export to include both factory and wrapper

### 3. Test Files
**Location:** `src/primitives/[Module]/Branded[Module]/[methodName].test.ts`

**Changes:**
- Import factory: `import { MethodName } from './methodName.js'`
- Import crypto deps: `import { hash as keccak256 } from '../../../crypto/Keccak256/hash.js'`
- Instantiate at top of test file:
  ```typescript
  const methodName = MethodName({ keccak256, ...otherDeps })
  ```
- Update all test calls to use factory instance
- Run tests: `bun test -- [methodName]`

### 4. Documentation Files
**Location:** `docs/primitives/[module]/[method-name].mdx`

**Changes:**
- Add new "Factory API" tab (if doesn't exist):
  ```markdown
  <Tab title="Factory API">

  ## `MethodName({ keccak256 })((params)): ReturnType`

  Tree-shakeable factory pattern with explicit crypto dependencies.

  **Dependencies:**
  - `keccak256: (data: Uint8Array) => Uint8Array` - Keccak256 hash function

  **Example:**

  \`\`\`typescript
  import { MethodName } from '@tevm/voltaire/[Module]'
  import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'

  const methodName = MethodName({ keccak256 })
  const result = methodName([params])
  \`\`\`

  **Bundle size:** Crypto only included if you import it.

  </Tab>
  ```
- Update existing tabs to show crypto is now explicit
- Add Performance/Bundle Size section noting dependencies

## Crypto Dependencies by Module (from analysis)

### Common Dependencies

**keccak256** (most common):
- Address: toChecksummed, fromPublicKey, calculateCreate*, isValidChecksum
- Transaction: hash, getSigningHash (all 5 types)
- Hash: keccak256, keccak256Hex, keccak256String, merkleRoot
- ABI: getSelector (all types)
- ENS: namehash, labelhash
- Authorization: hash
- SIWE: getMessageHash
- Bytecode: hash

**secp256k1**:
- Address: fromPrivateKey
- Transaction: verifySignature, sign (all 5 types)
- Signature: sign, verify, recoverPublicKey
- SIWE: verify

**rlpEncode**:
- Address: calculateCreateAddress
- Transaction: hash, getSigningHash (all types)
- Authorization: hash

**sha256**:
- Blob: toVersionedHash

**KZG** (c-kzg-4844):
- Blob: toCommitment, toProof, verify

**blake3**:
- BinaryTree: hashLeaf, hashInternal, hashStem

## Order of Operations (CRITICAL)

1. **Read** all files to understand current implementation
2. **Update docs** - Show the new API first (doc-driven)
3. **Implement** factory functions in implementation files
4. **Update** exports in index.ts
5. **Update** all test files
6. **Run** tests: `bun test -- [module/method]`
7. **Fix** any failures
8. **Return** summary with test results

## Success Criteria

✅ Factory functions exported with PascalCase names
✅ No direct crypto imports in implementation files
✅ Backward-compatible wrappers with auto-injected crypto
✅ All tests pass
✅ Documentation shows factory pattern
✅ Tree-shaking verified (crypto not bundled unless imported)

## Example Implementations from Address

### Simple (1 crypto dep)

```typescript
// fromPublicKey.js
export function FromPublicKey({ keccak256 }) {
  return function fromPublicKey(x, y) {
    const pubkey = new Uint8Array(64)
    // encode x, y...
    const hash = keccak256(pubkey)  // Uses injected keccak256
    return hash.slice(12)
  }
}
```

### Complex (2 crypto deps)

```typescript
// fromPrivateKey.js
import { FromPublicKey } from './fromPublicKey.js'

export function FromPrivateKey({ keccak256, derivePublicKey }) {
  const fromPublicKey = FromPublicKey({ keccak256 })

  return function fromPrivateKey(privateKey) {
    const pubkey = derivePublicKey(privateKey)  // Uses injected derivePublicKey
    // extract x, y from pubkey...
    return fromPublicKey(x, y)  // Reuses other factory
  }
}
```

### With RLP

```typescript
// calculateCreateAddress.js
export function CalculateCreateAddress({ keccak256, rlpEncode }) {
  return function calculateCreateAddress(address, nonce) {
    const nonceBytes = encodeNonce(nonce)  // Helper function
    const encoded = rlpEncode([address, nonceBytes])  // Uses injected RLP
    const hash = keccak256(encoded)  // Uses injected keccak256
    return hash.slice(12)
  }
}
```

## Testing Strategy

1. **Unit tests:** Factory creates working functions
2. **Integration tests:** Wrappers work with auto-injection
3. **Tree-shaking test:** Bundle size without crypto import
4. **Error handling:** Clear errors when crypto missing

## Common Pitfalls

❌ **Don't** use default crypto imports
❌ **Don't** forget to update docs
❌ **Don't** skip JSDoc comments
❌ **Don't** leave test files unchanged
❌ **Don't** batch multiple modules in one subagent (keep focused)

✅ **Do** preserve all error handling
✅ **Do** keep helper functions
✅ **Do** run tests after changes
✅ **Do** update ALL files that import the method

## Module-Specific Instructions

When assigned a module, you will receive:
- Module name (e.g., "Transaction", "Hash", "ABI")
- Method(s) to convert
- Specific crypto dependencies for those methods
- Any module-specific patterns or considerations

Follow this template exactly, adapting only the specific method names and crypto dependencies.
