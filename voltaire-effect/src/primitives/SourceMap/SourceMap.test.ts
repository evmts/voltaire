import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as SourceMap from './index.js'

describe('SourceMap', () => {
  const validSourceMap = '0:50:0:-;51:100:0:i;'

  describe('SourceMapEntrySchema', () => {
    it('validates entry', () => {
      const entry = { start: 0, length: 50, fileIndex: 0, jump: '-' as const }
      const result = Schema.is(SourceMap.SourceMapEntrySchema)(entry)
      expect(result).toBe(true)
    })

    it('rejects invalid jump', () => {
      const entry = { start: 0, length: 50, fileIndex: 0, jump: 'x' }
      const result = Schema.is(SourceMap.SourceMapEntrySchema)(entry)
      expect(result).toBe(false)
    })
  })

  describe('Schema', () => {
    it('decodes valid source map string', () => {
      const result = Schema.decodeSync(SourceMap.Schema)(validSourceMap)
      expect(result.raw).toBe(validSourceMap)
      expect(result.entries.length).toBeGreaterThan(0)
    })

    it('encodes back to string', () => {
      const decoded = Schema.decodeSync(SourceMap.Schema)(validSourceMap)
      const encoded = Schema.encodeSync(SourceMap.Schema)(decoded)
      expect(typeof encoded).toBe('string')
    })
  })

  describe('from', () => {
    it('creates source map from string', async () => {
      const result = await Effect.runPromise(SourceMap.from(validSourceMap))
      expect(result.entries.length).toBeGreaterThan(0)
    })
  })

  describe('getEntryAt', () => {
    it('gets entry at index', async () => {
      const sm = await Effect.runPromise(SourceMap.from(validSourceMap))
      const entry = SourceMap.getEntryAt(sm, 0)
      expect(entry).toBeDefined()
      expect(entry?.start).toBe(0)
    })
  })
})
