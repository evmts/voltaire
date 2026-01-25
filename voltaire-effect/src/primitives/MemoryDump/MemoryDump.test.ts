import { describe, it, expect } from 'vitest'
import { MemoryDump } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as MemoryDumpEffect from './index.js'

describe('MemoryDump', () => {
  describe('MemoryDumpSchema', () => {
    it('decodes Uint8Array to MemoryDump', () => {
      const bytes = new Uint8Array(64)
      const result = Schema.decodeSync(MemoryDumpEffect.MemoryDumpSchema)(bytes)
      expect(result.data).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('decodes object with data to MemoryDump', () => {
      const input = { data: new Uint8Array(32), length: 32 }
      const result = Schema.decodeSync(MemoryDumpEffect.MemoryDumpSchema)(input)
      expect(result.data).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('encodes MemoryDump back to Uint8Array', () => {
      const dump = MemoryDump.from(new Uint8Array(16))
      const result = Schema.encodeSync(MemoryDumpEffect.MemoryDumpSchema)(dump)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(16)
    })
  })

  describe('from', () => {
    it('creates MemoryDump from Uint8Array', async () => {
      const bytes = new Uint8Array(64)
      const result = await Effect.runPromise(MemoryDumpEffect.from(bytes))
      expect(result.data).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('creates MemoryDump from object', async () => {
      const input = { data: new Uint8Array(32), length: 32 }
      const result = await Effect.runPromise(MemoryDumpEffect.from(input))
      expect(result.length).toBe(32)
    })
  })
})
