import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Hardfork from './index.js'

describe('Hardfork', () => {
  describe('Schema', () => {
    it('decodes valid hardfork name', () => {
      const result = Schema.decodeSync(Hardfork.Schema)('london')
      expect(typeof result).toBe('string')
    })

    it('decodes cancun', () => {
      const result = Schema.decodeSync(Hardfork.Schema)('cancun')
      expect(typeof result).toBe('string')
    })

    it('fails for invalid hardfork', () => {
      expect(() => Schema.decodeSync(Hardfork.Schema)('invalid_hardfork')).toThrow()
    })

    it('encodes back to string', () => {
      const decoded = Schema.decodeSync(Hardfork.Schema)('london')
      const encoded = Schema.encodeSync(Hardfork.Schema)(decoded)
      expect(encoded).toBe('london')
    })
  })

  describe('fromString', () => {
    it('creates from valid name', async () => {
      const result = await Effect.runPromise(Hardfork.fromString('london'))
      expect(typeof result).toBe('string')
    })

    it('fails for invalid name', async () => {
      const exit = await Effect.runPromiseExit(Hardfork.fromString('notahardfork'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('hardfork utilities', () => {
    it('hasEIP1559 returns true for london', async () => {
      const london = await Effect.runPromise(Hardfork.fromString('london'))
      expect(Hardfork.hasEIP1559(london)).toBe(true)
    })

    it('hasEIP1559 returns false for berlin', async () => {
      const berlin = await Effect.runPromise(Hardfork.fromString('berlin'))
      expect(Hardfork.hasEIP1559(berlin)).toBe(false)
    })

    it('hasEIP4844 returns true for cancun', async () => {
      const cancun = await Effect.runPromise(Hardfork.fromString('cancun'))
      expect(Hardfork.hasEIP4844(cancun)).toBe(true)
    })

    it('isPostMerge returns true for paris', async () => {
      const paris = await Effect.runPromise(Hardfork.fromString('paris'))
      expect(Hardfork.isPostMerge(paris)).toBe(true)
    })

    it('isAtLeast works correctly', async () => {
      const london = await Effect.runPromise(Hardfork.fromString('london'))
      const berlin = await Effect.runPromise(Hardfork.fromString('berlin'))
      expect(Hardfork.isAtLeast(london, berlin)).toBe(true)
    })
  })
})
