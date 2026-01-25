import { describe, it, expect } from 'vitest'
import { Metadata } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as MetadataEffect from './index.js'

describe('Metadata', () => {
  describe('MetadataSchema', () => {
    it('decodes Uint8Array to Metadata', () => {
      const raw = new Uint8Array([0xa2, 0x64, 0x69, 0x70, 0x66, 0x73])
      const result = Schema.decodeSync(MetadataEffect.MetadataSchema)(raw)
      expect(result.raw).toBeInstanceOf(Uint8Array)
    })

    it('encodes Metadata back to Uint8Array', () => {
      const raw = new Uint8Array([0xa2, 0x64])
      const metadata = Metadata.from(raw)
      const result = Schema.encodeSync(MetadataEffect.MetadataSchema)(metadata)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(2)
    })
  })

  describe('from', () => {
    it('creates Metadata from Uint8Array', async () => {
      const raw = new Uint8Array([0xa2, 0x64, 0x69, 0x70, 0x66, 0x73])
      const result = await Effect.runPromise(MetadataEffect.from(raw))
      expect(result.raw).toBeInstanceOf(Uint8Array)
    })

    it('creates Metadata with undefined fields', async () => {
      const raw = new Uint8Array([0xa2])
      const result = await Effect.runPromise(MetadataEffect.from(raw))
      expect(result.solc).toBeUndefined()
      expect(result.ipfs).toBeUndefined()
    })
  })
})
