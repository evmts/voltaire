import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Uint128 from './index.js'

describe('Uint128', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(Uint128.Schema)(42)
      expect(result).toBe(42n)
    })

    it('decodes bigint', () => {
      const result = Schema.decodeSync(Uint128.Schema)(BigInt('340282366920938463463374607431768211455'))
      expect(result).toBe(BigInt('340282366920938463463374607431768211455'))
    })

    it('fails for negative', () => {
      expect(() => Schema.decodeSync(Uint128.Schema)(-1)).toThrow()
    })

    it('encodes back to bigint', () => {
      const decoded = Schema.decodeSync(Uint128.Schema)(42n)
      const encoded = Schema.encodeSync(Uint128.Schema)(decoded)
      expect(encoded).toBe(42n)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(Uint128.from(1000000))
      expect(result).toBe(1000000n)
    })

    it('creates from bigint', async () => {
      const result = await Effect.runPromise(Uint128.from(BigInt('170141183460469231731687303715884105727')))
      expect(result).toBe(BigInt('170141183460469231731687303715884105727'))
    })

    it('fails for negative', async () => {
      const exit = await Effect.runPromiseExit(Uint128.from(-1))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Uint128.from(1000n))
      const b = await Effect.runPromise(Uint128.from(2000n))
      const result = await Effect.runPromise(Uint128.plus(a, b))
      expect(result).toBe(3000n)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Uint128.from(2000n))
      const b = await Effect.runPromise(Uint128.from(1000n))
      const result = await Effect.runPromise(Uint128.minus(a, b))
      expect(result).toBe(1000n)
    })
  })

  describe('conversions', () => {
    it('toBigInt works', async () => {
      const value = await Effect.runPromise(Uint128.from(42n))
      expect(Uint128.toBigInt(value)).toBe(42n)
    })

    it('toHex works', async () => {
      const value = await Effect.runPromise(Uint128.from(255n))
      expect(typeof Uint128.toHex(value)).toBe('string')
    })
  })

  describe('constants', () => {
    it('exports MAX', () => {
      expect(typeof Uint128.MAX).toBe('bigint')
    })

    it('exports MIN', () => {
      expect(Uint128.MIN).toBe(0n)
    })
  })
})
