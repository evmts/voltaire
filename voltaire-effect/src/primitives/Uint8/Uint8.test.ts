import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Uint8 from './index.js'

describe('Uint8', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(Uint8.Schema)(42)
      expect(result).toBe(42)
    })

    it('decodes zero', () => {
      const result = Schema.decodeSync(Uint8.Schema)(0)
      expect(result).toBe(0)
    })

    it('decodes max value', () => {
      const result = Schema.decodeSync(Uint8.Schema)(255)
      expect(result).toBe(255)
    })

    it('decodes from string', () => {
      const result = Schema.decodeSync(Uint8.Schema)('42')
      expect(result).toBe(42)
    })

    it('fails for overflow', () => {
      expect(() => Schema.decodeSync(Uint8.Schema)(256)).toThrow()
    })

    it('fails for negative', () => {
      expect(() => Schema.decodeSync(Uint8.Schema)(-1)).toThrow()
    })

    it('encodes back to number', () => {
      const decoded = Schema.decodeSync(Uint8.Schema)(42)
      const encoded = Schema.encodeSync(Uint8.Schema)(decoded)
      expect(encoded).toBe(42)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(Uint8.from(42))
      expect(result).toBe(42)
    })

    it('creates from string', async () => {
      const result = await Effect.runPromise(Uint8.from('42'))
      expect(result).toBe(42)
    })

    it('fails for overflow', async () => {
      const exit = await Effect.runPromiseExit(Uint8.from(256))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Uint8.from(10))
      const b = await Effect.runPromise(Uint8.from(20))
      const result = await Effect.runPromise(Uint8.plus(a, b))
      expect(result).toBe(30)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Uint8.from(20))
      const b = await Effect.runPromise(Uint8.from(10))
      const result = await Effect.runPromise(Uint8.minus(a, b))
      expect(result).toBe(10)
    })
  })

  describe('conversions', () => {
    it('toNumber works', async () => {
      const value = await Effect.runPromise(Uint8.from(42))
      expect(Uint8.toNumber(value)).toBe(42)
    })

    it('toHex works', async () => {
      const value = await Effect.runPromise(Uint8.from(255))
      expect(typeof Uint8.toHex(value)).toBe('string')
    })
  })

  describe('constants', () => {
    it('exports MAX', () => {
      expect(Uint8.MAX).toBe(255)
    })

    it('exports MIN', () => {
      expect(Uint8.MIN).toBe(0)
    })

    it('exports ZERO', () => {
      expect(Uint8.ZERO).toBe(0)
    })

    it('exports ONE', () => {
      expect(Uint8.ONE).toBe(1)
    })
  })
})
