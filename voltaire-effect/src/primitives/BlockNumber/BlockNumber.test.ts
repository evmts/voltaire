import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as BlockNumber from './index.js'

describe('BlockNumber', () => {
  describe('BlockNumberSchema', () => {
    it('decodes number to BlockNumberType', () => {
      const result = Schema.decodeSync(BlockNumber.BlockNumberSchema)(12345)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(12345n)
    })

    it('decodes bigint to BlockNumberType', () => {
      const result = Schema.decodeSync(BlockNumber.BlockNumberSchema)(12345n)
      expect(typeof result).toBe('bigint')
      expect(result).toBe(12345n)
    })

    it('fails for negative number', () => {
      expect(() => Schema.decodeSync(BlockNumber.BlockNumberSchema)(-1)).toThrow()
    })

    it('encodes BlockNumberType back to bigint', () => {
      const bn = Schema.decodeSync(BlockNumber.BlockNumberSchema)(100)
      const result = Schema.encodeSync(BlockNumber.BlockNumberSchema)(bn)
      expect(result).toBe(100n)
    })
  })

  describe('from', () => {
    it('creates BlockNumber from number', async () => {
      const result = await Effect.runPromise(BlockNumber.from(42))
      expect(typeof result).toBe('bigint')
      expect(result).toBe(42n)
    })

    it('creates BlockNumber from bigint', async () => {
      const result = await Effect.runPromise(BlockNumber.from(100n))
      expect(typeof result).toBe('bigint')
      expect(result).toBe(100n)
    })

    it('fails for negative input', async () => {
      const exit = await Effect.runPromiseExit(BlockNumber.from(-5))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
