import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Uint32 from './index.js'

describe('Uint32', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(Uint32.Schema)(42)
      expect(result).toBe(42)
    })

    it('decodes max value', () => {
      const result = Schema.decodeSync(Uint32.Schema)(4294967295)
      expect(result).toBe(4294967295)
    })

    it('fails for overflow', () => {
      expect(() => Schema.decodeSync(Uint32.Schema)(4294967296)).toThrow()
    })

    it('fails for negative', () => {
      expect(() => Schema.decodeSync(Uint32.Schema)(-1)).toThrow()
    })

    it('encodes back to number', () => {
      const decoded = Schema.decodeSync(Uint32.Schema)(42)
      const encoded = Schema.encodeSync(Uint32.Schema)(decoded)
      expect(encoded).toBe(42)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(Uint32.from(1000000))
      expect(result).toBe(1000000)
    })

    it('creates from bigint', async () => {
      const result = await Effect.runPromise(Uint32.from(1000000n))
      expect(result).toBe(1000000)
    })

    it('fails for overflow', async () => {
      const exit = await Effect.runPromiseExit(Uint32.from(4294967296))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Uint32.from(1000))
      const b = await Effect.runPromise(Uint32.from(2000))
      const result = await Effect.runPromise(Uint32.plus(a, b))
      expect(result).toBe(3000)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Uint32.from(2000))
      const b = await Effect.runPromise(Uint32.from(1000))
      const result = await Effect.runPromise(Uint32.minus(a, b))
      expect(result).toBe(1000)
    })
  })

  describe('constants', () => {
    it('exports MAX', () => {
      expect(Uint32.MAX).toBe(4294967295)
    })

    it('exports MIN', () => {
      expect(Uint32.MIN).toBe(0)
    })
  })
})
