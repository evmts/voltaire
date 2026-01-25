import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Int16 from './index.js'

describe('Int16', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(Int16.Schema)(1000)
      expect(result).toBe(1000)
    })

    it('decodes negative number', () => {
      const result = Schema.decodeSync(Int16.Schema)(-1000)
      expect(result).toBe(-1000)
    })

    it('decodes min value', () => {
      const result = Schema.decodeSync(Int16.Schema)(-32768)
      expect(result).toBe(-32768)
    })

    it('decodes max value', () => {
      const result = Schema.decodeSync(Int16.Schema)(32767)
      expect(result).toBe(32767)
    })

    it('fails for overflow', () => {
      expect(() => Schema.decodeSync(Int16.Schema)(32768)).toThrow()
    })

    it('fails for underflow', () => {
      expect(() => Schema.decodeSync(Int16.Schema)(-32769)).toThrow()
    })

    it('encodes back to number', () => {
      const decoded = Schema.decodeSync(Int16.Schema)(1000)
      const encoded = Schema.encodeSync(Int16.Schema)(decoded)
      expect(encoded).toBe(1000)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(Int16.from(1000))
      expect(result).toBe(1000)
    })

    it('creates from bigint', async () => {
      const result = await Effect.runPromise(Int16.from(1000n))
      expect(result).toBe(1000)
    })

    it('fails for overflow', async () => {
      const exit = await Effect.runPromiseExit(Int16.from(40000))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Int16.from(100))
      const b = await Effect.runPromise(Int16.from(200))
      const result = await Effect.runPromise(Int16.plus(a, b))
      expect(result).toBe(300)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Int16.from(200))
      const b = await Effect.runPromise(Int16.from(100))
      const result = await Effect.runPromise(Int16.minus(a, b))
      expect(result).toBe(100)
    })
  })

  describe('constants', () => {
    it('exports INT16_MIN', () => {
      expect(Int16.INT16_MIN).toBe(-32768)
    })

    it('exports INT16_MAX', () => {
      expect(Int16.INT16_MAX).toBe(32767)
    })
  })
})
