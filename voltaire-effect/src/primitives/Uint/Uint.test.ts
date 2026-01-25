import { describe, it, expect } from 'vitest'
import { Uint256 } from '@tevm/voltaire/Uint'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as UintEffect from './index.js'

describe('Uint', () => {
  describe('UintSchema', () => {
    it('decodes bigint to Uint256Type', () => {
      const result = Schema.decodeSync(UintEffect.UintSchema)(100n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number to Uint256Type', () => {
      const result = Schema.decodeSync(UintEffect.UintSchema)(42)
      expect(typeof result).toBe('bigint')
    })

    it('decodes string to Uint256Type', () => {
      const result = Schema.decodeSync(UintEffect.UintSchema)('0xff')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(255n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(UintEffect.UintSchema)(-1n)).toThrow()
    })

    it('encodes Uint256Type back to bigint', () => {
      const uint = Uint256.from(100n)
      const result = Schema.encodeSync(UintEffect.UintSchema)(uint)
      expect(result).toBe(100n)
    })
  })

  describe('UintFromHexSchema', () => {
    it('decodes hex string to Uint256Type', () => {
      const result = Schema.decodeSync(UintEffect.UintFromHexSchema)('0xff')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(255n)
    })

    it('encodes Uint256Type back to hex string', () => {
      const uint = Uint256.from(255n)
      const result = Schema.encodeSync(UintEffect.UintFromHexSchema)(uint)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
    })
  })

  describe('UintFromBytesSchema', () => {
    it('decodes Uint8Array to Uint256Type', () => {
      const bytes = new Uint8Array([0xff])
      const result = Schema.decodeSync(UintEffect.UintFromBytesSchema)(bytes)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(255n)
    })

    it('encodes Uint256Type back to bytes', () => {
      const uint = Uint256.from(255n)
      const result = Schema.encodeSync(UintEffect.UintFromBytesSchema)(uint)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('from', () => {
    it('creates Uint256 from bigint', async () => {
      const result = await Effect.runPromise(UintEffect.from(100n))
      expect(typeof result).toBe('bigint')
    })

    it('creates Uint256 from number', async () => {
      const result = await Effect.runPromise(UintEffect.from(42))
      expect(typeof result).toBe('bigint')
    })

    it('creates Uint256 from hex string', async () => {
      const result = await Effect.runPromise(UintEffect.from('0xff'))
      expect(result).toBe(255n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(UintEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromHex', () => {
    it('creates Uint256 from hex string', async () => {
      const result = await Effect.runPromise(UintEffect.fromHex('0xff'))
      expect(result).toBe(255n)
    })
  })

  describe('fromBytes', () => {
    it('creates Uint256 from Uint8Array', async () => {
      const bytes = new Uint8Array([0xff])
      const result = await Effect.runPromise(UintEffect.fromBytes(bytes))
      expect(result).toBe(255n)
    })
  })

  describe('fromNumber', () => {
    it('creates Uint256 from number', async () => {
      const result = await Effect.runPromise(UintEffect.fromNumber(42))
      expect(typeof result).toBe('bigint')
    })

    it('fails for non-integer', async () => {
      const exit = await Effect.runPromiseExit(UintEffect.fromNumber(1.5))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromBigInt', () => {
    it('creates Uint256 from bigint', async () => {
      const result = await Effect.runPromise(UintEffect.fromBigInt(100n))
      expect(result).toBe(100n)
    })
  })
})
