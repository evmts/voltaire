import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { KZGService, KZGTest, blobToKzgCommitment, computeBlobKzgProof, verifyBlobKzgProof } from './index.js'
import type { KzgBlobType, KzgCommitmentType, KzgProofType } from '@tevm/voltaire'

describe('KZGService', () => {
  describe('KZGTest', () => {
    it('blobToKzgCommitment returns 48-byte commitment', async () => {
      const program = Effect.gen(function* () {
        const kzg = yield* KZGService
        return yield* kzg.blobToKzgCommitment(new Uint8Array(131072) as KzgBlobType)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(KZGTest))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(48)
    })

    it('computeBlobKzgProof returns 48-byte proof', async () => {
      const program = Effect.gen(function* () {
        const kzg = yield* KZGService
        const blob = new Uint8Array(131072) as KzgBlobType
        const commitment = new Uint8Array(48) as KzgCommitmentType
        return yield* kzg.computeBlobKzgProof(blob, commitment)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(KZGTest))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(48)
    })

    it('verifyBlobKzgProof returns boolean', async () => {
      const program = Effect.gen(function* () {
        const kzg = yield* KZGService
        const blob = new Uint8Array(131072) as KzgBlobType
        const commitment = new Uint8Array(48) as KzgCommitmentType
        const proof = new Uint8Array(48) as KzgProofType
        return yield* kzg.verifyBlobKzgProof(blob, commitment, proof)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(KZGTest))
      )

      expect(result).toBe(true)
    })

    it('isInitialized returns true', async () => {
      const program = Effect.gen(function* () {
        const kzg = yield* KZGService
        return yield* kzg.isInitialized()
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(KZGTest))
      )

      expect(result).toBe(true)
    })
  })
})

describe('blobToKzgCommitment', () => {
  it('commits blob with KZGService dependency', async () => {
    const blob = new Uint8Array(131072) as KzgBlobType
    const result = await Effect.runPromise(
      blobToKzgCommitment(blob).pipe(Effect.provide(KZGTest))
    )

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(48)
  })
})

describe('computeBlobKzgProof', () => {
  it('computes proof with KZGService dependency', async () => {
    const blob = new Uint8Array(131072) as KzgBlobType
    const commitment = new Uint8Array(48) as KzgCommitmentType
    const result = await Effect.runPromise(
      computeBlobKzgProof(blob, commitment).pipe(Effect.provide(KZGTest))
    )

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(48)
  })
})

describe('verifyBlobKzgProof', () => {
  it('verifies proof with KZGService dependency', async () => {
    const blob = new Uint8Array(131072) as KzgBlobType
    const commitment = new Uint8Array(48) as KzgCommitmentType
    const proof = new Uint8Array(48) as KzgProofType
    const result = await Effect.runPromise(
      verifyBlobKzgProof(blob, commitment, proof).pipe(Effect.provide(KZGTest))
    )

    expect(result).toBe(true)
  })
})
