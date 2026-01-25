import * as Effect from 'effect/Effect'
import { HDWalletService, type HDNode, type HDPath } from './HDWalletService.js'

/**
 * Derives a child HD node from a parent node using the given path.
 *
 * @param node - The parent HD node
 * @param path - Derivation path (e.g., "m/44'/60'/0'/0/0" or array of indices)
 * @returns Effect containing the derived child node, requiring HDWalletService
 * @example
 * ```typescript
 * import { derive, fromSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const master = yield* fromSeed(seed)
 *   return yield* derive(master, "m/44'/60'/0'/0/0")
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 * @since 0.0.1
 */
export const derive = (node: HDNode, path: string | HDPath): Effect.Effect<HDNode, never, HDWalletService> =>
  Effect.gen(function* () {
    const hdwallet = yield* HDWalletService
    return yield* hdwallet.derive(node, path)
  })

/**
 * Generates a new random BIP-39 mnemonic phrase.
 *
 * @param strength - Entropy bits (128 = 12 words, 256 = 24 words)
 * @returns Effect containing the mnemonic word array, requiring HDWalletService
 * @example
 * ```typescript
 * import { generateMnemonic, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = generateMnemonic(128).pipe(Effect.provide(HDWalletLive))
 * ```
 * @since 0.0.1
 */
export const generateMnemonic = (strength: 128 | 256 = 128): Effect.Effect<string[], never, HDWalletService> =>
  Effect.gen(function* () {
    const hdwallet = yield* HDWalletService
    return yield* hdwallet.generateMnemonic(strength)
  })

/**
 * Creates a master HD node from a seed.
 *
 * @param seed - The 64-byte seed from mnemonic
 * @returns Effect containing the master HD node, requiring HDWalletService
 * @example
 * ```typescript
 * import { fromSeed, mnemonicToSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const seed = yield* mnemonicToSeed(mnemonic)
 *   return yield* fromSeed(seed)
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 * @since 0.0.1
 */
export const fromSeed = (seed: Uint8Array): Effect.Effect<HDNode, never, HDWalletService> =>
  Effect.gen(function* () {
    const hdwallet = yield* HDWalletService
    return yield* hdwallet.fromSeed(seed)
  })

/**
 * Converts a mnemonic phrase to a 64-byte seed.
 *
 * @param mnemonic - Array of mnemonic words
 * @returns Effect containing the 64-byte seed, requiring HDWalletService
 * @example
 * ```typescript
 * import { mnemonicToSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = mnemonicToSeed(['abandon', ...]).pipe(Effect.provide(HDWalletLive))
 * ```
 * @since 0.0.1
 */
export const mnemonicToSeed = (mnemonic: string[]): Effect.Effect<Uint8Array, never, HDWalletService> =>
  Effect.gen(function* () {
    const hdwallet = yield* HDWalletService
    return yield* hdwallet.mnemonicToSeed(mnemonic)
  })

/**
 * Extracts the private key from an HD node.
 *
 * @param node - The HD node
 * @returns Effect containing the 32-byte private key or null, requiring HDWalletService
 * @example
 * ```typescript
 * import { getPrivateKey, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = getPrivateKey(node).pipe(Effect.provide(HDWalletLive))
 * ```
 * @since 0.0.1
 */
export const getPrivateKey = (node: HDNode): Effect.Effect<Uint8Array | null, never, HDWalletService> =>
  Effect.gen(function* () {
    const hdwallet = yield* HDWalletService
    return yield* hdwallet.getPrivateKey(node)
  })

/**
 * Extracts the public key from an HD node.
 *
 * @param node - The HD node
 * @returns Effect containing the 33-byte compressed public key or null, requiring HDWalletService
 * @example
 * ```typescript
 * import { getPublicKey, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = getPublicKey(node).pipe(Effect.provide(HDWalletLive))
 * ```
 * @since 0.0.1
 */
export const getPublicKey = (node: HDNode): Effect.Effect<Uint8Array | null, never, HDWalletService> =>
  Effect.gen(function* () {
    const hdwallet = yield* HDWalletService
    return yield* hdwallet.getPublicKey(node)
  })
