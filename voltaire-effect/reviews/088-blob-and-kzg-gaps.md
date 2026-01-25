# Blob and KZG Gaps (EIP-4844)

<issue>
<metadata>
priority: P1
category: viem-parity
files: [src/services/Provider/, src/services/Signer/, src/crypto/Kzg/]
reviews: [104-blob-kzg-primitives-review]
</metadata>

<gap_analysis>
EIP-4844 (Proto-Danksharding) is live on mainnet. Viem has comprehensive blob utilities that voltaire-effect lacks.

<status_matrix>
| Feature | Viem | Voltaire | Priority |
|---------|------|----------|----------|
| toBlobs (data → blobs) | ✅ | ❌ | P1 |
| fromBlobs (blobs → data) | ✅ | ❌ | P1 |
| toBlobSidecars | ✅ | ❌ | P0 |
| blobsToCommitments | ✅ | ❌ | P0 |
| blobsToProofs | ✅ | ❌ | P0 |
| commitmentsToVersionedHashes | ✅ | ❌ | P0 |
| getBlobBaseFee | ✅ | ❌ | P0 |
| blobs in TransactionRequest | ✅ | ⚠️ blobVersionedHashes only | P0 |
| sidecars in TransactionRequest | ✅ | ❌ | P0 |
| blobGasUsed in receipts | ✅ | ⚠️ Parse needed | P1 |
| blobGasPrice in receipts | ✅ | ⚠️ Parse needed | P1 |
| Auto-fill blob fields | ✅ | ❌ | P1 |
| Chain-level KZG config | ✅ | ❌ | P2 |
</status_matrix>
</gap_analysis>

<viem_reference>
<feature>Blob Conversion Utilities</feature>
<location>viem/src/utils/blob/toBlobs.ts</location>
<implementation>
```typescript
import { toBlobs, toBlobSidecars } from 'viem'
import * as kzg from 'c-kzg'

// Convert data to blobs (max 128KB each, max 6 blobs per tx)
const blobs = toBlobs({ data: '0x...' })

// Create sidecars with commitments and proofs
const sidecars = toBlobSidecars({
  blobs,
  kzg
})
// Returns: { blobs, commitments, proofs }
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Blob Transaction Sending</feature>
<location>viem/src/actions/wallet/sendTransaction.ts</location>
<implementation>
```typescript
// Send blob transaction
await client.sendTransaction({
  to: '0x...',
  blobs,        // Raw blob data
  kzg,          // KZG instance for commitment/proof generation
  maxFeePerBlobGas: 1000000000n
})

// Or with pre-computed sidecars
await client.sendTransaction({
  to: '0x...',
  sidecars,     // { blobs, commitments, proofs }
  blobVersionedHashes,  // Pre-computed if different from sidecars
  maxFeePerBlobGas: 1000000000n
})
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Blob Base Fee</feature>
<location>viem/src/actions/public/getBlobBaseFee.ts</location>
<implementation>
```typescript
const blobBaseFee = await client.getBlobBaseFee()
// Returns: bigint (current blob base fee in wei)
```
</implementation>
</viem_reference>

<viem_reference>
<feature>prepareTransactionRequest Auto-fill</feature>
<location>viem/src/actions/wallet/prepareTransactionRequest.ts</location>
<implementation>
```typescript
// viem prepareTransactionRequest automatically:
const request = await client.prepareTransactionRequest({
  to: '0x...',
  blobs,
  kzg,
  parameters: ['blobVersionedHashes', 'sidecars']
})

// Generates:
// - blobVersionedHashes from blobs + kzg
// - sidecars (blobs + commitments + proofs)
```
</implementation>
</viem_reference>

<effect_solution>
```typescript
// Blob types
type Blob = Uint8Array & { readonly __tag: 'Blob' }  // 128KB
type BlobCommitment = Uint8Array & { readonly __tag: 'BlobCommitment' }  // 48 bytes
type BlobProof = Uint8Array & { readonly __tag: 'BlobProof' }  // 48 bytes
type VersionedHash = Uint8Array & { readonly __tag: 'VersionedHash' }  // 32 bytes

interface BlobSidecar {
  readonly blob: Blob
  readonly commitment: BlobCommitment
  readonly proof: BlobProof
}

// KZG Service integration
interface KzgServiceShape {
  readonly blobToCommitment: (blob: Blob) => Effect<BlobCommitment, KzgError>
  readonly computeBlobProof: (blob: Blob, commitment: BlobCommitment) => Effect<BlobProof, KzgError>
  readonly verifyBlobProof: (blob: Blob, commitment: BlobCommitment, proof: BlobProof) => Effect<boolean, KzgError>
}

// Blob utilities
const BLOB_SIZE = 131072  // 128KB
const MAX_BLOBS_PER_TX = 6

const toBlobs = (data: Hex): Effect<readonly Blob[], BlobError> =>
  Effect.gen(function* () {
    const bytes = Hex.toBytes(data)
    const blobCount = Math.ceil(bytes.length / BLOB_SIZE)
    
    if (blobCount > MAX_BLOBS_PER_TX) {
      return yield* Effect.fail(new BlobError({
        message: `Data requires ${blobCount} blobs, max is ${MAX_BLOBS_PER_TX}`
      }))
    }
    
    const blobs: Blob[] = []
    for (let i = 0; i < blobCount; i++) {
      const start = i * BLOB_SIZE
      const end = Math.min(start + BLOB_SIZE, bytes.length)
      const blob = new Uint8Array(BLOB_SIZE)
      blob.set(bytes.slice(start, end))
      blobs.push(blob as Blob)
    }
    return blobs
  })

const fromBlobs = (blobs: readonly Blob[], originalLength: number): Hex =>
  Hex.fromBytes(
    Uint8Array.from(blobs.flatMap(b => [...b])).slice(0, originalLength)
  )

const toBlobSidecars = (blobs: readonly Blob[]): 
  Effect<readonly BlobSidecar[], KzgError, KzgService> =>
  Effect.gen(function* () {
    const kzg = yield* KzgService
    
    const sidecars: BlobSidecar[] = []
    for (const blob of blobs) {
      const commitment = yield* kzg.blobToCommitment(blob)
      const proof = yield* kzg.computeBlobProof(blob, commitment)
      sidecars.push({ blob, commitment, proof })
    }
    return sidecars
  })

const blobsToCommitments = (blobs: readonly Blob[]): 
  Effect<readonly BlobCommitment[], KzgError, KzgService> =>
  Effect.gen(function* () {
    const kzg = yield* KzgService
    return yield* Effect.all(blobs.map(b => kzg.blobToCommitment(b)))
  })

const commitmentToVersionedHash = (commitment: BlobCommitment): VersionedHash => {
  const hash = Keccak256.hash(commitment)
  // Version 0x01 prefix for EIP-4844
  const versioned = new Uint8Array(32)
  versioned[0] = 0x01
  versioned.set(hash.slice(1), 1)
  return versioned as VersionedHash
}

const commitmentsToVersionedHashes = (commitments: readonly BlobCommitment[]): 
  readonly VersionedHash[] =>
  commitments.map(commitmentToVersionedHash)

const sidecarsToVersionedHashes = (sidecars: readonly BlobSidecar[]): 
  readonly VersionedHash[] =>
  sidecars.map(s => commitmentToVersionedHash(s.commitment))

// Provider extension
const getBlobBaseFee = (): Effect<bigint, ProviderError, ProviderService> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService
    const result = yield* provider.request({ method: 'eth_blobBaseFee' })
    return BigInt(result)
  })

// Extended TransactionRequest
interface BlobTransactionRequest extends TransactionRequest {
  readonly blobs?: readonly Blob[]
  readonly sidecars?: readonly BlobSidecar[]
  readonly blobVersionedHashes?: readonly VersionedHash[]
  readonly maxFeePerBlobGas?: bigint
}

// Auto-fill blob fields in Signer
const prepareTransaction = (tx: BlobTransactionRequest): 
  Effect<PreparedTransaction, SignerError, KzgService | ProviderService> =>
  Effect.gen(function* () {
    if (tx.blobs && !tx.sidecars) {
      const sidecars = yield* toBlobSidecars(tx.blobs)
      const blobVersionedHashes = sidecarsToVersionedHashes(sidecars)
      return { ...tx, sidecars, blobVersionedHashes }
    }
    return tx
  })
```
</effect_solution>

<implementation>
<new_files>
- src/primitives/Blob/BlobType.ts
- src/primitives/Blob/toBlobs.ts
- src/primitives/Blob/fromBlobs.ts
- src/primitives/Blob/toBlobSidecars.ts
- src/primitives/Blob/blobsToCommitments.ts
- src/primitives/Blob/commitmentsToVersionedHashes.ts
- src/services/Provider/getBlobBaseFee.ts
- src/services/Signer/prepareBlobTransaction.ts
</new_files>

<phases>
1. **Phase 1 - getBlobBaseFee** (P0)
   - Add to ProviderService
   - Essential for blob tx cost estimation

2. **Phase 2 - Blob Types** (P0)
   - Add Blob, BlobCommitment, BlobProof, VersionedHash types
   - Add BlobSidecar interface

3. **Phase 3 - Blob Utilities** (P0)
   - toBlobs, fromBlobs
   - toBlobSidecars (integrate with existing KzgService)
   - commitmentsToVersionedHashes

4. **Phase 4 - TransactionRequest Extension** (P0)
   - Add blobs, sidecars fields
   - Parse blobGasUsed, blobGasPrice in receipts

5. **Phase 5 - Auto-fill in Signer** (P1)
   - Auto-compute sidecars from blobs
   - Auto-compute versioned hashes

6. **Phase 6 - Chain-level KZG** (P2)
   - Allow chain config to override KZG implementation
</phases>
</implementation>

<tests>
```typescript
describe('toBlobs', () => {
  it('converts data to single blob', () =>
    Effect.gen(function* () {
      const data = '0x' + 'ab'.repeat(1000)
      const blobs = yield* toBlobs(data)
      expect(blobs).toHaveLength(1)
      expect(blobs[0].length).toBe(131072)
    }))
  
  it('splits large data into multiple blobs', () =>
    Effect.gen(function* () {
      const data = '0x' + 'ab'.repeat(200000)
      const blobs = yield* toBlobs(data)
      expect(blobs.length).toBeGreaterThan(1)
    }))
  
  it('rejects data requiring > 6 blobs', () =>
    Effect.gen(function* () {
      const data = '0x' + 'ab'.repeat(500000)
      const result = yield* toBlobs(data).pipe(Effect.either)
      expect(Either.isLeft(result)).toBe(true)
    }))
})

describe('toBlobSidecars', () => {
  it('creates sidecars with commitments and proofs', () =>
    Effect.gen(function* () {
      const blobs = yield* toBlobs('0x' + 'ab'.repeat(1000))
      const sidecars = yield* toBlobSidecars(blobs)
      
      expect(sidecars[0].commitment.length).toBe(48)
      expect(sidecars[0].proof.length).toBe(48)
    }).pipe(Effect.provide(kzgLayer)))
})

describe('getBlobBaseFee', () => {
  it('returns current blob base fee', () =>
    Effect.gen(function* () {
      const fee = yield* getBlobBaseFee()
      expect(fee).toBeTypeOf('bigint')
      expect(fee).toBeGreaterThan(0n)
    }).pipe(Effect.provide(mainnetProviderLayer)))
})

describe('commitmentToVersionedHash', () => {
  it('creates version 0x01 hash', () => {
    const commitment = new Uint8Array(48).fill(0xab) as BlobCommitment
    const hash = commitmentToVersionedHash(commitment)
    expect(hash[0]).toBe(0x01)
    expect(hash.length).toBe(32)
  })
})
```
</tests>

<references>
- https://viem.sh/docs/utilities/toBlobs
- https://viem.sh/docs/actions/public/getBlobBaseFee
- https://eips.ethereum.org/EIPS/eip-4844
- https://github.com/ethereum/c-kzg-4844
</references>
</issue>
