import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Secp256k1 from './index.js'
import * as VoltaireSecp256k1 from '@tevm/voltaire/Secp256k1'
import { Hash } from '@tevm/voltaire'
import type { HashType } from '@tevm/voltaire/Hash'

describe('Secp256k1', () => {
  const testPrivateKeyBytes = new Uint8Array([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
    0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
    0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20
  ])

  const testMessageHashBytes = new Uint8Array([
    0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11,
    0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99,
    0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11,
    0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99
  ])
  const testMessageHash = Hash.from(testMessageHashBytes)

  describe('sign', () => {
    it('signs a message hash with a private key', async () => {
      const result = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      
      expect(result).toHaveProperty('r')
      expect(result).toHaveProperty('s')
      expect(result).toHaveProperty('v')
      expect(result.r.length).toBe(32)
      expect(result.s.length).toBe(32)
      expect([27, 28]).toContain(result.v)
    })

    it('produces deterministic signatures (RFC 6979)', async () => {
      const sig1 = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      const sig2 = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      
      expect(sig1.r).toEqual(sig2.r)
      expect(sig1.s).toEqual(sig2.s)
      expect(sig1.v).toEqual(sig2.v)
    })

    it('fails with zero private key', async () => {
      const zeroKey = new Uint8Array(32)
      const exit = await Effect.runPromiseExit(
        Secp256k1.sign(testMessageHash, zeroKey as any)
      )
      
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('recover', () => {
    it('recovers public key from signature', async () => {
      const signature = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      
      const recovered = await Effect.runPromise(
        Secp256k1.recover(signature, testMessageHash)
      )
      
      expect(recovered.length).toBe(64)
      
      const expected = VoltaireSecp256k1.derivePublicKey(testPrivateKeyBytes as any)
      expect(recovered).toEqual(expected)
    })

    it('fails with invalid v value', async () => {
      const badSignature = {
        r: Hash.from(new Uint8Array(32).fill(1)),
        s: Hash.from(new Uint8Array(32).fill(2)),
        v: 99
      }
      
      const exit = await Effect.runPromiseExit(
        Secp256k1.recover(badSignature, testMessageHash)
      )
      
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('verify', () => {
    it('verifies a valid signature', async () => {
      const signature = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      const publicKey = VoltaireSecp256k1.derivePublicKey(testPrivateKeyBytes as any)
      
      const isValid = await Effect.runPromise(
        Secp256k1.verify(signature, testMessageHash, publicKey)
      )
      
      expect(isValid).toBe(true)
    })

    it('returns false for wrong message hash', async () => {
      const signature = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      const publicKey = VoltaireSecp256k1.derivePublicKey(testPrivateKeyBytes as any)
      const wrongHash = Hash.from(new Uint8Array(32).fill(0xff))
      
      const isValid = await Effect.runPromise(
        Secp256k1.verify(signature, wrongHash, publicKey)
      )
      
      expect(isValid).toBe(false)
    })

    it('returns false for wrong public key', async () => {
      const signature = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      const otherKey = new Uint8Array(32).fill(0x42)
      const wrongPublicKey = VoltaireSecp256k1.derivePublicKey(otherKey as any)
      
      const isValid = await Effect.runPromise(
        Secp256k1.verify(signature, testMessageHash, wrongPublicKey)
      )
      
      expect(isValid).toBe(false)
    })
  })

  describe('Secp256k1Service', () => {
    it('provides sign through service layer', async () => {
      const program = Effect.gen(function* () {
        const secp = yield* Secp256k1.Secp256k1Service
        return yield* secp.sign(testMessageHash, testPrivateKeyBytes as any)
      })
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Secp256k1.Secp256k1Live))
      )
      
      expect(result).toHaveProperty('r')
      expect(result).toHaveProperty('s')
      expect(result).toHaveProperty('v')
    })

    it('provides recover through service layer', async () => {
      const signature = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      
      const program = Effect.gen(function* () {
        const secp = yield* Secp256k1.Secp256k1Service
        return yield* secp.recover(signature, testMessageHash)
      })
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Secp256k1.Secp256k1Live))
      )
      
      expect(result.length).toBe(64)
    })

    it('provides verify through service layer', async () => {
      const signature = await Effect.runPromise(
        Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any)
      )
      const publicKey = VoltaireSecp256k1.derivePublicKey(testPrivateKeyBytes as any)
      
      const program = Effect.gen(function* () {
        const secp = yield* Secp256k1.Secp256k1Service
        return yield* secp.verify(signature, testMessageHash, publicKey)
      })
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Secp256k1.Secp256k1Live))
      )
      
      expect(result).toBe(true)
    })
  })
})
