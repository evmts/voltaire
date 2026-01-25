import { describe, it, expect } from 'vitest'
import * as Proof from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import { Keccak256 } from '@tevm/voltaire'

describe('Proof', () => {
  const createProofData = () => {
    const value = Keccak256.hash(new Uint8Array([1, 2, 3]))
    const proof = [
      Keccak256.hash(new Uint8Array([4, 5, 6])),
      Keccak256.hash(new Uint8Array([7, 8, 9])),
    ]
    return { value, proof }
  }

  describe('Schema', () => {
    it('validates a valid Proof', async () => {
      const data = createProofData()
      const proof = await Effect.runPromise(Proof.from(data))
      const result = Schema.decodeSync(Proof.Schema)(proof)
      expect(result.value).toEqual(data.value)
      expect(result.proof.length).toBe(2)
    })

    it('rejects invalid objects', () => {
      expect(() => Schema.decodeSync(Proof.Schema)({} as any)).toThrow()
    })

    it('rejects object without proof array', () => {
      expect(() => Schema.decodeSync(Proof.Schema)({ value: new Uint8Array(32) } as any)).toThrow()
    })
  })

  describe('from', () => {
    it('creates proof from valid data', async () => {
      const data = createProofData()
      const proof = await Effect.runPromise(Proof.from(data))
      expect(proof.value).toEqual(data.value)
      expect(proof.proof).toEqual(data.proof)
    })

    it('creates proof with empty proof array', async () => {
      const value = new Uint8Array(32).fill(0x42)
      const proof = await Effect.runPromise(Proof.from({ value, proof: [] }))
      expect(proof.proof.length).toBe(0)
    })
  })

  describe('equals', () => {
    it('returns true for equal proofs', async () => {
      const data = createProofData()
      const proof1 = await Effect.runPromise(Proof.from(data))
      const proof2 = await Effect.runPromise(Proof.from(data))
      const result = await Effect.runPromise(Proof.equals(proof1, proof2))
      expect(result).toBe(true)
    })

    it('returns false for different values', async () => {
      const data1 = createProofData()
      const data2 = { ...data1, value: new Uint8Array(32).fill(0xff) }
      const proof1 = await Effect.runPromise(Proof.from(data1))
      const proof2 = await Effect.runPromise(Proof.from(data2))
      const result = await Effect.runPromise(Proof.equals(proof1, proof2))
      expect(result).toBe(false)
    })

    it('returns false for different proof arrays', async () => {
      const data1 = createProofData()
      const data2 = { ...data1, proof: [new Uint8Array(32).fill(0xaa)] }
      const proof1 = await Effect.runPromise(Proof.from(data1))
      const proof2 = await Effect.runPromise(Proof.from(data2))
      const result = await Effect.runPromise(Proof.equals(proof1, proof2))
      expect(result).toBe(false)
    })
  })

  describe('verify', () => {
    it('returns validation result for proof', async () => {
      const data = createProofData()
      const proof = await Effect.runPromise(Proof.from(data))
      const result = await Effect.runPromise(Proof.verify(proof))
      expect(result).toHaveProperty('valid')
      expect(typeof result.valid).toBe('boolean')
    })

    it('returns valid true for well-formed proof', async () => {
      const value = new Uint8Array(32).fill(0x01)
      const proof = [new Uint8Array(32).fill(0x02), new Uint8Array(32).fill(0x03)]
      const proofObj = await Effect.runPromise(Proof.from({ value, proof }))
      const result = await Effect.runPromise(Proof.verify(proofObj))
      expect(result.valid).toBe(true)
    })
  })
})
