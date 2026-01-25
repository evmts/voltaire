import { describe, it, expect } from 'vitest'
import { LogIndex } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as LogIndexEffect from './index.js'

describe('LogIndex', () => {
  describe('LogIndexSchema', () => {
    it('decodes number to LogIndex', () => {
      const result = Schema.decodeSync(LogIndexEffect.LogIndexSchema)(0)
      expect(typeof result).toBe('number')
      expect(result).toBe(0)
    })

    it('decodes positive number to LogIndex', () => {
      const result = Schema.decodeSync(LogIndexEffect.LogIndexSchema)(42)
      expect(result).toBe(42)
    })

    it('decodes bigint to LogIndex', () => {
      const result = Schema.decodeSync(LogIndexEffect.LogIndexSchema)(5n)
      expect(result).toBe(5)
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(LogIndexEffect.LogIndexSchema)(-1)).toThrow()
    })

    it('encodes LogIndexType back to number', () => {
      const logIndex = LogIndex.from(10)
      const result = Schema.encodeSync(LogIndexEffect.LogIndexSchema)(logIndex)
      expect(result).toBe(10)
    })
  })

  describe('from', () => {
    it('creates LogIndex from number', async () => {
      const result = await Effect.runPromise(LogIndexEffect.from(0))
      expect(result).toBe(0)
    })

    it('creates LogIndex from positive number', async () => {
      const result = await Effect.runPromise(LogIndexEffect.from(42))
      expect(result).toBe(42)
    })

    it('creates LogIndex from bigint', async () => {
      const result = await Effect.runPromise(LogIndexEffect.from(5n))
      expect(result).toBe(5)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(LogIndexEffect.from(-1))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
