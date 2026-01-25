# Unit Conversion and Formatting Gaps

<issue>
<metadata>
priority: P2
category: viem-parity
files: [src/primitives/]
reviews: []
</metadata>

<gap_analysis>
Viem has unit conversion utilities. Most exist in tevm-monorepo but need verification for parity.

<status_matrix>
| Utility | Viem | tevm-monorepo | Voltaire-effect | Priority |
|---------|------|---------------|-----------------|----------|
| parseEther | ✅ | ✅ @tevm/utils | ❌ Not exported | P1 |
| parseGwei | ✅ | ✅ @tevm/utils | ❌ Not exported | P1 |
| parseUnits | ✅ | ✅ @tevm/utils | ❌ Not exported | P1 |
| formatEther | ✅ | ✅ @tevm/utils | ❌ Not exported | P1 |
| formatGwei | ✅ | ✅ @tevm/utils | ❌ Not exported | P1 |
| formatUnits | ✅ | ✅ @tevm/utils | ❌ Not exported | P1 |
| getContractAddress (CREATE) | ✅ | ⚠️ Check | ❌ | P2 |
| getCreate2Address | ✅ | ⚠️ Check | ❌ | P2 |
| concat | ✅ | ✅ | ⚠️ Hex.concat? | P2 |
| slice | ✅ | ✅ | ⚠️ Hex.slice? | P2 |
| pad | ✅ | ✅ | ⚠️ Check | P2 |
| isHex | ✅ | ✅ | ⚠️ Hex.isHex | P2 |
| isBytes | ✅ | ✅ | ⚠️ Check | P2 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>Unit Conversion</feature>
<location>viem/src/utils/unit/</location>
<implementation>
```typescript
import {
  parseEther,
  parseGwei,
  parseUnits,
  formatEther,
  formatGwei,
  formatUnits
} from 'viem'

// Parse string to wei
parseEther('1.5')      // → 1500000000000000000n
parseGwei('20')        // → 20000000000n
parseUnits('100', 6)   // → 100000000n (e.g., USDC)

// Format wei to string
formatEther(1500000000000000000n)  // → '1.5'
formatGwei(20000000000n)           // → '20'
formatUnits(100000000n, 6)         // → '100'
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Address Utilities</feature>
<location>viem/src/utils/address/</location>
<implementation>
```typescript
import {
  getAddress,
  isAddress,
  isAddressEqual,
  getContractAddress,
  getCreate2Address
} from 'viem'

// CREATE deployment address
const address = getContractAddress({
  from: deployer,
  nonce: 5n
})

// CREATE2 deployment address
const address = getCreate2Address({
  from: factory,
  salt: '0x...',
  bytecodeHash: keccak256(bytecode)
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Data Manipulation</feature>
<location>viem/src/utils/data/</location>
<implementation>
```typescript
import {
  concat,
  slice,
  pad,
  trim,
  size,
  isHex,
  isBytes
} from 'viem'

// Concatenate hex/bytes
concat(['0x1234', '0x5678'])  // → '0x12345678'

// Slice hex/bytes
slice('0x12345678', 1, 3)    // → '0x3456'

// Pad left/right
pad('0x1234', { size: 32 })  // → '0x00...1234'

// Trim leading zeros
trim('0x00001234')           // → '0x1234'

// Get byte size
size('0x1234')               // → 2

// Type guards
isHex('0x1234')              // → true
isBytes(new Uint8Array([1])) // → true
```
</implementation>
</viem_reference>

<viem_reference>
<feature>tevm-monorepo Usage</feature>
<location>tevm-monorepo/packages/utils/src/index.ts</location>
<implementation>
```typescript
// Already re-exported from @tevm/utils:
import { parseEther, formatEther, ... } from '@tevm/utils'

// Usage in tests:
import { parseEther } from '@tevm/utils'
const value = parseEther('1')
balance: parseEther('10'),
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// Re-export from @tevm/utils with Effect wrappers where appropriate

// Pure utilities - no Effect needed
export { 
  parseEther, 
  parseGwei, 
  parseUnits,
  formatEther,
  formatGwei,
  formatUnits 
} from '@tevm/utils'

// Address utilities - may need Effect for validation
import { getContractAddress as _getContractAddress } from '@tevm/utils'

const getContractAddress = (params: { 
  from: Address
  nonce: bigint 
}): Address =>
  _getContractAddress(params)

const getCreate2Address = (params: {
  from: Address
  salt: Hex
  bytecodeHash: Hash
}): Address => {
  // CREATE2: keccak256(0xff ++ from ++ salt ++ keccak256(bytecode))[12:]
  const data = Hex.concat([
    '0xff',
    Hex.fromAddress(params.from),
    params.salt,
    params.bytecodeHash
  ])
  const hash = Keccak256.hash(Hex.toBytes(data))
  return Address.fromBytes(hash.slice(12))
}

// Data manipulation - already in primitives
export * as Hex from './primitives/Hex/index.js'
export * as Bytes from './primitives/Bytes/index.js'

// Convenience re-exports
export const concat = Hex.concat
export const slice = Hex.slice
export const pad = Hex.padLeft
export const isHex = Hex.isHex
export const isBytes = (value: unknown): value is Uint8Array =>
  value instanceof Uint8Array
```
</effect_solution>

<implementation>
<new_files>
- src/utils/units.ts (re-exports from @tevm/utils)
- src/utils/address.ts (getContractAddress, getCreate2Address)
- src/utils/data.ts (concat, slice, pad, trim)
- src/utils/index.ts
</new_files>

<phases>
1. **Phase 1 - Re-export Unit Conversions** (P1)
   - parseEther, formatEther
   - parseGwei, formatGwei
   - parseUnits, formatUnits

2. **Phase 2 - Verify Hex/Bytes Utilities** (P2)
   - Confirm concat, slice, pad exist
   - Add if missing
   - Export convenience aliases

3. **Phase 3 - Address Utilities** (P2)
   - getContractAddress (CREATE)
   - getCreate2Address

4. **Phase 4 - Error Improvements** (P2)
   - Add ContractRevertError with decoded reason
   - Add ContractCustomError with decoded custom error
   - Add error.walk() for traversal
</phases>
</implementation>

<tests>
```typescript
describe('parseEther', () => {
  it('converts ETH string to wei', () => {
    expect(parseEther('1')).toBe(1000000000000000000n)
    expect(parseEther('1.5')).toBe(1500000000000000000n)
    expect(parseEther('0.000000000000000001')).toBe(1n)
  })
})

describe('formatEther', () => {
  it('converts wei to ETH string', () => {
    expect(formatEther(1000000000000000000n)).toBe('1')
    expect(formatEther(1500000000000000000n)).toBe('1.5')
  })
})

describe('parseUnits', () => {
  it('handles different decimals', () => {
    expect(parseUnits('100', 6)).toBe(100000000n)
    expect(parseUnits('100', 18)).toBe(100000000000000000000n)
  })
})

describe('getContractAddress', () => {
  it('computes CREATE address', () => {
    const address = getContractAddress({
      from: '0x0000000000000000000000000000000000000001',
      nonce: 0n
    })
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })
})

describe('getCreate2Address', () => {
  it('computes CREATE2 address', () => {
    const address = getCreate2Address({
      from: '0x0000000000000000000000000000000000000001',
      salt: '0x' + '00'.repeat(32),
      bytecodeHash: '0x' + 'ab'.repeat(32)
    })
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })
})
```
</tests>

<error_improvements>
```typescript
// Enhanced error types matching viem patterns

interface BaseError {
  readonly name: string
  readonly message: string
  readonly shortMessage: string
  readonly details?: string
  readonly metaMessages?: readonly string[]
  readonly cause?: Error
  
  walk: (fn?: (err: Error) => boolean) => Error | undefined
}

class ContractRevertError extends AbstractError implements BaseError {
  readonly name = 'ContractRevertError'
  readonly reason?: string
  readonly data?: Hex
  
  constructor(params: {
    message: string
    reason?: string
    data?: Hex
  }) {
    super(params.message)
    this.reason = params.reason
    this.data = params.data
  }
  
  get shortMessage() {
    return this.reason 
      ? `Contract reverted: ${this.reason}`
      : 'Contract reverted without reason'
  }
}

class ContractCustomError extends AbstractError implements BaseError {
  readonly name = 'ContractCustomError'
  readonly errorName: string
  readonly args: readonly unknown[]
  readonly signature: Hex
  
  constructor(params: {
    errorName: string
    args: readonly unknown[]
    signature: Hex
    abi?: Abi
  }) {
    super(`Contract threw custom error: ${params.errorName}`)
    this.errorName = params.errorName
    this.args = params.args
    this.signature = params.signature
  }
}

// Error walking
const walkError = (error: Error, fn?: (err: Error) => boolean): Error | undefined => {
  if (fn?.(error)) return error
  if ('cause' in error && error.cause instanceof Error) {
    return walkError(error.cause, fn)
  }
  return undefined
}
```
</error_improvements>

<references>
- https://viem.sh/docs/utilities/parseEther
- https://viem.sh/docs/utilities/formatEther
- https://viem.sh/docs/utilities/getContractAddress
- tevm-monorepo/packages/utils/src/index.ts
</references>
</issue>
