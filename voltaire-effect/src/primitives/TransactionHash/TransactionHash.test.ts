import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as TransactionHashEffect from './index.js'

describe('TransactionHash', () => {
  const validHex = '0x' + 'ab'.repeat(32)
  const validBytes = new Uint8Array(32).fill(0xab)

  describe('TransactionHashSchema', () => {
    it('decodes valid hex string to TransactionHashType', () => {
      const result = Schema.decodeSync(TransactionHashEffect.TransactionHashSchema)(validHex)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for invalid hex string', () => {
      expect(() => Schema.decodeSync(TransactionHashEffect.TransactionHashSchema)('invalid')).toThrow()
    })

    it('fails for wrong length', () => {
      expect(() => Schema.decodeSync(TransactionHashEffect.TransactionHashSchema)('0x1234')).toThrow()
    })

    it('encodes TransactionHashType back to hex string', () => {
      const hash = Schema.decodeSync(TransactionHashEffect.TransactionHashSchema)(validHex)
      const result = Schema.encodeSync(TransactionHashEffect.TransactionHashSchema)(hash)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
    })
  })

  describe('TransactionHashFromBytesSchema', () => {
    it('decodes valid bytes to TransactionHashType', () => {
      const result = Schema.decodeSync(TransactionHashEffect.TransactionHashFromBytesSchema)(validBytes)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for wrong byte length', () => {
      const shortBytes = new Uint8Array(16)
      expect(() => Schema.decodeSync(TransactionHashEffect.TransactionHashFromBytesSchema)(shortBytes)).toThrow()
    })
  })

  describe('from', () => {
    it('creates transaction hash from hex string', async () => {
      const result = await Effect.runPromise(TransactionHashEffect.from(validHex))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('creates transaction hash from bytes', async () => {
      const result = await Effect.runPromise(TransactionHashEffect.from(validBytes))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for invalid input', async () => {
      const exit = await Effect.runPromiseExit(TransactionHashEffect.from('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromHex', () => {
    it('creates transaction hash from hex string', async () => {
      const result = await Effect.runPromise(TransactionHashEffect.fromHex(validHex))
      expect(result.length).toBe(32)
    })
  })

  describe('fromBytes', () => {
    it('creates transaction hash from bytes', async () => {
      const result = await Effect.runPromise(TransactionHashEffect.fromBytes(validBytes))
      expect(result.length).toBe(32)
    })
  })

  describe('toHex', () => {
    it('converts transaction hash to hex string', async () => {
      const hash = await Effect.runPromise(TransactionHashEffect.from(validHex))
      const result = TransactionHashEffect.toHex(hash)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
    })
  })
})
