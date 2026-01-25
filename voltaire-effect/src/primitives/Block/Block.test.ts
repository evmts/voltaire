import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Block from './index.js'

describe('Block', () => {
  describe('BlockSchema', () => {
    it('validates a valid block-like object', () => {
      const validBlock = {
        header: {},
        body: {},
        hash: new Uint8Array(32),
        size: 1024n,
      }
      const result = Schema.decodeUnknownSync(Block.BlockSchema)(validBlock)
      expect(result).toBe(validBlock)
    })

    it('fails for invalid object without hash', () => {
      const invalidBlock = {
        header: {},
        body: {},
        size: 1024n,
      }
      expect(() => Schema.decodeUnknownSync(Block.BlockSchema)(invalidBlock)).toThrow()
    })

    it('fails for non-object input', () => {
      expect(() => Schema.decodeUnknownSync(Block.BlockSchema)('invalid')).toThrow()
      expect(() => Schema.decodeUnknownSync(Block.BlockSchema)(null)).toThrow()
    })

    it('fails when hash is not Uint8Array', () => {
      const invalidBlock = {
        header: {},
        body: {},
        hash: 'not-bytes',
        size: 1024n,
      }
      expect(() => Schema.decodeUnknownSync(Block.BlockSchema)(invalidBlock)).toThrow()
    })

    it('fails when size is not bigint', () => {
      const invalidBlock = {
        header: {},
        body: {},
        hash: new Uint8Array(32),
        size: 1024,
      }
      expect(() => Schema.decodeUnknownSync(Block.BlockSchema)(invalidBlock)).toThrow()
    })
  })
})
