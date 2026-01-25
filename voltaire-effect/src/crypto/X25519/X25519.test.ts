import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as X25519Effect from './index.js'
import * as VoltaireX25519 from '@tevm/voltaire/X25519'

describe('X25519', () => {
  const testSeed = new Uint8Array(32).fill(0x42)
  const testKeypair = VoltaireX25519.keypairFromSeed(testSeed)

  describe('generateKeyPair', () => {
    it('generates a valid keypair', async () => {
      const result = await Effect.runPromise(X25519Effect.generateKeyPair())

      expect(result.secretKey).toBeInstanceOf(Uint8Array)
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.secretKey.length).toBe(32)
      expect(result.publicKey.length).toBe(32)
    })

    it('generates different keypairs each time', async () => {
      const kp1 = await Effect.runPromise(X25519Effect.generateKeyPair())
      const kp2 = await Effect.runPromise(X25519Effect.generateKeyPair())

      expect(kp1.secretKey).not.toEqual(kp2.secretKey)
      expect(kp1.publicKey).not.toEqual(kp2.publicKey)
    })
  })

  describe('getPublicKey', () => {
    it('derives public key from secret key', async () => {
      const result = await Effect.runPromise(
        X25519Effect.getPublicKey(testKeypair.secretKey)
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
      expect(result).toEqual(testKeypair.publicKey)
    })

    it('fails with wrong key length', async () => {
      const wrongKey = new Uint8Array(16)
      const exit = await Effect.runPromiseExit(
        X25519Effect.getPublicKey(wrongKey)
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('computeSecret', () => {
    it('computes shared secret between two parties', async () => {
      const seed1 = new Uint8Array(32).fill(0x11)
      const seed2 = new Uint8Array(32).fill(0x22)
      const alice = VoltaireX25519.keypairFromSeed(seed1)
      const bob = VoltaireX25519.keypairFromSeed(seed2)

      const sharedAlice = await Effect.runPromise(
        X25519Effect.computeSecret(alice.secretKey, bob.publicKey)
      )
      const sharedBob = await Effect.runPromise(
        X25519Effect.computeSecret(bob.secretKey, alice.publicKey)
      )

      expect(sharedAlice).toBeInstanceOf(Uint8Array)
      expect(sharedAlice.length).toBe(32)
      expect(sharedAlice).toEqual(sharedBob)
    })

    it('fails with invalid secret key length', async () => {
      const wrongKey = new Uint8Array(16)
      const exit = await Effect.runPromiseExit(
        X25519Effect.computeSecret(wrongKey, testKeypair.publicKey)
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails with invalid public key length', async () => {
      const wrongPub = new Uint8Array(16)
      const exit = await Effect.runPromiseExit(
        X25519Effect.computeSecret(testKeypair.secretKey, wrongPub)
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('X25519Service', () => {
    it('provides generateKeyPair through service layer', async () => {
      const program = Effect.gen(function* () {
        const x = yield* X25519Effect.X25519Service
        return yield* x.generateKeyPair()
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(X25519Effect.X25519Live))
      )

      expect(result.secretKey).toBeInstanceOf(Uint8Array)
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.secretKey.length).toBe(32)
      expect(result.publicKey.length).toBe(32)
    })

    it('provides getPublicKey through service layer', async () => {
      const program = Effect.gen(function* () {
        const x = yield* X25519Effect.X25519Service
        return yield* x.getPublicKey(testKeypair.secretKey)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(X25519Effect.X25519Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
      expect(result).toEqual(testKeypair.publicKey)
    })

    it('provides computeSecret through service layer', async () => {
      const seed1 = new Uint8Array(32).fill(0x33)
      const seed2 = new Uint8Array(32).fill(0x44)
      const alice = VoltaireX25519.keypairFromSeed(seed1)
      const bob = VoltaireX25519.keypairFromSeed(seed2)

      const program = Effect.gen(function* () {
        const x = yield* X25519Effect.X25519Service
        const sharedAlice = yield* x.computeSecret(alice.secretKey, bob.publicKey)
        const sharedBob = yield* x.computeSecret(bob.secretKey, alice.publicKey)
        return { sharedAlice, sharedBob }
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(X25519Effect.X25519Live))
      )

      expect(result.sharedAlice).toEqual(result.sharedBob)
    })
  })

  describe('X25519Test', () => {
    it('returns mock keypair', async () => {
      const program = Effect.gen(function* () {
        const x = yield* X25519Effect.X25519Service
        return yield* x.generateKeyPair()
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(X25519Effect.X25519Test))
      )

      expect(result.secretKey).toBeInstanceOf(Uint8Array)
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.secretKey.length).toBe(32)
      expect(result.publicKey.length).toBe(32)
      expect(result.secretKey.every(b => b === 0)).toBe(true)
      expect(result.publicKey.every(b => b === 0)).toBe(true)
    })

    it('returns mock public key', async () => {
      const program = Effect.gen(function* () {
        const x = yield* X25519Effect.X25519Service
        return yield* x.getPublicKey(testKeypair.secretKey)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(X25519Effect.X25519Test))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
      expect(result.every(b => b === 0)).toBe(true)
    })

    it('returns mock shared secret', async () => {
      const program = Effect.gen(function* () {
        const x = yield* X25519Effect.X25519Service
        return yield* x.computeSecret(testKeypair.secretKey, testKeypair.publicKey)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(X25519Effect.X25519Test))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
      expect(result.every(b => b === 0)).toBe(true)
    })
  })
})
