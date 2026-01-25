import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as ProtocolVersion from './index.js'

describe('ProtocolVersion', () => {
  describe('Schema', () => {
    it('decodes valid protocol version', () => {
      const result = Schema.decodeSync(ProtocolVersion.Schema)('eth/67')
      expect(result).toBe('eth/67')
    })

    it('decodes snap protocol', () => {
      const result = Schema.decodeSync(ProtocolVersion.Schema)('snap/1')
      expect(result).toBe('snap/1')
    })

    it('fails for invalid format', () => {
      expect(() => Schema.decodeSync(ProtocolVersion.Schema)('invalid')).toThrow()
    })

    it('encodes back to string', () => {
      const pv = Schema.decodeSync(ProtocolVersion.Schema)('eth/68')
      const encoded = Schema.encodeSync(ProtocolVersion.Schema)(pv)
      expect(encoded).toBe('eth/68')
    })
  })

  describe('from', () => {
    it('creates protocol version from valid string', async () => {
      const result = await Effect.runPromise(ProtocolVersion.from('eth/67'))
      expect(result).toBe('eth/67')
    })

    it('fails for invalid format', async () => {
      const exit = await Effect.runPromiseExit(ProtocolVersion.from('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
