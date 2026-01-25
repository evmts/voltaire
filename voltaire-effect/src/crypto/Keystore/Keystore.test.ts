import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Keystore from './index.js'

describe('Keystore', () => {
  const testPrivateKey = new Uint8Array([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
    0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
    0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20
  ]) as any

  const testPassword = 'test-password-123'

  describe('encrypt', () => {
    it('encrypts a private key to keystore v3 format', async () => {
      const result = await Effect.runPromise(
        Keystore.encrypt(testPrivateKey, testPassword, {
          scryptN: 1024,
          scryptR: 8,
          scryptP: 1
        })
      )

      expect(result.version).toBe(3)
      expect(result.id).toBeDefined()
      expect(result.crypto.cipher).toBe('aes-128-ctr')
      expect(result.crypto.kdf).toBe('scrypt')
      expect(result.crypto.ciphertext).toBeDefined()
      expect(result.crypto.mac).toBeDefined()
    })

    it('supports pbkdf2 kdf', async () => {
      const result = await Effect.runPromise(
        Keystore.encrypt(testPrivateKey, testPassword, {
          kdf: 'pbkdf2',
          pbkdf2C: 1000
        })
      )

      expect(result.crypto.kdf).toBe('pbkdf2')
      expect((result.crypto.kdfparams as any).c).toBe(1000)
    })
  })

  describe('decrypt', () => {
    it('decrypts keystore back to original private key', async () => {
      const encrypted = await Effect.runPromise(
        Keystore.encrypt(testPrivateKey, testPassword, {
          scryptN: 1024,
          scryptR: 8,
          scryptP: 1
        })
      )

      const decrypted = await Effect.runPromise(
        Keystore.decrypt(encrypted, testPassword)
      )

      expect(decrypted).toEqual(testPrivateKey)
    })

    it('fails with wrong password', async () => {
      const encrypted = await Effect.runPromise(
        Keystore.encrypt(testPrivateKey, testPassword, {
          scryptN: 1024,
          scryptR: 8,
          scryptP: 1
        })
      )

      const exit = await Effect.runPromiseExit(
        Keystore.decrypt(encrypted, 'wrong-password')
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails with unsupported version', async () => {
      const badKeystore = {
        version: 2 as any,
        id: 'test',
        crypto: {
          cipher: 'aes-128-ctr' as const,
          ciphertext: '00',
          cipherparams: { iv: '00' },
          kdf: 'scrypt' as const,
          kdfparams: { dklen: 32, n: 1024, r: 8, p: 1, salt: '00' },
          mac: '00'
        }
      }

      const exit = await Effect.runPromiseExit(
        Keystore.decrypt(badKeystore as any, testPassword)
      )

      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('KeystoreService', () => {
    it('provides encrypt through service layer', async () => {
      const program = Effect.gen(function* () {
        const keystore = yield* Keystore.KeystoreService
        return yield* keystore.encrypt(testPrivateKey, testPassword, {
          scryptN: 1024
        })
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Keystore.KeystoreLive))
      )

      expect(result.version).toBe(3)
      expect(result.crypto.cipher).toBe('aes-128-ctr')
    })

    it('provides decrypt through service layer', async () => {
      const encrypted = await Effect.runPromise(
        Keystore.encrypt(testPrivateKey, testPassword, {
          scryptN: 1024
        })
      )

      const program = Effect.gen(function* () {
        const keystore = yield* Keystore.KeystoreService
        return yield* keystore.decrypt(encrypted, testPassword)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Keystore.KeystoreLive))
      )

      expect(result).toEqual(testPrivateKey)
    })

    it('test layer returns mock data', async () => {
      const program = Effect.gen(function* () {
        const keystore = yield* Keystore.KeystoreService
        return yield* keystore.encrypt(testPrivateKey, testPassword)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Keystore.KeystoreTest))
      )

      expect(result.version).toBe(3)
      expect(result.id).toBe('test-uuid')
    })
  })

  describe('roundtrip', () => {
    it('encrypts and decrypts with scrypt', async () => {
      const encrypted = await Effect.runPromise(
        Keystore.encrypt(testPrivateKey, testPassword, {
          scryptN: 1024,
          scryptR: 8,
          scryptP: 1
        })
      )

      const decrypted = await Effect.runPromise(
        Keystore.decrypt(encrypted, testPassword)
      )

      expect(decrypted).toEqual(testPrivateKey)
    })

    it('encrypts and decrypts with pbkdf2', async () => {
      const encrypted = await Effect.runPromise(
        Keystore.encrypt(testPrivateKey, testPassword, {
          kdf: 'pbkdf2',
          pbkdf2C: 1000
        })
      )

      const decrypted = await Effect.runPromise(
        Keystore.decrypt(encrypted, testPassword)
      )

      expect(decrypted).toEqual(testPrivateKey)
    })
  })
})
