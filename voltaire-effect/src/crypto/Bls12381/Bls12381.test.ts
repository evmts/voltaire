import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Bls12381Effect from './index.js'
import * as VoltaireBls12381 from '@tevm/voltaire/Bls12381'

describe('Bls12381', () => {
  const testPrivateKey = VoltaireBls12381.randomPrivateKey()
  const testPublicKey = VoltaireBls12381.derivePublicKey(testPrivateKey)
  const testMessage = new TextEncoder().encode('Hello, Ethereum!')

  describe('sign', () => {
    it('signs a message with a private key', async () => {
      const result = await Effect.runPromise(
        Bls12381Effect.sign(testMessage, testPrivateKey)
      )
      
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(48)
    })

    it('produces deterministic signatures', async () => {
      const sig1 = await Effect.runPromise(
        Bls12381Effect.sign(testMessage, testPrivateKey)
      )
      const sig2 = await Effect.runPromise(
        Bls12381Effect.sign(testMessage, testPrivateKey)
      )
      
      expect(sig1).toEqual(sig2)
    })

    it('fails with zero private key', async () => {
      const zeroKey = new Uint8Array(32)
      const exit = await Effect.runPromiseExit(
        Bls12381Effect.sign(testMessage, zeroKey)
      )
      
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('verify', () => {
    it('verifies a valid signature', async () => {
      const signature = await Effect.runPromise(
        Bls12381Effect.sign(testMessage, testPrivateKey)
      )
      
      const isValid = await Effect.runPromise(
        Bls12381Effect.verify(signature, testMessage, testPublicKey)
      )
      
      expect(isValid).toBe(true)
    })

    it('returns false for wrong message', async () => {
      const signature = await Effect.runPromise(
        Bls12381Effect.sign(testMessage, testPrivateKey)
      )
      const wrongMessage = new TextEncoder().encode('Wrong message')
      
      const isValid = await Effect.runPromise(
        Bls12381Effect.verify(signature, wrongMessage, testPublicKey)
      )
      
      expect(isValid).toBe(false)
    })

    it('returns false for wrong public key', async () => {
      const signature = await Effect.runPromise(
        Bls12381Effect.sign(testMessage, testPrivateKey)
      )
      const otherPrivateKey = VoltaireBls12381.randomPrivateKey()
      const wrongPublicKey = VoltaireBls12381.derivePublicKey(otherPrivateKey)
      
      const isValid = await Effect.runPromise(
        Bls12381Effect.verify(signature, testMessage, wrongPublicKey)
      )
      
      expect(isValid).toBe(false)
    })
  })

  describe('aggregate', () => {
    it('aggregates multiple signatures', async () => {
      const pk1 = VoltaireBls12381.randomPrivateKey()
      const pk2 = VoltaireBls12381.randomPrivateKey()
      
      const sig1 = await Effect.runPromise(Bls12381Effect.sign(testMessage, pk1))
      const sig2 = await Effect.runPromise(Bls12381Effect.sign(testMessage, pk2))
      
      const aggSig = await Effect.runPromise(
        Bls12381Effect.aggregate([sig1, sig2])
      )
      
      expect(aggSig).toBeInstanceOf(Uint8Array)
      expect(aggSig.length).toBe(48)
    })

    it('fails with empty array', async () => {
      const exit = await Effect.runPromiseExit(
        Bls12381Effect.aggregate([])
      )
      
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('Bls12381Service', () => {
    it('provides sign through service layer', async () => {
      const program = Effect.gen(function* () {
        const bls = yield* Bls12381Effect.Bls12381Service
        return yield* bls.sign(testMessage, testPrivateKey)
      })
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bls12381Effect.Bls12381Live))
      )
      
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(48)
    })

    it('provides verify through service layer', async () => {
      const signature = await Effect.runPromise(
        Bls12381Effect.sign(testMessage, testPrivateKey)
      )
      
      const program = Effect.gen(function* () {
        const bls = yield* Bls12381Effect.Bls12381Service
        return yield* bls.verify(signature, testMessage, testPublicKey)
      })
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bls12381Effect.Bls12381Live))
      )
      
      expect(result).toBe(true)
    })

    it('provides aggregate through service layer', async () => {
      const pk1 = VoltaireBls12381.randomPrivateKey()
      const sig1 = await Effect.runPromise(Bls12381Effect.sign(testMessage, pk1))
      const sig2 = await Effect.runPromise(Bls12381Effect.sign(testMessage, testPrivateKey))
      
      const program = Effect.gen(function* () {
        const bls = yield* Bls12381Effect.Bls12381Service
        return yield* bls.aggregate([sig1, sig2])
      })
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bls12381Effect.Bls12381Live))
      )
      
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })
})
