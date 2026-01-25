import { describe, it, expect } from 'vitest'
import { Signature as VoltaireSignature } from '@tevm/voltaire/Signature'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Signature from './index.js'

const validSigHex = '0x' + 'ab'.repeat(32) + 'cd'.repeat(32)

describe('Signature', () => {
  describe('SignatureSchema', () => {
    it('decodes valid hex string to SignatureType', () => {
      const result = Schema.decodeSync(Signature.SignatureSchema)(validSigHex)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('fails for invalid hex string', () => {
      expect(() => Schema.decodeSync(Signature.SignatureSchema)('invalid')).toThrow()
    })

    it('fails for wrong length', () => {
      expect(() => Schema.decodeSync(Signature.SignatureSchema)('0x1234')).toThrow()
    })

    it('encodes SignatureType back to string', () => {
      const sig = VoltaireSignature.fromHex(validSigHex)
      const result = Schema.encodeSync(Signature.SignatureSchema)(sig)
      expect(typeof result).toBe('string')
    })
  })

  describe('SignatureFromBytesSchema', () => {
    it('decodes 64-byte Uint8Array to SignatureType', () => {
      const bytes = new Uint8Array(64).fill(0xab)
      const result = Schema.decodeSync(Signature.SignatureFromBytesSchema)(bytes)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('fails for wrong byte length', () => {
      const bytes = new Uint8Array(63)
      expect(() => Schema.decodeSync(Signature.SignatureFromBytesSchema)(bytes)).toThrow()
    })

    it('encodes SignatureType back to bytes', () => {
      const sig = VoltaireSignature.fromHex(validSigHex)
      const result = Schema.encodeSync(Signature.SignatureFromBytesSchema)(sig)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })
  })

  describe('from', () => {
    it('creates signature from bytes', async () => {
      const bytes = new Uint8Array(64).fill(0xab)
      const result = await Effect.runPromise(Signature.from(bytes))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('fails for invalid input', async () => {
      const bytes = new Uint8Array(10)
      const exit = await Effect.runPromiseExit(Signature.from(bytes))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromHex', () => {
    it('creates signature from hex string', async () => {
      const result = await Effect.runPromise(Signature.fromHex(validSigHex))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('fails for invalid hex', async () => {
      const exit = await Effect.runPromiseExit(Signature.fromHex('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('fromBytes', () => {
    it('creates signature from 64 bytes', async () => {
      const bytes = new Uint8Array(64).fill(0xab)
      const result = await Effect.runPromise(Signature.fromBytes(bytes))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('fails for wrong length', async () => {
      const bytes = new Uint8Array(63)
      const exit = await Effect.runPromiseExit(Signature.fromBytes(bytes))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
