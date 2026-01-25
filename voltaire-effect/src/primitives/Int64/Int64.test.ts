import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Int64 from './index.js'

describe('Int64', () => {
  describe('Schema', () => {
    it('decodes valid bigint', () => {
      const result = Schema.decodeSync(Int64.Schema)(1000000000000n)
      expect(result).toBe(1000000000000n)
    })

    it('decodes negative bigint', () => {
      const result = Schema.decodeSync(Int64.Schema)(-1000000000000n)
      expect(result).toBe(-1000000000000n)
    })

    it('decodes min value', () => {
      const result = Schema.decodeSync(Int64.Schema)(-9223372036854775808n)
      expect(result).toBe(-9223372036854775808n)
    })

    it('decodes max value', () => {
      const result = Schema.decodeSync(Int64.Schema)(9223372036854775807n)
      expect(result).toBe(9223372036854775807n)
    })

    it('fails for overflow', () => {
      expect(() => Schema.decodeSync(Int64.Schema)(9223372036854775808n)).toThrow()
    })

    it('encodes back to bigint', () => {
      const decoded = Schema.decodeSync(Int64.Schema)(1000000000000n)
      const encoded = Schema.encodeSync(Int64.Schema)(decoded)
      expect(encoded).toBe(1000000000000n)
    })
  })

  describe('from', () => {
    it('creates from bigint', async () => {
      const result = await Effect.runPromise(Int64.from(1000000000000n))
      expect(result).toBe(1000000000000n)
    })

    it('creates from number', async () => {
      const result = await Effect.runPromise(Int64.from(1000000))
      expect(result).toBe(1000000n)
    })

    it('fails for overflow', async () => {
      const exit = await Effect.runPromiseExit(Int64.from(9223372036854775808n))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Int64.from(1000000000000n))
      const b = await Effect.runPromise(Int64.from(2000000000000n))
      const result = await Effect.runPromise(Int64.plus(a, b))
      expect(result).toBe(3000000000000n)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Int64.from(2000000000000n))
      const b = await Effect.runPromise(Int64.from(1000000000000n))
      const result = await Effect.runPromise(Int64.minus(a, b))
      expect(result).toBe(1000000000000n)
    })
  })

  describe('conversions', () => {
    it('toBigInt works', async () => {
      const value = await Effect.runPromise(Int64.from(-1000000000000n))
      expect(Int64.toBigInt(value)).toBe(-1000000000000n)
    })
  })

  describe('constants', () => {
    it('exports INT64_MIN', () => {
      expect(Int64.INT64_MIN).toBe(-9223372036854775808n)
    })

    it('exports INT64_MAX', () => {
      expect(Int64.INT64_MAX).toBe(9223372036854775807n)
    })
  })
})
