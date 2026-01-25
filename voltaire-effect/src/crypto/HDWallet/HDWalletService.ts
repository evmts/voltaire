import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

/**
 * Represents a hierarchical deterministic wallet node.
 * @since 0.0.1
 */
export type HDNode = object

/**
 * Represents an HD derivation path as an array of indices.
 * @since 0.0.1
 */
export type HDPath = readonly number[]

/**
 * Shape interface for HD wallet service operations.
 * @since 0.0.1
 */
export interface HDWalletServiceShape {
  /**
   * Derives a child node from a parent node using the given path.
   * @param node - The parent HD node
   * @param path - Derivation path (e.g., "m/44'/60'/0'/0/0" or array of indices)
   * @returns Effect containing the derived child node
   */
  readonly derive: (node: HDNode, path: string | HDPath) => Effect.Effect<HDNode>

  /**
   * Generates a new random BIP-39 mnemonic phrase.
   * @param strength - Entropy bits (128 = 12 words, 256 = 24 words)
   * @returns Effect containing the mnemonic word array
   */
  readonly generateMnemonic: (strength?: 128 | 256) => Effect.Effect<string[]>

  /**
   * Creates an HD node from a seed.
   * @param seed - The 64-byte seed from mnemonic
   * @returns Effect containing the master HD node
   */
  readonly fromSeed: (seed: Uint8Array) => Effect.Effect<HDNode>

  /**
   * Converts a mnemonic phrase to a seed.
   * @param mnemonic - Array of mnemonic words
   * @returns Effect containing the 64-byte seed
   */
  readonly mnemonicToSeed: (mnemonic: string[]) => Effect.Effect<Uint8Array>

  /**
   * Extracts the private key from an HD node.
   * @param node - The HD node
   * @returns Effect containing the 32-byte private key or null
   */
  readonly getPrivateKey: (node: HDNode) => Effect.Effect<Uint8Array | null>

  /**
   * Extracts the public key from an HD node.
   * @param node - The HD node
   * @returns Effect containing the 33-byte compressed public key or null
   */
  readonly getPublicKey: (node: HDNode) => Effect.Effect<Uint8Array | null>
}

/**
 * Hierarchical Deterministic wallet service for Effect-based applications.
 * Implements BIP-32/BIP-39/BIP-44 for deterministic key derivation.
 *
 * @example
 * ```typescript
 * import { HDWalletService, HDWalletLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const hd = yield* HDWalletService
 *   const mnemonic = yield* hd.generateMnemonic(128)
 *   const seed = yield* hd.mnemonicToSeed(mnemonic)
 *   const master = yield* hd.fromSeed(seed)
 *   return yield* hd.derive(master, "m/44'/60'/0'/0/0")
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 * @since 0.0.1
 */
export class HDWalletService extends Context.Tag("HDWalletService")<
  HDWalletService,
  HDWalletServiceShape
>() {}

/**
 * Test layer for HDWalletService returning deterministic mock values.
 * Use for unit testing without cryptographic overhead.
 * @since 0.0.1
 */
export const HDWalletTest = Layer.succeed(HDWalletService, {
  derive: (_node, _path) => Effect.succeed({} as HDNode),
  generateMnemonic: (_strength) => Effect.succeed(['abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about']),
  fromSeed: (_seed) => Effect.succeed({} as HDNode),
  mnemonicToSeed: (_mnemonic) => Effect.succeed(new Uint8Array(64)),
  getPrivateKey: (_node) => Effect.succeed(new Uint8Array(32)),
  getPublicKey: (_node) => Effect.succeed(new Uint8Array(33))
})
