import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { Bip39Service, Bip39Live, Bip39Test, generateMnemonic, validateMnemonic, mnemonicToSeed, getWordCount } from './index.js'

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe('Bip39Service', () => {
  describe('Bip39Live', () => {
    it('generates 12-word mnemonic (128 bits)', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.generateMnemonic(128)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Live))
      )

      expect(typeof result).toBe('string')
      expect(result.split(' ').length).toBe(12)
    })

    it('generates 24-word mnemonic (256 bits)', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.generateMnemonic(256)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Live))
      )

      expect(result.split(' ').length).toBe(24)
    })

    it('validates known valid mnemonic', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.validateMnemonic(TEST_MNEMONIC)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Live))
      )

      expect(result).toBe(true)
    })

    it('rejects invalid mnemonic', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.validateMnemonic('invalid mnemonic phrase')
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Live))
      )

      expect(result).toBe(false)
    })

    it('converts mnemonic to seed', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.mnemonicToSeed(TEST_MNEMONIC)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })

    it('converts mnemonic to seed with passphrase', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        const seedWithPass = yield* bip39.mnemonicToSeed(TEST_MNEMONIC, 'password')
        const seedWithoutPass = yield* bip39.mnemonicToSeed(TEST_MNEMONIC)
        return { seedWithPass, seedWithoutPass }
      })

      const { seedWithPass, seedWithoutPass } = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Live))
      )

      expect(seedWithPass.length).toBe(64)
      expect(seedWithoutPass.length).toBe(64)
      expect(Buffer.from(seedWithPass).toString('hex')).not.toBe(Buffer.from(seedWithoutPass).toString('hex'))
    })

    it('gets word count from entropy bits', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.getWordCount(128)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Live))
      )

      expect(result).toBe(12)
    })

    it('gets word count for 256 bits', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.getWordCount(256)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Live))
      )

      expect(result).toBe(24)
    })
  })

  describe('Bip39Test', () => {
    it('returns test mnemonic', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.generateMnemonic()
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Test))
      )

      expect(result).toBe(TEST_MNEMONIC)
    })

    it('always validates as true', async () => {
      const program = Effect.gen(function* () {
        const bip39 = yield* Bip39Service
        return yield* bip39.validateMnemonic('anything')
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(Bip39Test))
      )

      expect(result).toBe(true)
    })
  })
})

describe('convenience functions', () => {
  it('generateMnemonic works with service dependency', async () => {
    const result = await Effect.runPromise(
      generateMnemonic(128).pipe(Effect.provide(Bip39Live))
    )
    expect(result.split(' ').length).toBe(12)
  })

  it('validateMnemonic works with service dependency', async () => {
    const result = await Effect.runPromise(
      validateMnemonic(TEST_MNEMONIC).pipe(Effect.provide(Bip39Live))
    )
    expect(result).toBe(true)
  })

  it('mnemonicToSeed works with service dependency', async () => {
    const result = await Effect.runPromise(
      mnemonicToSeed(TEST_MNEMONIC).pipe(Effect.provide(Bip39Live))
    )
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(64)
  })

  it('getWordCount works with service dependency', async () => {
    const result = await Effect.runPromise(
      getWordCount(128).pipe(Effect.provide(Bip39Live))
    )
    expect(result).toBe(12)
  })
})
