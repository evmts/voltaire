import * as Effect from 'effect/Effect'
import { Bip39Service } from './Bip39Service.js'

/**
 * Generates a random BIP-39 mnemonic phrase.
 *
 * @param strength - Entropy bits (128=12 words, 256=24 words)
 * @returns Effect containing the mnemonic string, requiring Bip39Service
 * @since 0.0.1
 */
export const generateMnemonic = (strength?: 128 | 160 | 192 | 224 | 256): Effect.Effect<string, never, Bip39Service> =>
  Effect.gen(function* () {
    const bip39 = yield* Bip39Service
    return yield* bip39.generateMnemonic(strength)
  })

/**
 * Validates a BIP-39 mnemonic phrase.
 *
 * @param mnemonic - The mnemonic string to validate
 * @returns Effect containing true if valid, requiring Bip39Service
 * @since 0.0.1
 */
export const validateMnemonic = (mnemonic: string): Effect.Effect<boolean, never, Bip39Service> =>
  Effect.gen(function* () {
    const bip39 = yield* Bip39Service
    return yield* bip39.validateMnemonic(mnemonic)
  })

/**
 * Converts a mnemonic to a seed asynchronously.
 *
 * @param mnemonic - The mnemonic string
 * @param passphrase - Optional passphrase for additional security
 * @returns Effect containing the 64-byte seed, requiring Bip39Service
 * @since 0.0.1
 */
export const mnemonicToSeed = (mnemonic: string, passphrase?: string): Effect.Effect<Uint8Array, never, Bip39Service> =>
  Effect.gen(function* () {
    const bip39 = yield* Bip39Service
    return yield* bip39.mnemonicToSeed(mnemonic, passphrase)
  })

/**
 * Converts a mnemonic to a seed synchronously.
 *
 * @param mnemonic - The mnemonic string
 * @param passphrase - Optional passphrase for additional security
 * @returns Effect containing the 64-byte seed, requiring Bip39Service
 * @since 0.0.1
 */
export const mnemonicToSeedSync = (mnemonic: string, passphrase?: string): Effect.Effect<Uint8Array, never, Bip39Service> =>
  Effect.gen(function* () {
    const bip39 = yield* Bip39Service
    return yield* bip39.mnemonicToSeedSync(mnemonic, passphrase)
  })

/**
 * Returns the word count for a given entropy strength.
 *
 * @param entropyBits - The entropy in bits (128, 160, 192, 224, or 256)
 * @returns Effect containing the word count, requiring Bip39Service
 * @since 0.0.1
 */
export const getWordCount = (entropyBits: 128 | 160 | 192 | 224 | 256): Effect.Effect<number, never, Bip39Service> =>
  Effect.gen(function* () {
    const bip39 = yield* Bip39Service
    return yield* bip39.getWordCount(entropyBits)
  })
