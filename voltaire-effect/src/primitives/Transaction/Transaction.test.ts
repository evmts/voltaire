import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as Transaction from './index.js'

type SchemaInput<S> = S extends Schema.Schema<infer _A, infer I> ? I : never

describe('Transaction', () => {
  describe('LegacySchema', () => {
    it('decodes a valid legacy transaction', () => {
      const input = {
        type: Transaction.Type.Legacy,
        nonce: 0n,
        gasPrice: 20000000000n,
        gasLimit: 21000n,
        to: '0x1234567890123456789012345678901234567890',
        value: 1000000000000000000n,
        data: new Uint8Array(),
        v: 27n,
        r: new Uint8Array(32),
        s: new Uint8Array(32),
      }
      const result = Schema.decodeSync(Transaction.LegacySchema)(input as unknown as SchemaInput<typeof Transaction.LegacySchema>)
      expect(result.type).toBe(Transaction.Type.Legacy)
      expect(result.nonce).toBe(0n)
      expect(result.gasPrice).toBe(20000000000n)
    })

    it('decodes legacy tx with null to (contract creation)', () => {
      const input = {
        type: Transaction.Type.Legacy,
        nonce: 1n,
        gasPrice: 20000000000n,
        gasLimit: 100000n,
        to: null,
        value: 0n,
        data: new Uint8Array([0x60, 0x80]),
        v: 28n,
        r: new Uint8Array(32).fill(1),
        s: new Uint8Array(32).fill(2),
      }
      const result = Schema.decodeSync(Transaction.LegacySchema)(input as unknown as SchemaInput<typeof Transaction.LegacySchema>)
      expect(result.to).toBeNull()
    })
  })

  describe('EIP1559Schema', () => {
    it('decodes a valid EIP-1559 transaction', () => {
      const input = {
        type: Transaction.Type.EIP1559,
        chainId: 1n,
        nonce: 0n,
        maxPriorityFeePerGas: 1000000000n,
        maxFeePerGas: 100000000000n,
        gasLimit: 21000n,
        to: '0x1234567890123456789012345678901234567890',
        value: 0n,
        data: new Uint8Array(),
        accessList: [],
        yParity: 0,
        r: new Uint8Array(32),
        s: new Uint8Array(32),
      }
      const result = Schema.decodeSync(Transaction.EIP1559Schema)(input as unknown as SchemaInput<typeof Transaction.EIP1559Schema>)
      expect(result.type).toBe(Transaction.Type.EIP1559)
      expect(result.chainId).toBe(1n)
      expect(result.maxFeePerGas).toBe(100000000000n)
    })
  })

  describe('Schema (union)', () => {
    it('decodes legacy transaction through union', () => {
      const input = {
        type: Transaction.Type.Legacy,
        nonce: 0n,
        gasPrice: 20000000000n,
        gasLimit: 21000n,
        to: '0x1234567890123456789012345678901234567890',
        value: 0n,
        data: new Uint8Array(),
        v: 27n,
        r: new Uint8Array(32),
        s: new Uint8Array(32),
      }
      const result = Schema.decodeSync(Transaction.Schema)(input as unknown as SchemaInput<typeof Transaction.Schema>)
      expect(result.type).toBe(Transaction.Type.Legacy)
    })

    it('decodes EIP-1559 transaction through union', () => {
      const input = {
        type: Transaction.Type.EIP1559,
        chainId: 1n,
        nonce: 0n,
        maxPriorityFeePerGas: 1000000000n,
        maxFeePerGas: 100000000000n,
        gasLimit: 21000n,
        to: '0x1234567890123456789012345678901234567890',
        value: 0n,
        data: new Uint8Array(),
        accessList: [],
        yParity: 0,
        r: new Uint8Array(32),
        s: new Uint8Array(32),
      }
      const result = Schema.decodeSync(Transaction.Schema)(input as unknown as SchemaInput<typeof Transaction.Schema>)
      expect(result.type).toBe(Transaction.Type.EIP1559)
    })
  })

  describe('serialize', () => {
    it('serializes a legacy transaction to bytes', async () => {
      const tx = {
        type: Transaction.Type.Legacy,
        nonce: 0n,
        gasPrice: 20000000000n,
        gasLimit: 21000n,
        to: null,
        value: 0n,
        data: new Uint8Array(),
        v: 27n,
        r: new Uint8Array(32),
        s: new Uint8Array(32),
      } as Transaction.Any
      const result = await Effect.runPromise(Transaction.serialize(tx))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('signingHash', () => {
    it('computes signing hash for legacy transaction', async () => {
      const tx = {
        type: Transaction.Type.Legacy,
        nonce: 0n,
        gasPrice: 20000000000n,
        gasLimit: 21000n,
        to: null,
        value: 0n,
        data: new Uint8Array(),
        v: 27n,
        r: new Uint8Array(32),
        s: new Uint8Array(32),
      } as Transaction.Any
      const result = await Effect.runPromise(Transaction.signingHash(tx))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })
  })

  describe('parse', () => {
    it('parses serialized transaction back to object', async () => {
      const tx = {
        type: Transaction.Type.Legacy,
        nonce: 0n,
        gasPrice: 20000000000n,
        gasLimit: 21000n,
        to: null,
        value: 0n,
        data: new Uint8Array(),
        v: 27n,
        r: new Uint8Array(32),
        s: new Uint8Array(32),
      } as Transaction.Any
      const serialized = await Effect.runPromise(Transaction.serialize(tx))
      const parsed = await Effect.runPromise(Transaction.parse(serialized))
      expect(parsed.type).toBe(Transaction.Type.Legacy)
      expect(parsed.nonce).toBe(0n)
      expect((parsed as Transaction.Legacy).gasPrice).toBe(20000000000n)
    })
  })

  describe('Type enum', () => {
    it('exports transaction type enum', () => {
      expect(Transaction.Type.Legacy).toBe(0)
      expect(Transaction.Type.EIP2930).toBe(1)
      expect(Transaction.Type.EIP1559).toBe(2)
      expect(Transaction.Type.EIP4844).toBe(3)
      expect(Transaction.Type.EIP7702).toBe(4)
    })
  })
})
