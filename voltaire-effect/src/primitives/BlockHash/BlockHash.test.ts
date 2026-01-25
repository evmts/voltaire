import { describe, it, expect } from 'vitest'
import { BlockHash } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as BlockHashEffect from './index.js'

const VALID_HASH = '0x' + '00'.repeat(32)
const VALID_HASH_BYTES = new Uint8Array(32).fill(0)

describe('BlockHash', () => {
  describe('BlockHashSchema', () => {
    it('decodes valid hex string to BlockHashType', () => {
      const result = Schema.decodeSync(BlockHashEffect.BlockHashSchema)(VALID_HASH)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for invalid hex string', () => {
      expect(() => Schema.decodeSync(BlockHashEffect.BlockHashSchema)('invalid')).toThrow()
    })

    it('fails for wrong length', () => {
      expect(() => Schema.decodeSync(BlockHashEffect.BlockHashSchema)('0x1234')).toThrow()
    })

    it('encodes BlockHashType back to string', () => {
      const hash = BlockHash.from(VALID_HASH)
      const result = Schema.encodeSync(BlockHashEffect.BlockHashSchema)(hash)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
    })
  })

  describe('from', () => {
    it('creates BlockHash from hex string', async () => {
      const result = await Effect.runPromise(BlockHashEffect.from(VALID_HASH))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('creates BlockHash from bytes', async () => {
      const result = await Effect.runPromise(BlockHashEffect.from(VALID_HASH_BYTES))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for invalid input', async () => {
      const exit = await Effect.runPromiseExit(BlockHashEffect.from('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('toHex', () => {
    it('converts BlockHash to hex string', () => {
      const hash = BlockHash.from(VALID_HASH)
      const result = BlockHashEffect.toHex(hash)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
      expect(result.length).toBe(66)
    })
  })
})
