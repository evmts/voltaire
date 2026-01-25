import { describe, it, expect } from 'vitest'
import { Uint } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as BalanceEffect from './index.js'
import type { BalanceType } from './BalanceSchema.js'

describe('Balance', () => {
  describe('BalanceSchema', () => {
    it('decodes bigint to BalanceType', () => {
      const result = Schema.decodeSync(BalanceEffect.BalanceSchema)(1000000000000000000n)
      expect(typeof result).toBe('bigint')
    })

    it('decodes number to BalanceType', () => {
      const result = Schema.decodeSync(BalanceEffect.BalanceSchema)(1000)
      expect(typeof result).toBe('bigint')
    })

    it('decodes hex string to BalanceType', () => {
      const result = Schema.decodeSync(BalanceEffect.BalanceSchema)('0xde0b6b3a7640000')
      expect(typeof result).toBe('bigint')
      expect(result).toBe(1000000000000000000n)
    })

    it('decodes zero balance', () => {
      const result = Schema.decodeSync(BalanceEffect.BalanceSchema)(0n)
      expect(result).toBe(0n)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(BalanceEffect.BalanceSchema)(-1n)).toThrow()
    })

    it('encodes BalanceType back to bigint', () => {
      const balance = Uint.from(1000000000000000000n) as unknown as BalanceType
      const result = Schema.encodeSync(BalanceEffect.BalanceSchema)(balance)
      expect(result).toBe(1000000000000000000n)
    })

    it('handles large balances (100M ETH in wei)', () => {
      const largeBalance = 100_000_000n * 10n ** 18n
      const result = Schema.decodeSync(BalanceEffect.BalanceSchema)(largeBalance)
      expect(result).toBe(largeBalance)
    })
  })

  describe('from', () => {
    it('creates Balance from bigint', async () => {
      const result = await Effect.runPromise(BalanceEffect.from(1000000000000000000n))
      expect(typeof result).toBe('bigint')
    })

    it('creates Balance from number', async () => {
      const result = await Effect.runPromise(BalanceEffect.from(1000))
      expect(typeof result).toBe('bigint')
    })

    it('creates Balance from hex string', async () => {
      const result = await Effect.runPromise(BalanceEffect.from('0xde0b6b3a7640000'))
      expect(result).toBe(1000000000000000000n)
    })

    it('creates zero balance', async () => {
      const result = await Effect.runPromise(BalanceEffect.from(0n))
      expect(result).toBe(0n)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(BalanceEffect.from(-1n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
