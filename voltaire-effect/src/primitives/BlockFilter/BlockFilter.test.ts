import { describe, it, expect } from 'vitest'
import { FilterId } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import * as BlockFilterEffect from './index.js'

describe('BlockFilter', () => {
  describe('from', () => {
    it('creates BlockFilter from FilterId', async () => {
      const filterId = FilterId.from('0x1')
      const result = await Effect.runPromise(BlockFilterEffect.from(filterId))
      expect(result).toBeDefined()
      expect(result.type).toBe('block')
      expect(result.filterId).toBe(filterId)
    })
  })
})
