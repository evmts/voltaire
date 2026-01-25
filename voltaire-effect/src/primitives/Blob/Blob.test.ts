import { describe, it, expect } from 'vitest'
import { BrandedBlob as BlobNamespace } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as BlobEffect from './index.js'

const BLOB_SIZE = 131072

describe('Blob', () => {
  describe('BlobSchema', () => {
    it('decodes valid blob bytes', () => {
      const bytes = new Uint8Array(BLOB_SIZE)
      const result = Schema.decodeSync(BlobEffect.BlobSchema)(bytes)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(BLOB_SIZE)
    })

    it('fails for invalid size', () => {
      const bytes = new Uint8Array(100)
      expect(() => Schema.decodeSync(BlobEffect.BlobSchema)(bytes)).toThrow()
    })

    it('encodes blob back to bytes', () => {
      const bytes = new Uint8Array(BLOB_SIZE)
      const blob = BlobNamespace.from(bytes)
      const result = Schema.encodeSync(BlobEffect.BlobSchema)(blob)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(BLOB_SIZE)
    })
  })

  describe('from', () => {
    it('creates Blob from bytes', async () => {
      const bytes = new Uint8Array(BLOB_SIZE)
      const result = await Effect.runPromise(BlobEffect.from(bytes))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(BLOB_SIZE)
    })

    it('fails for invalid size', async () => {
      const bytes = new Uint8Array(100)
      const exit = await Effect.runPromiseExit(BlobEffect.from(bytes))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromData', () => {
    it('creates Blob from data', async () => {
      const data = new Uint8Array([1, 2, 3, 4])
      const result = await Effect.runPromise(BlobEffect.fromData(data))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(BLOB_SIZE)
    })
  })

  describe('toData', () => {
    it('extracts data from blob', async () => {
      const data = new Uint8Array([1, 2, 3, 4])
      const blob = await Effect.runPromise(BlobEffect.fromData(data))
      const extracted = BlobEffect.toData(blob)
      expect(extracted).toBeInstanceOf(Uint8Array)
    })
  })

  describe('isValid', () => {
    it('returns true for valid blob', () => {
      const blob = new Uint8Array(BLOB_SIZE)
      expect(BlobEffect.isValid(blob)).toBe(true)
    })

    it('returns false for invalid blob', () => {
      const blob = new Uint8Array(100)
      expect(BlobEffect.isValid(blob)).toBe(false)
    })
  })

  describe('constants', () => {
    it('exports SIZE', () => {
      expect(BlobEffect.SIZE).toBe(BLOB_SIZE)
    })
  })
})
