import { describe, it, expect } from 'vitest'
import * as StateProof from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import { Address, Keccak256, Wei, Hash, Nonce, StateRoot, StorageProof, StorageValue } from '@tevm/voltaire'

describe('StateProof', () => {
  const createStateProofData = () => {
    const address = Address.fromHex('0x1234567890123456789012345678901234567890')
    const accountProof = [new Uint8Array(64).fill(0x01)]
    const balance = Wei.from(100n)
    const codeHash = Hash.keccak256(new Uint8Array([]))
    const nonce = Nonce.from(1n)
    const storageHash = StateRoot.fromHex(Hash.toHex(Hash.keccak256(new Uint8Array([0]))))
    const storageProof: StorageProof.StorageProofType[] = []
    
    return { address, accountProof, balance, codeHash, nonce, storageHash, storageProof }
  }

  describe('Schema', () => {
    it('validates a valid StateProof', async () => {
      const data = createStateProofData()
      const proof = await Effect.runPromise(StateProof.from(data))
      const result = Schema.decodeSync(StateProof.Schema)(proof)
      expect(result.address).toEqual(data.address)
      expect(result.balance).toBe(data.balance)
    })

    it('rejects invalid objects', () => {
      expect(() => Schema.decodeSync(StateProof.Schema)({} as unknown as StateProof.StateProofType)).toThrow()
    })

    it('rejects object missing required fields', () => {
      const partial = { address: new Uint8Array(20) }
      expect(() => Schema.decodeSync(StateProof.Schema)(partial as unknown as StateProof.StateProofType)).toThrow()
    })
  })

  describe('from', () => {
    it('creates StateProof from valid data', async () => {
      const data = createStateProofData()
      const proof = await Effect.runPromise(StateProof.from(data))
      expect(proof.address).toEqual(data.address)
      expect(proof.balance).toBe(data.balance)
      expect(proof.nonce).toBe(data.nonce)
      expect(proof.codeHash).toEqual(data.codeHash)
      expect(proof.storageHash).toEqual(data.storageHash)
      expect(proof.accountProof.length).toBe(1)
      expect(proof.storageProof.length).toBe(0)
    })

    it('creates StateProof with storage proofs', async () => {
      const data = createStateProofData()
      const storageProofData = StorageProof.from({
        key: { 
          address: Address.fromHex('0x1234567890123456789012345678901234567890'),
          slot: 0n
        },
        value: StorageValue.from(2n),
        proof: [new Uint8Array(64).fill(0x03)]
      })
      data.storageProof = [storageProofData]
      const proof = await Effect.runPromise(StateProof.from(data))
      expect(proof.storageProof.length).toBe(1)
    })

    it('handles zero balance', async () => {
      const data = createStateProofData()
      data.balance = Wei.from(0n)
      const proof = await Effect.runPromise(StateProof.from(data))
      expect(proof.balance).toBe(data.balance)
    })

    it('handles large balance', async () => {
      const data = createStateProofData()
      data.balance = Wei.from(2n ** 128n - 1n)
      const proof = await Effect.runPromise(StateProof.from(data))
      expect(proof.balance).toBe(data.balance)
    })
  })

  describe('equals', () => {
    it('returns true for equal StateProofs', async () => {
      const data = createStateProofData()
      const proof1 = await Effect.runPromise(StateProof.from(data))
      const proof2 = await Effect.runPromise(StateProof.from(data))
      const result = await Effect.runPromise(StateProof.equals(proof1, proof2))
      expect(result).toBe(true)
    })

    it('returns false for different addresses', async () => {
      const data1 = createStateProofData()
      const data2 = { ...data1, address: Address.fromHex('0xabcdef0123456789abcdef0123456789abcdef01') }
      const proof1 = await Effect.runPromise(StateProof.from(data1))
      const proof2 = await Effect.runPromise(StateProof.from(data2))
      const result = await Effect.runPromise(StateProof.equals(proof1, proof2))
      expect(result).toBe(false)
    })

    it('returns false for different balances', async () => {
      const data1 = createStateProofData()
      const data2 = { ...data1, balance: Wei.from(200n) }
      const proof1 = await Effect.runPromise(StateProof.from(data1))
      const proof2 = await Effect.runPromise(StateProof.from(data2))
      const result = await Effect.runPromise(StateProof.equals(proof1, proof2))
      expect(result).toBe(false)
    })

    it('returns false for different nonces', async () => {
      const data1 = createStateProofData()
      const data2 = { ...data1, nonce: Nonce.from(5n) }
      const proof1 = await Effect.runPromise(StateProof.from(data1))
      const proof2 = await Effect.runPromise(StateProof.from(data2))
      const result = await Effect.runPromise(StateProof.equals(proof1, proof2))
      expect(result).toBe(false)
    })
  })
})
