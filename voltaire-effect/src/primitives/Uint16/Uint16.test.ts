import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Uint16 from './index.js'

describe('Uint16', () => {
  describe('Schema', () => {
    it('decodes valid number', () => {
      const result = Schema.decodeSync(Uint16.Schema)(42)
      expect(result).toBe(42)
    })

    it('decodes max value', () => {
      const result = Schema.decodeSync(Uint16.Schema)(65535)
      expect(result).toBe(65535)
    })

    it('decodes from string', () => {
      const result = Schema.decodeSync(Uint16.Schema)('1000')
      expect(result).toBe(1000)
    })

    it('fails for overflow', () => {
      expect(() => Schema.decodeSync(Uint16.Schema)(65536)).toThrow()
    })

    it('fails for negative', () => {
      expect(() => Schema.decodeSync(Uint16.Schema)(-1)).toThrow()
    })

    it('encodes back to number', () => {
      const decoded = Schema.decodeSync(Uint16.Schema)(42)
      const encoded = Schema.encodeSync(Uint16.Schema)(decoded)
      expect(encoded).toBe(42)
    })
  })

  describe('from', () => {
    it('creates from number', async () => {
      const result = await Effect.runPromise(Uint16.from(1000))
      expect(result).toBe(1000)
    })

    it('creates from string', async () => {
      const result = await Effect.runPromise(Uint16.from('1000'))
      expect(result).toBe(1000)
    })

    it('fails for overflow', async () => {
      const exit = await Effect.runPromiseExit(Uint16.from(65536))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('arithmetic', () => {
    it('plus works', async () => {
      const a = await Effect.runPromise(Uint16.from(100))
      const b = await Effect.runPromise(Uint16.from(200))
      const result = await Effect.runPromise(Uint16.plus(a, b))
      expect(result).toBe(300)
    })

    it('minus works', async () => {
      const a = await Effect.runPromise(Uint16.from(200))
      const b = await Effect.runPromise(Uint16.from(100))
      const result = await Effect.runPromise(Uint16.minus(a, b))
      expect(result).toBe(100)
    })
  })

  describe('constants', () => {
    it('exports MAX', () => {
      expect(Uint16.MAX).toBe(65535)
    })

    it('exports MIN', () => {
      expect(Uint16.MIN).toBe(0)
    })
  })
})
