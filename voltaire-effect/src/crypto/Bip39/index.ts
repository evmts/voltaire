/**
 * @fileoverview BIP-39 mnemonic module for Effect.
 * Generates and validates mnemonic phrases for HD wallet derivation.
 *
 * @module Bip39
 * @since 0.0.1
 *
 * @description
 * BIP-39 defines how mnemonic sentences (12-24 words from a 2048-word list) can be
 * used to derive cryptographic seeds. This enables human-readable backup of wallets.
 *
 * Supported entropy levels:
 * - 128 bits → 12 words
 * - 160 bits → 15 words
 * - 192 bits → 18 words
 * - 224 bits → 21 words
 * - 256 bits → 24 words
 *
 * @example
 * ```typescript
 * import { Bip39Service, Bip39Live, generateMnemonic, validateMnemonic, mnemonicToSeed } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const mnemonic = yield* generateMnemonic(128)
 *   const isValid = yield* validateMnemonic(mnemonic)
 *   const seed = yield* mnemonicToSeed(mnemonic)
 *   return { mnemonic, isValid, seed }
 * }).pipe(Effect.provide(Bip39Live))
 * ```
 *
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki | BIP-39 Specification}
 */
export {
	Bip39Live,
	Bip39Service,
	type Bip39ServiceShape,
	Bip39Test,
} from "./Bip39Service.js";
export {
	generateMnemonic,
	getWordCount,
	mnemonicToSeed,
	mnemonicToSeedSync,
	validateMnemonic,
} from "./operations.js";
export { type MnemonicStrength, WORD_COUNTS } from "./types.js";
export {
	mnemonicToWords,
	validateWordCount,
	wordsToMnemonic,
} from "./utils.js";
