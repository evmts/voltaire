# SIWE and Authentication Gaps

<issue>
<metadata>
priority: P1
category: viem-parity
files: [src/services/]
reviews: []
</metadata>

<gap_analysis>
Viem has Sign-In with Ethereum (SIWE/EIP-4361) support and experimental auth features. Voltaire-effect has none.

<status_matrix>
| Feature | Viem | Voltaire | Priority |
|---------|------|----------|----------|
| createSiweMessage | ✅ | ❌ | P0 |
| parseSiweMessage | ✅ | ❌ | P0 |
| validateSiweMessage | ✅ | ❌ | P0 |
| verifySiweMessage | ✅ | ❌ | P0 |
| generateSiweNonce | ✅ | ❌ | P0 |
| ERC-7715 (grantPermissions) | ✅ Experimental | ❌ | P2 |
| ERC-7739 (typed signing for smart accounts) | ✅ Experimental | ❌ | P2 |
| ERC-7821 (batch executor) | ✅ Experimental | ❌ | P3 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>SIWE Message Creation and Verification</feature>
<location>viem/src/siwe/</location>
<implementation>
```typescript
import {
  createSiweMessage,
  parseSiweMessage,
  validateSiweMessage,
  verifySiweMessage,
  generateSiweNonce
} from 'viem/siwe'

// Generate nonce
const nonce = generateSiweNonce()

// Create SIWE message
const message = createSiweMessage({
  address: '0x...',
  chainId: 1,
  domain: 'example.com',
  nonce,
  uri: 'https://example.com/login',
  version: '1',
  statement: 'Sign in to Example App',
  expirationTime: new Date(Date.now() + 3600000),
  notBefore: new Date(),
  requestId: 'request-123',
  resources: ['https://example.com/api']
})

// Parse message string back to object
const parsed = parseSiweMessage(message)

// Validate message (checks format, times, etc.)
const isValid = validateSiweMessage({
  message: parsed,
  address: '0x...',
  domain: 'example.com',
  nonce
})

// Verify signature (async, requires client for smart accounts)
const verified = await verifySiweMessage(client, {
  message,
  signature: '0x...'
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>ERC-7715 Permission Grants (Experimental)</feature>
<location>viem/src/experimental/erc7715/</location>
<implementation>
```typescript
import { grantPermissions } from 'viem/experimental'

const result = await grantPermissions(client, {
  expiry: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  permissions: [
    {
      type: 'native-token-transfer',
      data: { ticker: 'ETH' },
      policies: [
        {
          type: 'token-allowance',
          data: { allowance: parseEther('1') }
        }
      ],
      required: true
    }
  ],
  signer: {
    type: 'keys',
    data: { ids: ['0x...'] }
  }
})

// Returns: { expiry, grantedPermissions, permissionsContext, signerData }
```
</implementation>
</viem_reference>

<viem_reference>
<feature>verifySiweMessage in tevm-monorepo</feature>
<location>tevm-monorepo/packages/memory-client/src/test/viem/verifySiweMessage.spec.ts</location>
<implementation>
```typescript
import { createSiweMessage } from 'viem/siwe'

describe('verifySiweMessage', () => {
  it('should work', async () => {
    const message = createSiweMessage({
      address: account.address,
      chainId: 1,
      domain: 'example.com',
      nonce: 'foobarbaz',
      uri: 'https://example.com',
      version: '1',
    })
    const signature = await account.signMessage({ message })
    expect(await mc.verifySiweMessage({ message, signature })).toBe(true)
  })
})
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// SIWE Message Type
interface SiweMessage {
  readonly address: Address
  readonly chainId: number
  readonly domain: string
  readonly nonce: string
  readonly uri: string
  readonly version: '1'
  
  // Optional fields
  readonly statement?: string
  readonly expirationTime?: Date
  readonly notBefore?: Date
  readonly requestId?: string
  readonly resources?: readonly string[]
  readonly scheme?: string
}

// SIWE Service
interface SiweServiceShape {
  readonly generateNonce: () => Effect<string>
  readonly createMessage: (params: SiweMessage) => Effect<string>
  readonly parseMessage: (message: string) => Effect<SiweMessage, SiweParseError>
  readonly validateMessage: (params: ValidateParams) => Effect<boolean, SiweValidationError>
  readonly verifyMessage: (params: VerifyParams) => Effect<boolean, SiweError, ProviderService>
}

class SiweService extends Context.Tag('SiweService')<
  SiweService,
  SiweServiceShape
>() {}

// Implementation
const generateSiweNonce = (): Effect<string> =>
  Effect.sync(() => {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  })

const createSiweMessage = (params: SiweMessage): Effect<string> =>
  Effect.sync(() => {
    const lines: string[] = [
      `${params.domain} wants you to sign in with your Ethereum account:`,
      params.address,
      ''
    ]
    
    if (params.statement) {
      lines.push(params.statement, '')
    }
    
    lines.push(`URI: ${params.uri}`)
    lines.push(`Version: ${params.version}`)
    lines.push(`Chain ID: ${params.chainId}`)
    lines.push(`Nonce: ${params.nonce}`)
    lines.push(`Issued At: ${new Date().toISOString()}`)
    
    if (params.expirationTime) {
      lines.push(`Expiration Time: ${params.expirationTime.toISOString()}`)
    }
    if (params.notBefore) {
      lines.push(`Not Before: ${params.notBefore.toISOString()}`)
    }
    if (params.requestId) {
      lines.push(`Request ID: ${params.requestId}`)
    }
    if (params.resources?.length) {
      lines.push('Resources:')
      params.resources.forEach(r => lines.push(`- ${r}`))
    }
    
    return lines.join('\n')
  })

const parseSiweMessage = (message: string): Effect<SiweMessage, SiweParseError> =>
  Effect.try({
    try: () => {
      const lines = message.split('\n')
      
      // Parse domain from first line
      const domainMatch = lines[0].match(/^(.+) wants you to sign in/)
      if (!domainMatch) throw new Error('Invalid SIWE message format')
      
      const address = lines[1] as Address
      
      // Parse key-value pairs
      const getValue = (key: string): string | undefined => {
        const line = lines.find(l => l.startsWith(`${key}: `))
        return line?.slice(key.length + 2)
      }
      
      return {
        domain: domainMatch[1],
        address,
        uri: getValue('URI')!,
        version: getValue('Version') as '1',
        chainId: parseInt(getValue('Chain ID')!),
        nonce: getValue('Nonce')!,
        statement: lines.find((_, i) => i > 1 && lines[i + 1] === '' && !lines[i].includes(':')),
        expirationTime: getValue('Expiration Time') ? new Date(getValue('Expiration Time')!) : undefined,
        notBefore: getValue('Not Before') ? new Date(getValue('Not Before')!) : undefined,
        requestId: getValue('Request ID')
      }
    },
    catch: (e) => new SiweParseError({ message: 'Failed to parse SIWE message', cause: e })
  })

const validateSiweMessage = (params: {
  message: SiweMessage
  address?: Address
  domain?: string
  nonce?: string
  time?: Date
}): Effect<boolean, SiweValidationError> =>
  Effect.gen(function* () {
    const { message, address, domain, nonce, time = new Date() } = params
    
    if (address && !Address.equals(message.address, address)) {
      return yield* Effect.fail(new SiweValidationError({ message: 'Address mismatch' }))
    }
    
    if (domain && message.domain !== domain) {
      return yield* Effect.fail(new SiweValidationError({ message: 'Domain mismatch' }))
    }
    
    if (nonce && message.nonce !== nonce) {
      return yield* Effect.fail(new SiweValidationError({ message: 'Nonce mismatch' }))
    }
    
    if (message.expirationTime && time > message.expirationTime) {
      return yield* Effect.fail(new SiweValidationError({ message: 'Message expired' }))
    }
    
    if (message.notBefore && time < message.notBefore) {
      return yield* Effect.fail(new SiweValidationError({ message: 'Message not yet valid' }))
    }
    
    return true
  })

const verifySiweMessage = (params: {
  message: string
  signature: Hex
}): Effect<boolean, SiweError, ProviderService> =>
  Effect.gen(function* () {
    const parsed = yield* parseSiweMessage(params.message)
    
    // Validate format and times
    yield* validateSiweMessage({ message: parsed })
    
    // Verify signature (supports EOA and EIP-1271 smart accounts)
    const valid = yield* verifyMessage({
      address: parsed.address,
      message: params.message,
      signature: params.signature
    })
    
    return valid
  })

// Layer
const SiweServiceLive = Layer.succeed(SiweService, {
  generateNonce: generateSiweNonce,
  createMessage: createSiweMessage,
  parseMessage: parseSiweMessage,
  validateMessage: validateSiweMessage,
  verifyMessage: verifySiweMessage
})
```
</effect_solution>

<implementation>
<new_files>
- src/services/Siwe/SiweService.ts
- src/services/Siwe/createSiweMessage.ts
- src/services/Siwe/parseSiweMessage.ts
- src/services/Siwe/validateSiweMessage.ts
- src/services/Siwe/verifySiweMessage.ts
- src/services/Siwe/generateSiweNonce.ts
- src/services/Siwe/errors.ts
- src/services/Siwe/index.ts
</new_files>

<phases>
1. **Phase 1 - Core SIWE** (P0)
   - createSiweMessage
   - parseSiweMessage
   - generateSiweNonce
   - validateSiweMessage
   - verifySiweMessage

2. **Phase 2 - SiweService Layer** (P1)
   - Wrap all functions in service
   - Add proper Effect types
   - Export from main package

3. **Phase 3 - ERC-7715 Permissions** (P2)
   - grantPermissions
   - Permission types and policies
   - Session key support

4. **Phase 4 - ERC-7739 Typed Signing** (P2)
   - Smart account compatible signatures

5. **Phase 5 - ERC-7821 Batch Execution** (P3)
   - Direct contract batch execution
   - Execution mode detection
</phases>
</implementation>

<tests>
```typescript
describe('SIWE', () => {
  describe('createSiweMessage', () => {
    it('creates valid SIWE message', () =>
      Effect.gen(function* () {
        const nonce = yield* generateSiweNonce()
        const message = yield* createSiweMessage({
          address: '0x1234567890123456789012345678901234567890',
          chainId: 1,
          domain: 'example.com',
          nonce,
          uri: 'https://example.com/login',
          version: '1'
        })
        
        expect(message).toContain('example.com wants you to sign in')
        expect(message).toContain('Nonce: ' + nonce)
      }))
  })
  
  describe('parseSiweMessage', () => {
    it('round-trips message correctly', () =>
      Effect.gen(function* () {
        const original: SiweMessage = {
          address: '0x1234567890123456789012345678901234567890',
          chainId: 1,
          domain: 'example.com',
          nonce: 'abc123',
          uri: 'https://example.com',
          version: '1'
        }
        
        const messageStr = yield* createSiweMessage(original)
        const parsed = yield* parseSiweMessage(messageStr)
        
        expect(parsed.address).toBe(original.address)
        expect(parsed.chainId).toBe(original.chainId)
        expect(parsed.nonce).toBe(original.nonce)
      }))
  })
  
  describe('validateSiweMessage', () => {
    it('rejects expired message', () =>
      Effect.gen(function* () {
        const message: SiweMessage = {
          address: '0x...',
          chainId: 1,
          domain: 'example.com',
          nonce: 'abc',
          uri: 'https://example.com',
          version: '1',
          expirationTime: new Date(Date.now() - 1000)
        }
        
        const result = yield* validateSiweMessage({ message }).pipe(Effect.either)
        expect(Either.isLeft(result)).toBe(true)
      }))
  })
  
  describe('verifySiweMessage', () => {
    it('verifies valid signature', () =>
      Effect.gen(function* () {
        const message = yield* createSiweMessage({
          address: signerAddress,
          chainId: 1,
          domain: 'example.com',
          nonce: 'test',
          uri: 'https://example.com',
          version: '1'
        })
        
        const signature = yield* signer.signMessage(message)
        const verified = yield* verifySiweMessage({ message, signature })
        
        expect(verified).toBe(true)
      }).pipe(Effect.provide(providerLayer)))
  })
})
```
</tests>

<references>
- https://viem.sh/docs/siwe/actions/verifySiweMessage
- https://eips.ethereum.org/EIPS/eip-4361
- https://eips.ethereum.org/EIPS/eip-7715
- https://login.xyz/ (SIWE spec)
- tevm-monorepo/packages/memory-client/src/test/viem/verifySiweMessage.spec.ts
</references>
</issue>
