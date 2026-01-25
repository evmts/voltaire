/**
 * @fileoverview HDWalletService Effect service definition for hierarchical deterministic wallets.
 * @module HDWallet/HDWalletService
 * @since 0.0.1
 */
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

/**
 * Represents a hierarchical deterministic wallet node.
 *
 * @description
 * An HDNode contains the key material (private key, public key, chain code)
 * at a specific point in the derivation tree. Each node can derive child nodes.
 *
 * @since 0.0.1
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki | BIP-32}
 */
export type HDNode = object

/**
 * Represents an HD derivation path as an array of indices.
 *
 * @description
 * Each number represents a child index. Indices >= 0x80000000 (2^31) are hardened.
 * For example, [44, 60, 0, 0, 0] with hardening on first three is BIP-44 Ethereum.
 *
 * @example
 * ```typescript
 * const path: HDPath = [44 + 0x80000000, 60 + 0x80000000, 0 + 0x80000000, 0, 0]
 * ```
 *
 * @since 0.0.1
 */
export type HDPath = readonly number[]

/**
 * Shape interface for HD wallet service operations.
 *
 * @description
 * Defines the contract for HD wallet implementations. All methods return Effect
 * types for composable, type-safe async/error handling.
 *
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
 *
 * @description
 * Provides mock implementations for unit testing. Returns the standard
 * BIP-39 test vector mnemonic and empty byte arrays for keys.
 * Use when testing application logic without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { HDWalletService, HDWalletTest, generateMnemonic } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = generateMnemonic(128).pipe(
 *   Effect.provide(HDWalletTest)
 * )
 * // Returns: ['abandon', 'abandon', ..., 'about']
 * ```
 *
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
