import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as ForkId from './index.js'

describe('ForkId', () => {
  const validForkId = {
    hash: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    next: 0n
  }

  describe('Schema', () => {
    it('decodes valid fork id', () => {
      const result = Schema.decodeSync(ForkId.Schema)(validForkId)
      expect(result.hash).toBeInstanceOf(Uint8Array)
      expect(typeof result.next).toBe('bigint')
    })

    it('decodes fork id with number next', () => {
      const result = Schema.decodeSync(ForkId.Schema)({
        hash: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
        next: 15000000
      })
      expect(result.hash).toBeInstanceOf(Uint8Array)
    })

    it('encodes fork id back', () => {
      const decoded = Schema.decodeSync(ForkId.Schema)(validForkId)
      const encoded = Schema.encodeSync(ForkId.Schema)(decoded)
      expect(encoded.hash).toBeInstanceOf(Uint8Array)
    })
  })

  describe('from', () => {
    it('creates fork id from valid input', async () => {
      const result = await Effect.runPromise(ForkId.from(validForkId))
      expect(result.hash).toBeInstanceOf(Uint8Array)
      expect(typeof result.next).toBe('bigint')
    })

    it('creates fork id with future block', async () => {
      const result = await Effect.runPromise(ForkId.from({
        hash: new Uint8Array([0x11, 0x22, 0x33, 0x44]),
        next: 20000000n
      }))
      expect(result.next).toBe(20000000n)
    })
  })
})
