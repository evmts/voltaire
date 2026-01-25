import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as FilterId from './index.js'

describe('FilterId', () => {
  describe('Schema', () => {
    it('decodes valid filter id', () => {
      const result = Schema.decodeSync(FilterId.Schema)('0x1')
      expect(result).toBe('0x1')
    })

    it('decodes hex filter id', () => {
      const result = Schema.decodeSync(FilterId.Schema)('0xabc123')
      expect(typeof result).toBe('string')
    })

    it('encodes filter id back to string', () => {
      const encoded = Schema.encodeSync(FilterId.Schema)('0x1' as FilterId.FilterIdType)
      expect(encoded).toBe('0x1')
    })
  })

  describe('from', () => {
    it('creates filter id from valid string', async () => {
      const result = await Effect.runPromise(FilterId.from('0x1'))
      expect(result).toBe('0x1')
    })

    it('creates filter id from hex string', async () => {
      const result = await Effect.runPromise(FilterId.from('0xabc'))
      expect(typeof result).toBe('string')
    })
  })
})
