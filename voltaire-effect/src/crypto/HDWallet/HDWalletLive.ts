/**
 * @fileoverview Production implementation of HDWalletService using native BIP-32/39/44.
 * @module HDWallet/HDWalletLive
 * @since 0.0.1
 */
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { HDWallet } from '@tevm/voltaire/HDWallet'
import { HDWalletService, type HDNode } from './HDWalletService.js'

/**
 * Production layer for HDWalletService using native BIP-32/39/44 implementation.
 *
 * @description
 * Provides real cryptographic HD wallet operations backed by the Voltaire
 * native implementation. Uses cryptographically secure random number generation
 * for mnemonic generation and proper key derivation per BIP standards.
 *
 * @example
 * ```typescript
 * import { HDWalletService, HDWalletLive, generateMnemonic } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const hd = yield* HDWalletService
 *   return yield* hd.generateMnemonic(256) // 24-word mnemonic
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 *
 * @since 0.0.1
 * @see {@link HDWalletTest} for unit testing
 */
export const HDWalletLive = Layer.succeed(HDWalletService, {
  derive: (node, path) => Effect.sync(() => HDWallet.derivePath(node as ReturnType<typeof HDWallet.fromSeed>, path as string) as HDNode),
  generateMnemonic: (strength = 128) => Effect.promise(() => HDWallet.generateMnemonic(strength)),
  fromSeed: (seed) => Effect.sync(() => HDWallet.fromSeed(seed) as HDNode),
  mnemonicToSeed: (mnemonic) => Effect.promise(() => HDWallet.mnemonicToSeed(mnemonic)),
  getPrivateKey: (node) => Effect.sync(() => HDWallet.getPrivateKey(node as ReturnType<typeof HDWallet.fromSeed>)),
  getPublicKey: (node) => Effect.sync(() => HDWallet.getPublicKey(node as ReturnType<typeof HDWallet.fromSeed>))
})
