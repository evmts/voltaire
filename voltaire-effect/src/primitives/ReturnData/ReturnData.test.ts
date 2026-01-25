import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as ReturnData from './index.js'

describe('ReturnData', () => {
  describe('Schema', () => {
    it('decodes hex string', () => {
      const result = Schema.decodeSync(ReturnData.Schema)('0x1234')
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('decodes Uint8Array', () => {
      const input = new Uint8Array([1, 2, 3])
      const result = Schema.decodeSync(ReturnData.Schema)(input)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('encodes back to hex', () => {
      const decoded = Schema.decodeSync(ReturnData.Schema)('0xabcd')
      const encoded = Schema.encodeSync(ReturnData.Schema)(decoded)
      expect(encoded).toBe('0xabcd')
    })
  })

  describe('from', () => {
    it('creates from hex string', async () => {
      const result = await Effect.runPromise(ReturnData.from('0x1234'))
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('creates from Uint8Array', async () => {
      const result = await Effect.runPromise(ReturnData.from(new Uint8Array([1, 2])))
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('fromHex', () => {
    it('creates from hex string', async () => {
      const result = await Effect.runPromise(ReturnData.fromHex('0xaabb'))
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })
})
