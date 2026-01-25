import { describe, it, expect } from 'vitest'
import { PrivateKey as VoltairePrivateKey } from '@tevm/voltaire/PrivateKey'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as PrivateKey from './index.js'

const validPkHex = '0x' + 'ab'.repeat(32)

describe('PrivateKey', () => {
  describe('PrivateKeySchema', () => {
    it('decodes valid hex string to PrivateKeyType', () => {
      const result = Schema.decodeSync(PrivateKey.PrivateKeySchema)(validPkHex)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for invalid hex string', () => {
      expect(() => Schema.decodeSync(PrivateKey.PrivateKeySchema)('invalid')).toThrow()
    })

    it('fails for wrong length', () => {
      expect(() => Schema.decodeSync(PrivateKey.PrivateKeySchema)('0x1234')).toThrow()
    })

    it('encodes PrivateKeyType back to string', () => {
      const pk = VoltairePrivateKey.from(validPkHex)
      const result = Schema.encodeSync(PrivateKey.PrivateKeySchema)(pk)
      expect(typeof result).toBe('string')
    })
  })

  describe('PrivateKeyFromBytesSchema', () => {
    it('decodes 32-byte Uint8Array to PrivateKeyType', () => {
      const bytes = new Uint8Array(32).fill(0xab)
      const result = Schema.decodeSync(PrivateKey.PrivateKeyFromBytesSchema)(bytes)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for wrong byte length', () => {
      const bytes = new Uint8Array(31)
      expect(() => Schema.decodeSync(PrivateKey.PrivateKeyFromBytesSchema)(bytes)).toThrow()
    })

    it('encodes PrivateKeyType back to bytes', () => {
      const pk = VoltairePrivateKey.from(validPkHex)
      const result = Schema.encodeSync(PrivateKey.PrivateKeyFromBytesSchema)(pk)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })
  })

  describe('from', () => {
    it('creates private key from hex string', async () => {
      const result = await Effect.runPromise(PrivateKey.from(validPkHex))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for invalid input', async () => {
      const exit = await Effect.runPromiseExit(PrivateKey.from('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromBytes', () => {
    it('creates private key from 32 bytes', async () => {
      const bytes = new Uint8Array(32).fill(0xab)
      const result = await Effect.runPromise(PrivateKey.fromBytes(bytes))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for wrong length', async () => {
      const bytes = new Uint8Array(31)
      const exit = await Effect.runPromiseExit(PrivateKey.fromBytes(bytes))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
