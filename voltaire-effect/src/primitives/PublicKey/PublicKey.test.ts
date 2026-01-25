import { describe, it, expect } from 'vitest'
import { PublicKey as VoltairePublicKey } from '@tevm/voltaire/PublicKey'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as PublicKey from './index.js'

const validPkHex = '0x' + 'ab'.repeat(64)

describe('PublicKey', () => {
  describe('PublicKeySchema', () => {
    it('decodes valid hex string to PublicKeyType', () => {
      const result = Schema.decodeSync(PublicKey.PublicKeySchema)(validPkHex)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('fails for invalid hex string', () => {
      expect(() => Schema.decodeSync(PublicKey.PublicKeySchema)('invalid')).toThrow()
    })

    it('fails for wrong length', () => {
      expect(() => Schema.decodeSync(PublicKey.PublicKeySchema)('0x1234')).toThrow()
    })

    it('encodes PublicKeyType back to string', () => {
      const pk = VoltairePublicKey.from(validPkHex)
      const result = Schema.encodeSync(PublicKey.PublicKeySchema)(pk)
      expect(typeof result).toBe('string')
    })
  })

  describe('PublicKeyFromBytesSchema', () => {
    it('decodes 64-byte Uint8Array to PublicKeyType', () => {
      const bytes = new Uint8Array(64).fill(0xab)
      const result = Schema.decodeSync(PublicKey.PublicKeyFromBytesSchema)(bytes)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('fails for wrong byte length', () => {
      const bytes = new Uint8Array(63)
      expect(() => Schema.decodeSync(PublicKey.PublicKeyFromBytesSchema)(bytes)).toThrow()
    })

    it('encodes PublicKeyType back to bytes', () => {
      const pk = VoltairePublicKey.from(validPkHex)
      const result = Schema.encodeSync(PublicKey.PublicKeyFromBytesSchema)(pk)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })
  })

  describe('from', () => {
    it('creates public key from hex string', async () => {
      const result = await Effect.runPromise(PublicKey.from(validPkHex))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('fails for invalid input', async () => {
      const exit = await Effect.runPromiseExit(PublicKey.from('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromPrivateKey', () => {
    it('derives public key from private key', async () => {
      const privateKeyHex = '0x' + 'ab'.repeat(32)
      const result = await Effect.runPromise(PublicKey.fromPrivateKey(privateKeyHex))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })
  })

  describe('compress/decompress', () => {
    it('compresses and decompresses a public key', async () => {
      const pk = VoltairePublicKey.from(validPkHex)
      const compressed = await Effect.runPromise(PublicKey.compress(pk))
      expect(compressed.length).toBe(33)
      
      const decompressed = await Effect.runPromise(PublicKey.decompress(compressed))
      expect(decompressed.length).toBe(64)
    })
  })
})
