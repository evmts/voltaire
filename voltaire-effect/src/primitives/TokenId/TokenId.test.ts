import { describe, it, expect } from 'vitest'
import * as TokenId from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('TokenId', () => {
  describe('Schema', () => {
    it('decodes from bigint', () => {
      const result = Schema.decodeSync(TokenId.Schema)(1n)
      expect(result).toBe(1n)
    })

    it('decodes from number', () => {
      const result = Schema.decodeSync(TokenId.Schema)(42)
      expect(result).toBe(42n)
    })

    it('decodes from hex string', () => {
      const result = Schema.decodeSync(TokenId.Schema)('0xff')
      expect(result).toBe(255n)
    })

    it('decodes from decimal string', () => {
      const result = Schema.decodeSync(TokenId.Schema)('1000')
      expect(result).toBe(1000n)
    })

    it('handles zero', () => {
      const result = Schema.decodeSync(TokenId.Schema)(0n)
      expect(result).toBe(0n)
    })

    it('handles large values', () => {
      const large = 2n ** 200n
      const result = Schema.decodeSync(TokenId.Schema)(large)
      expect(result).toBe(large)
    })

    it('fails on negative value', () => {
      expect(() => Schema.decodeSync(TokenId.Schema)(-1n)).toThrow()
    })
  })

  describe('FromHexSchema', () => {
    it('decodes from hex string', () => {
      const result = Schema.decodeSync(TokenId.FromHexSchema)('0x10')
      expect(result).toBe(16n)
    })

    it('decodes from large hex', () => {
      const result = Schema.decodeSync(TokenId.FromHexSchema)('0xffffffff')
      expect(result).toBe(4294967295n)
    })
  })

  describe('from', () => {
    it('creates from bigint', async () => {
      const result = await Effect.runPromise(TokenId.from(123n))
      expect(result).toBe(123n)
    })

    it('creates from number', async () => {
      const result = await Effect.runPromise(TokenId.from(456))
      expect(result).toBe(456n)
    })

    it('creates from hex string', async () => {
      const result = await Effect.runPromise(TokenId.from('0xabc'))
      expect(result).toBe(2748n)
    })

    it('handles max safe integer', async () => {
      const result = await Effect.runPromise(TokenId.from(Number.MAX_SAFE_INTEGER))
      expect(result).toBe(BigInt(Number.MAX_SAFE_INTEGER))
    })

    it('handles uint256 max', async () => {
      const max = 2n ** 256n - 1n
      const result = await Effect.runPromise(TokenId.from(max))
      expect(result).toBe(max)
    })

    it('fails on negative', async () => {
      const result = await Effect.runPromiseExit(TokenId.from(-1))
      expect(result._tag).toBe('Failure')
    })

    it('fails on overflow', async () => {
      const result = await Effect.runPromiseExit(TokenId.from(2n ** 256n))
      expect(result._tag).toBe('Failure')
    })
  })

  describe('fromNumber', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(TokenId.fromNumber(789))
      expect(result).toBe(789n)
    })

    it('creates from zero', async () => {
      const result = await Effect.runPromise(TokenId.fromNumber(0))
      expect(result).toBe(0n)
    })
  })

  describe('fromBigInt', () => {
    it('creates from bigint', async () => {
      const result = await Effect.runPromise(TokenId.fromBigInt(999n))
      expect(result).toBe(999n)
    })

    it('creates from large bigint', async () => {
      const large = 2n ** 128n
      const result = await Effect.runPromise(TokenId.fromBigInt(large))
      expect(result).toBe(large)
    })
  })

  describe('fromHex', () => {
    it('creates from hex string', async () => {
      const result = await Effect.runPromise(TokenId.fromHex('0x1'))
      expect(result).toBe(1n)
    })

    it('creates from large hex', async () => {
      const result = await Effect.runPromise(TokenId.fromHex('0x' + 'ff'.repeat(32)))
      expect(result).toBe(2n ** 256n - 1n)
    })
  })
})
