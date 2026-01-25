/**
 * @fileoverview Hierarchical Deterministic wallet module for Effect.
 * Implements BIP-32/BIP-39/BIP-44 for deterministic key derivation from a single seed.
 * This module provides Effect-based wrappers around HD wallet operations for secure
 * key management in Ethereum applications.
 *
 * @module HDWallet
 * @since 0.0.1
 *
 * @description
 * HD (Hierarchical Deterministic) wallets allow deriving an unlimited number of
 * cryptographic keys from a single master seed. This enables:
 * - Backup: One mnemonic backs up all derived keys
 * - Privacy: Generate fresh addresses for each transaction
 * - Organization: Separate keys by purpose using derivation paths
 *
 * Standard Ethereum path: m/44'/60'/0'/0/0 (BIP-44)
 *
 * @example
 * ```typescript
 * import { HDWalletService, HDWalletLive, generateMnemonic, mnemonicToSeed, fromSeed, derive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const mnemonic = yield* generateMnemonic(128)
 *   const seed = yield* mnemonicToSeed(mnemonic)
 *   const master = yield* fromSeed(seed)
 *   const account = yield* derive(master, "m/44'/60'/0'/0/0")
 *   return account
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 *
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki | BIP-32 HD Wallets}
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki | BIP-39 Mnemonic}
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki | BIP-44 Multi-Account}
 */

export {
	derive,
	fromSeed,
	generateMnemonic,
	getPrivateKey,
	getPublicKey,
	mnemonicToSeed,
} from "./derive.js";
export { HDWalletLive } from "./HDWalletLive.js";
export {
	type HDNode,
	type HDPath,
	HDWalletService,
	type HDWalletServiceShape,
	HDWalletTest,
} from "./HDWalletService.js";
