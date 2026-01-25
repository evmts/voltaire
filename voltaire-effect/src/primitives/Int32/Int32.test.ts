import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Int32 from './index.js'

describe('Int32', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(Int32.Schema)(100000)
      expect(result).toBe(100000)
    })

    it('decodes negative number', () => {
      const result = Schema.decodeSync(Int32.Schema)(-100000)
      expect(result).toBe(-100000)
    })

    it('decodes min value', () => {
      const result = Schema.decodeSync(Int32.Schema)(-2147483648)
      expect(result).toBe(-2147483648)
    })

    it('decodes max value', () => {
      const result = Schema.decodeSync(Int32.Schema)(2147483647)
      expect(result).toBe(2147483647)
    })

    it('fails for overflow', () => {
      expect(() => Schema.decodeSync(Int32.Schema)(2147483648)).toThrow()
    })

    it('fails for underflow', () => {
      expect(() => Schema.decodeSync(Int32.Schema)(-2147483649)).toThrow()
    })

    it('encodes back to number', () => {
      const decoded = Schema.decodeSync(Int32.Schema)(100000)
      const encoded = Schema.encodeSync(Int32.Schema)(decoded)
      expect(encoded).toBe(100000)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(Int32.from(100000))
      expect(result).toBe(100000)
    })

    it('creates from bigint', async () => {
      const result = await Effect.runPromise(Int32.from(100000n))
      expect(result).toBe(100000)
    })

    it('fails for overflow', async () => {
      const exit = await Effect.runPromiseExit(Int32.from(3000000000))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Int32.from(1000000))
      const b = await Effect.runPromise(Int32.from(2000000))
      const result = await Effect.runPromise(Int32.plus(a, b))
      expect(result).toBe(3000000)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Int32.from(2000000))
      const b = await Effect.runPromise(Int32.from(1000000))
      const result = await Effect.runPromise(Int32.minus(a, b))
      expect(result).toBe(1000000)
    })
  })

  describe('conversions', () => {
    it('toBigInt works', async () => {
      const value = await Effect.runPromise(Int32.from(-1000000))
      expect(Int32.toBigInt(value)).toBe(-1000000n)
    })
  })

  describe('constants', () => {
    it('exports INT32_MIN', () => {
      expect(Int32.INT32_MIN).toBe(-2147483648)
    })

    it('exports INT32_MAX', () => {
      expect(Int32.INT32_MAX).toBe(2147483647)
    })
  })
})
