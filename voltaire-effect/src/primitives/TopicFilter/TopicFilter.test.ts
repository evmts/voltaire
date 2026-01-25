import { describe, it, expect } from 'vitest'
import { Hash } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as TopicFilterEffect from './index.js'

describe('TopicFilter', () => {
  const eventSig = Hash('0x' + 'ab'.repeat(32))

  describe('TopicFilterSchema', () => {
    it('decodes empty topic filter', () => {
      const result = Schema.decodeSync(TopicFilterEffect.TopicFilterSchema)([])
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('decodes topic filter with single hash', () => {
      const result = Schema.decodeSync(TopicFilterEffect.TopicFilterSchema)([eventSig])
      expect(result.length).toBe(1)
    })

    it('decodes topic filter with null wildcards', () => {
      const result = Schema.decodeSync(TopicFilterEffect.TopicFilterSchema)([eventSig, null, null])
      expect(result.length).toBe(3)
    })

    it('fails for more than 4 entries', () => {
      expect(() => Schema.decodeSync(TopicFilterEffect.TopicFilterSchema)(
        [eventSig, null, null, null, eventSig] as any
      )).toThrow()
    })
  })

  describe('from', () => {
    it('creates topic filter from empty array', async () => {
      const result = await Effect.runPromise(TopicFilterEffect.from([]))
      expect(Array.isArray(result)).toBe(true)
    })

    it('creates topic filter with hash', async () => {
      const result = await Effect.runPromise(TopicFilterEffect.from([eventSig]))
      expect(result.length).toBe(1)
    })

    it('creates topic filter with wildcards', async () => {
      const result = await Effect.runPromise(TopicFilterEffect.from([eventSig, null]))
      expect(result.length).toBe(2)
    })

    it('fails for invalid topic entries', async () => {
      const invalidHash = new Uint8Array(16)
      const exit = await Effect.runPromiseExit(TopicFilterEffect.from([invalidHash as any]))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
