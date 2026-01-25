/**
 * Signers tests require WASM initialization.
 * The tests are excluded from voltaire-effect's test run because the underlying
 * Voltaire signers module uses Keccak256Wasm which requires explicit init.
 * Run from root with: pnpm vitest run voltaire-effect/src/crypto/Signers/Signers.test.ts
 */
import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Signers from './index.js'

describe('Signers', () => {
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

  describe('fromPrivateKey', () => {
    it('creates a signer from hex string with 0x prefix', async () => {
      const result = await Effect.runPromise(
        Signers.fromPrivateKey(testPrivateKey)
      )

      expect(result.address).toBeDefined()
      expect(result.address.startsWith('0x')).toBe(true)
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.publicKey.length).toBe(64)
    })

    it('creates a signer from hex string without 0x prefix', async () => {
      const result = await Effect.runPromise(
        Signers.fromPrivateKey(testPrivateKey.slice(2))
      )

      expect(result.address).toBeDefined()
      expect(result.publicKey.length).toBe(64)
    })

    it('creates a signer from Uint8Array', async () => {
      const privateKeyBytes = new Uint8Array([
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x94,
        0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
        0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80
      ])

      const result = await Effect.runPromise(
        Signers.fromPrivateKey(privateKeyBytes)
      )

      expect(result.address).toBeDefined()
      expect(result.publicKey.length).toBe(64)
    })

    it('fails with invalid private key length', async () => {
      const exit = await Effect.runPromiseExit(
        Signers.fromPrivateKey('0x1234')
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('signMessage', () => {
    it('signs a string message', async () => {
      const signer = await Effect.runPromise(
        Signers.fromPrivateKey(testPrivateKey)
      )

      const signature = await Effect.runPromise(signer.signMessage('Hello, Ethereum!'))

      expect(signature.startsWith('0x')).toBe(true)
      expect(signature.length).toBe(132)
    })

    it('signs a Uint8Array message', async () => {
      const signer = await Effect.runPromise(
        Signers.fromPrivateKey(testPrivateKey)
      )

      const message = new TextEncoder().encode('Hello')
      const signature = await Effect.runPromise(signer.signMessage(message))

      expect(signature.startsWith('0x')).toBe(true)
      expect(signature.length).toBe(132)
    })

    it('produces deterministic signatures', async () => {
      const signer = await Effect.runPromise(
        Signers.fromPrivateKey(testPrivateKey)
      )

      const sig1 = await Effect.runPromise(signer.signMessage('test'))
      const sig2 = await Effect.runPromise(signer.signMessage('test'))

      expect(sig1).toEqual(sig2)
    })
  })

  describe('signTypedData', () => {
    it('signs EIP-712 typed data', async () => {
      const signer = await Effect.runPromise(
        Signers.fromPrivateKey(testPrivateKey)
      )

      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' }
          ],
          Message: [{ name: 'content', type: 'string' }]
        },
        primaryType: 'Message',
        domain: { name: 'MyApp', version: '1' },
        message: { content: 'Hello' }
      }

      const signature = await Effect.runPromise(signer.signTypedData(typedData))

      expect(signature.startsWith('0x')).toBe(true)
      expect(signature.length).toBe(132)
    })
  })

  describe('getSignerAddress', () => {
    it('returns the signer address', async () => {
      const signer = await Effect.runPromise(
        Signers.fromPrivateKey(testPrivateKey)
      )

      const address = await Effect.runPromise(Signers.getAddress(signer))

      expect(address).toBe(signer.address)
    })
  })

  describe('SignersService', () => {
    it('provides fromPrivateKey through service layer', async () => {
      const program = Effect.gen(function* () {
        const signers = yield* Signers.SignersService
        return yield* signers.fromPrivateKey(testPrivateKey)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Signers.SignersLive))
      )

      expect(result.address).toBeDefined()
      expect(result.publicKey.length).toBe(64)
    })

    it('provides getAddress through service layer', async () => {
      const signer = await Effect.runPromise(
        Signers.fromPrivateKey(testPrivateKey)
      )

      const program = Effect.gen(function* () {
        const signers = yield* Signers.SignersService
        return yield* signers.getAddress(signer)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Signers.SignersLive))
      )

      expect(result).toBe(signer.address)
    })

    it('works with test layer', async () => {
      const program = Effect.gen(function* () {
        const signers = yield* Signers.SignersService
        return yield* signers.fromPrivateKey('0x' + '00'.repeat(32))
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Signers.SignersTest))
      )

      expect(result.address).toBe('0x0000000000000000000000000000000000000000')
    })
  })
})
