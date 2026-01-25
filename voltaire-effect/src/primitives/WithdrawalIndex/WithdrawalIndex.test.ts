import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as WithdrawalIndex from './index.js'

describe('WithdrawalIndex', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(WithdrawalIndex.Schema)(0)
      expect(result).toBe(0n)
    })

    it('decodes bigint', () => {
      const result = Schema.decodeSync(WithdrawalIndex.Schema)(12345n)
      expect(result).toBe(12345n)
    })

    it('fails for negative', () => {
      expect(() => Schema.decodeSync(WithdrawalIndex.Schema)(-1)).toThrow()
    })

    it('encodes back to bigint', () => {
      const decoded = Schema.decodeSync(WithdrawalIndex.Schema)(42n)
      const encoded = Schema.encodeSync(WithdrawalIndex.Schema)(decoded)
      expect(encoded).toBe(42n)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(WithdrawalIndex.from(42))
      expect(result).toBe(42n)
    })

    it('creates from bigint', async () => {
      const result = await Effect.runPromise(WithdrawalIndex.from(12345n))
      expect(result).toBe(12345n)
    })

    it('fails for negative', async () => {
      const exit = await Effect.runPromiseExit(WithdrawalIndex.from(-1))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('conversions', () => {
    it('toBigInt works', async () => {
      const value = await Effect.runPromise(WithdrawalIndex.from(42n))
      expect(WithdrawalIndex.toBigInt(value)).toBe(42n)
    })

    it('toNumber works', async () => {
      const value = await Effect.runPromise(WithdrawalIndex.from(42))
      expect(WithdrawalIndex.toNumber(value)).toBe(42)
    })

    it('equals works', async () => {
      const a = await Effect.runPromise(WithdrawalIndex.from(42n))
      const b = await Effect.runPromise(WithdrawalIndex.from(42n))
      expect(WithdrawalIndex.equals(a, b)).toBe(true)
    })
  })

  describe('constants', () => {
    it('exports UINT64_MAX', () => {
      expect(typeof WithdrawalIndex.UINT64_MAX).toBe('bigint')
    })
  })
})
