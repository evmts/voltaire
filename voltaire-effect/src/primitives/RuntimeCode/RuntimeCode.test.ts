import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as RuntimeCode from './index.js'

describe('RuntimeCode', () => {
  describe('Schema', () => {
    it('decodes hex string', () => {
      const result = Schema.decodeSync(RuntimeCode.Schema)('0x6001600155')
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('decodes Uint8Array', () => {
      const input = new Uint8Array([0x60, 0x01])
      const result = Schema.decodeSync(RuntimeCode.Schema)(input)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('encodes back to hex', () => {
      const decoded = Schema.decodeSync(RuntimeCode.Schema)('0xabcd')
      const encoded = Schema.encodeSync(RuntimeCode.Schema)(decoded)
      expect(encoded).toBe('0xabcd')
    })
  })

  describe('from', () => {
    it('creates from hex string', async () => {
      const result = await Effect.runPromise(RuntimeCode.from('0x6001'))
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('creates from Uint8Array', async () => {
      const result = await Effect.runPromise(RuntimeCode.from(new Uint8Array([0x60, 0x01])))
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('fromHex', () => {
    it('creates from hex string', async () => {
      const result = await Effect.runPromise(RuntimeCode.fromHex('0x6001'))
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })
})
