import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Int128 from './index.js'

describe('Int128', () => {
  describe('Schema', () => {
    it('decodes valid bigint', () => {
      const result = Schema.decodeSync(Int128.Schema)(1000000000000000000000000n)
      expect(result).toBe(1000000000000000000000000n)
    })

    it('decodes negative bigint', () => {
      const result = Schema.decodeSync(Int128.Schema)(-1000000000000000000000000n)
      expect(result).toBe(-1000000000000000000000000n)
    })

    it('decodes zero', () => {
      const result = Schema.decodeSync(Int128.Schema)(0n)
      expect(result).toBe(0n)
    })

    it('encodes back to bigint', () => {
      const decoded = Schema.decodeSync(Int128.Schema)(1000000000000n)
      const encoded = Schema.encodeSync(Int128.Schema)(decoded)
      expect(encoded).toBe(1000000000000n)
    })
  })

  describe('from', () => {
    it('creates from bigint', async () => {
      const result = await Effect.runPromise(Int128.from(1000000000000000000000000n))
      expect(result).toBe(1000000000000000000000000n)
    })

    it('creates from number', async () => {
      const result = await Effect.runPromise(Int128.from(1000000))
      expect(result).toBe(1000000n)
    })

    it('creates from string', async () => {
      const result = await Effect.runPromise(Int128.from('-42'))
      expect(result).toBe(-42n)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Int128.from(1000000000000000000n))
      const b = await Effect.runPromise(Int128.from(2000000000000000000n))
      const result = await Effect.runPromise(Int128.plus(a, b))
      expect(result).toBe(3000000000000000000n)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Int128.from(2000000000000000000n))
      const b = await Effect.runPromise(Int128.from(1000000000000000000n))
      const result = await Effect.runPromise(Int128.minus(a, b))
      expect(result).toBe(1000000000000000000n)
    })

    it('times works', async () => {
      const a = await Effect.runPromise(Int128.from(1000000n))
      const b = await Effect.runPromise(Int128.from(1000000n))
      const result = await Effect.runPromise(Int128.times(a, b))
      expect(result).toBe(1000000000000n)
    })
  })

  describe('conversions', () => {
    it('toBigInt works', async () => {
      const value = await Effect.runPromise(Int128.from(-1000000000000n))
      expect(Int128.toBigInt(value)).toBe(-1000000000000n)
    })

    it('toHex works', async () => {
      const value = await Effect.runPromise(Int128.from(255n))
      expect(typeof Int128.toHex(value)).toBe('string')
    })
  })

  describe('constants', () => {
    it('exports MAX', () => {
      expect(typeof Int128.MAX).toBe('bigint')
    })

    it('exports MIN', () => {
      expect(typeof Int128.MIN).toBe('bigint')
    })

    it('exports ZERO', () => {
      expect(Int128.ZERO).toBe(0n)
    })

    it('exports ONE', () => {
      expect(Int128.ONE).toBe(1n)
    })

    it('exports NEG_ONE', () => {
      expect(Int128.NEG_ONE).toBe(-1n)
    })
  })
})
