import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Int8 from './index.js'

describe('Int8', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(Int8.Schema)(42)
      expect(result).toBe(42)
    })

    it('decodes negative number', () => {
      const result = Schema.decodeSync(Int8.Schema)(-42)
      expect(result).toBe(-42)
    })

    it('decodes min value', () => {
      const result = Schema.decodeSync(Int8.Schema)(-128)
      expect(result).toBe(-128)
    })

    it('decodes max value', () => {
      const result = Schema.decodeSync(Int8.Schema)(127)
      expect(result).toBe(127)
    })

    it('fails for overflow', () => {
      expect(() => Schema.decodeSync(Int8.Schema)(128)).toThrow()
    })

    it('fails for underflow', () => {
      expect(() => Schema.decodeSync(Int8.Schema)(-129)).toThrow()
    })

    it('encodes back to number', () => {
      const decoded = Schema.decodeSync(Int8.Schema)(42)
      const encoded = Schema.encodeSync(Int8.Schema)(decoded)
      expect(encoded).toBe(42)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(Int8.from(42))
      expect(result).toBe(42)
    })

    it('creates from bigint', async () => {
      const result = await Effect.runPromise(Int8.from(42n))
      expect(result).toBe(42)
    })

    it('fails for overflow', async () => {
      const exit = await Effect.runPromiseExit(Int8.from(200))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Int8.from(10))
      const b = await Effect.runPromise(Int8.from(20))
      const result = await Effect.runPromise(Int8.plus(a, b))
      expect(result).toBe(30)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Int8.from(20))
      const b = await Effect.runPromise(Int8.from(10))
      const result = await Effect.runPromise(Int8.minus(a, b))
      expect(result).toBe(10)
    })
  })

  describe('conversions', () => {
    it('toNumber works', async () => {
      const value = await Effect.runPromise(Int8.from(-42))
      expect(Int8.toNumber(value)).toBe(-42)
    })

    it('toHex works', async () => {
      const value = await Effect.runPromise(Int8.from(127))
      expect(typeof Int8.toHex(value)).toBe('string')
    })
  })

  describe('constants', () => {
    it('exports INT8_MIN', () => {
      expect(Int8.INT8_MIN).toBe(-128)
    })

    it('exports INT8_MAX', () => {
      expect(Int8.INT8_MAX).toBe(127)
    })
  })
})
