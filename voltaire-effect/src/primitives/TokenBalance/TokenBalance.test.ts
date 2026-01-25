import { describe, it, expect } from 'vitest'
import * as TokenBalance from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('TokenBalance', () => {
  describe('Schema', () => {
    it('decodes from bigint', () => {
      const result = Schema.decodeSync(TokenBalance.Schema)(1000000000000000000n)
      expect(result).toBe(1000000000000000000n)
    })

    it('decodes from number', () => {
      const result = Schema.decodeSync(TokenBalance.Schema)(1000)
      expect(result).toBe(1000n)
    })

    it('decodes from hex string', () => {
      const result = Schema.decodeSync(TokenBalance.Schema)('0xde0b6b3a7640000')
      expect(result).toBe(1000000000000000000n)
    })

    it('decodes from decimal string', () => {
      const result = Schema.decodeSync(TokenBalance.Schema)('1000000')
      expect(result).toBe(1000000n)
    })

    it('handles zero', () => {
      const result = Schema.decodeSync(TokenBalance.Schema)(0n)
      expect(result).toBe(0n)
    })

    it('handles max uint256', () => {
      const max = 2n ** 256n - 1n
      const result = Schema.decodeSync(TokenBalance.Schema)(max)
      expect(result).toBe(max)
    })

    it('fails on negative value', () => {
      expect(() => Schema.decodeSync(TokenBalance.Schema)(-1n)).toThrow()
    })
  })

  describe('from', () => {
    it('creates from bigint', async () => {
      const result = await Effect.runPromise(TokenBalance.from(1000n))
      expect(result).toBe(1000n)
    })

    it('creates from number', async () => {
      const result = await Effect.runPromise(TokenBalance.from(500))
      expect(result).toBe(500n)
    })

    it('creates from hex string', async () => {
      const result = await Effect.runPromise(TokenBalance.from('0x64'))
      expect(result).toBe(100n)
    })

    it('handles 18 decimals (1 ETH equivalent)', async () => {
      const oneEth = 1000000000000000000n
      const result = await Effect.runPromise(TokenBalance.from(oneEth))
      expect(result).toBe(oneEth)
    })

    it('fails on negative', async () => {
      const result = await Effect.runPromiseExit(TokenBalance.from(-1))
      expect(result._tag).toBe('Failure')
    })

    it('fails on overflow', async () => {
      const result = await Effect.runPromiseExit(TokenBalance.from(2n ** 256n))
      expect(result._tag).toBe('Failure')
    })
  })

  describe('fromBaseUnit', () => {
    it('converts from base unit with 18 decimals', async () => {
      const result = await Effect.runPromise(TokenBalance.fromBaseUnit('1', 18))
      expect(result).toBe(1000000000000000000n)
    })

    it('converts from base unit with 6 decimals (USDC)', async () => {
      const result = await Effect.runPromise(TokenBalance.fromBaseUnit('1', 6))
      expect(result).toBe(1000000n)
    })

    it('converts decimal amounts', async () => {
      const result = await Effect.runPromise(TokenBalance.fromBaseUnit('1.5', 18))
      expect(result).toBe(1500000000000000000n)
    })

    it('handles very small amounts', async () => {
      const result = await Effect.runPromise(TokenBalance.fromBaseUnit('0.000001', 18))
      expect(result).toBe(1000000000000n)
    })
  })

  describe('format', () => {
    it('formats with 18 decimals', async () => {
      const balance = await Effect.runPromise(TokenBalance.from(1000000000000000000n))
      const result = await Effect.runPromise(TokenBalance.format(balance, 18))
      expect(result).toBe('1')
    })

    it('formats with 6 decimals', async () => {
      const balance = await Effect.runPromise(TokenBalance.from(1000000n))
      const result = await Effect.runPromise(TokenBalance.format(balance, 6))
      expect(result).toBe('1')
    })

    it('formats decimal amounts', async () => {
      const balance = await Effect.runPromise(TokenBalance.from(1500000000000000000n))
      const result = await Effect.runPromise(TokenBalance.format(balance, 18))
      expect(result).toBe('1.5')
    })

    it('formats zero', async () => {
      const balance = await Effect.runPromise(TokenBalance.from(0n))
      const result = await Effect.runPromise(TokenBalance.format(balance, 18))
      expect(result).toBe('0')
    })
  })

  describe('toBaseUnit', () => {
    it('returns raw bigint value', async () => {
      const balance = await Effect.runPromise(TokenBalance.from(1000000000000000000n))
      const result = await Effect.runPromise(TokenBalance.toBaseUnit(balance))
      expect(result).toBe(1000000000000000000n)
    })

    it('returns same bigint for any balance', async () => {
      const balance = await Effect.runPromise(TokenBalance.from(1000000n))
      const result = await Effect.runPromise(TokenBalance.toBaseUnit(balance))
      expect(result).toBe(1000000n)
    })
  })
})
