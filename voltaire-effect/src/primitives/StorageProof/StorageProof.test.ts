import { describe, it, expect } from 'vitest'
import * as StorageProof from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import { Address } from '@tevm/voltaire'

describe('StorageProof', () => {
  const createStorageProofData = () => {
    const address = Address.fromHex('0x1234567890123456789012345678901234567890')
    const key = { address, slot: 1n }
    const value = new Uint8Array(32).fill(0x02) as any
    const proof = [new Uint8Array(64).fill(0x03), new Uint8Array(64).fill(0x04)]
    return { key, value, proof }
  }

  describe('Schema', () => {
    it('validates a valid StorageProof', async () => {
      const data = createStorageProofData()
      const proof = await Effect.runPromise(StorageProof.from(data as any))
      const result = Schema.decodeSync(StorageProof.Schema)(proof)
      expect(result.key).toEqual(data.key)
      expect(result.value).toEqual(data.value)
    })

    it('rejects invalid objects', () => {
      expect(() => Schema.decodeSync(StorageProof.Schema)({} as any)).toThrow()
    })

    it('rejects object missing proof array', () => {
      const partial = { key: new Uint8Array(32), value: new Uint8Array(32) }
      expect(() => Schema.decodeSync(StorageProof.Schema)(partial as any)).toThrow()
    })
  })

  describe('from', () => {
    it('creates StorageProof from valid data', async () => {
      const data = createStorageProofData()
      const proof = await Effect.runPromise(StorageProof.from(data as any))
      expect(proof.key).toEqual(data.key)
      expect(proof.value).toEqual(data.value)
      expect(proof.proof.length).toBe(2)
    })

    it('creates StorageProof with empty proof', async () => {
      const data = { ...createStorageProofData(), proof: [] }
      const proof = await Effect.runPromise(StorageProof.from(data as any))
      expect(proof.proof.length).toBe(0)
    })

    it('handles zero value', async () => {
      const data = createStorageProofData()
      data.value = new Uint8Array(32).fill(0) as any
      const proof = await Effect.runPromise(StorageProof.from(data as any))
      expect(proof.value).toEqual(new Uint8Array(32).fill(0))
    })

    it('handles max value', async () => {
      const data = createStorageProofData()
      data.value = new Uint8Array(32).fill(0xff) as any
      const proof = await Effect.runPromise(StorageProof.from(data as any))
      expect(proof.value).toEqual(new Uint8Array(32).fill(0xff))
    })
  })

  describe('equals', () => {
    it('returns true for equal StorageProofs', async () => {
      const data = createStorageProofData()
      const proof1 = await Effect.runPromise(StorageProof.from(data as any))
      const proof2 = await Effect.runPromise(StorageProof.from(data as any))
      const result = await Effect.runPromise(StorageProof.equals(proof1, proof2))
      expect(result).toBe(true)
    })

    it('returns false for different keys', async () => {
      const data1 = createStorageProofData()
      const address2 = Address.fromHex('0xabcdef0123456789abcdef0123456789abcdef01')
      const data2 = { ...data1, key: { address: address2, slot: 2n } }
      const proof1 = await Effect.runPromise(StorageProof.from(data1 as any))
      const proof2 = await Effect.runPromise(StorageProof.from(data2 as any))
      const result = await Effect.runPromise(StorageProof.equals(proof1, proof2))
      expect(result).toBe(false)
    })

    it('returns false for different values', async () => {
      const data1 = createStorageProofData()
      const data2 = { ...data1, value: new Uint8Array(32).fill(0xaa) as any }
      const proof1 = await Effect.runPromise(StorageProof.from(data1 as any))
      const proof2 = await Effect.runPromise(StorageProof.from(data2 as any))
      const result = await Effect.runPromise(StorageProof.equals(proof1, proof2))
      expect(result).toBe(false)
    })

    it('returns false for different proof arrays', async () => {
      const data1 = createStorageProofData()
      const data2 = { ...data1, proof: [new Uint8Array(64).fill(0xbb)] }
      const proof1 = await Effect.runPromise(StorageProof.from(data1 as any))
      const proof2 = await Effect.runPromise(StorageProof.from(data2 as any))
      const result = await Effect.runPromise(StorageProof.equals(proof1, proof2))
      expect(result).toBe(false)
    })
  })
})
