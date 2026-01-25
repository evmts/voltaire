import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as ChainId from './index.js'

describe('ChainId', () => {
  describe('ChainIdSchema', () => {
    it('decodes positive integer to ChainIdType', () => {
      const result = Schema.decodeSync(ChainId.ChainIdSchema)(1)
      expect(typeof result).toBe('number')
      expect(result).toBe(1)
    })

    it('decodes mainnet chain ID', () => {
      const result = Schema.decodeSync(ChainId.ChainIdSchema)(1)
      expect(result).toBe(1)
    })

    it('decodes sepolia chain ID', () => {
      const result = Schema.decodeSync(ChainId.ChainIdSchema)(11155111)
      expect(result).toBe(11155111)
    })

    it('fails for zero', () => {
      expect(() => Schema.decodeSync(ChainId.ChainIdSchema)(0)).toThrow()
    })

    it('fails for negative number', () => {
      expect(() => Schema.decodeSync(ChainId.ChainIdSchema)(-1)).toThrow()
    })

    it('fails for non-integer', () => {
      expect(() => Schema.decodeSync(ChainId.ChainIdSchema)(1.5)).toThrow()
    })

    it('encodes ChainIdType back to number', () => {
      const chainId = Schema.decodeSync(ChainId.ChainIdSchema)(1)
      const result = Schema.encodeSync(ChainId.ChainIdSchema)(chainId)
      expect(result).toBe(1)
    })
  })

  describe('from', () => {
    it('creates ChainId from positive integer', async () => {
      const result = await Effect.runPromise(ChainId.from(1))
      expect(typeof result).toBe('number')
      expect(result).toBe(1)
    })

    it('creates ChainId from large chain ID', async () => {
      const result = await Effect.runPromise(ChainId.from(11155111))
      expect(result).toBe(11155111)
    })

    it('fails for zero', async () => {
      const exit = await Effect.runPromiseExit(ChainId.from(0))
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails for negative number', async () => {
      const exit = await Effect.runPromiseExit(ChainId.from(-5))
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails for non-integer', async () => {
      const exit = await Effect.runPromiseExit(ChainId.from(1.5))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
