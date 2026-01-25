import { describe, it, expect } from 'vitest'
import { Int256 } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Int256Effect from './index.js'

describe('Int256', () => {
  describe('Int256Schema', () => {
    it('decodes bigint to Int256', () => {
      const result = Schema.decodeSync(Int256Effect.Int256Schema)(100n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes negative bigint to Int256', () => {
      const result = Schema.decodeSync(Int256Effect.Int256Schema)(-100n)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(-100n)
    })

    it('decodes number to Int256', () => {
      const result = Schema.decodeSync(Int256Effect.Int256Schema)(42)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to Int256', () => {
      const result = Schema.decodeSync(Int256Effect.Int256Schema)('0xff')
      expect(typeof result).toBe('bigint')
    })

    it('encodes Int256 back to bigint', () => {
      const int256 = Int256(42n)
      const result = Schema.encodeSync(Int256Effect.Int256Schema)(int256)
      expect(result).toBe(42n)
    })
  })

  describe('Int256FromHexSchema', () => {
    it('decodes hex string to Int256', () => {
      const result = Schema.decodeSync(Int256Effect.Int256FromHexSchema)('0xff')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(255n)
    })

    it('encodes Int256 to hex string', () => {
      const int256 = Int256(255n)
      const result = Schema.encodeSync(Int256Effect.Int256FromHexSchema)(int256)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
    })
  })

  describe('from', () => {
    it('creates Int256 from bigint', async () => {
      const result = await Effect.runPromise(Int256Effect.from(100n))
      expect(typeof result).toBe('bigint')
    })

    it('creates Int256 from negative bigint', async () => {
      const result = await Effect.runPromise(Int256Effect.from(-100n))
      expect(result).toBe(-100n)
    })

    it('creates Int256 from number', async () => {
      const result = await Effect.runPromise(Int256Effect.from(42))
      expect(typeof result).toBe('bigint')
    })
  })

  describe('fromHex', () => {
    it('creates Int256 from hex string', async () => {
      const result = await Effect.runPromise(Int256Effect.fromHex('0xff'))
      expect(result).toBe(255n)
    })

    it('fails for invalid hex', async () => {
      const exit = await Effect.runPromiseExit(Int256Effect.fromHex('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
