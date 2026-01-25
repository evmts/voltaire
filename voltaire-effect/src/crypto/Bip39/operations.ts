/**
 * @fileoverview BIP-39 mnemonic operations for Effect.
 * @module Bip39/operations
 * @since 0.0.1
 */
import * as Effect from "effect/Effect";
import { Bip39Service } from "./Bip39Service.js";

/**
 * Generates a random BIP-39 mnemonic phrase.
 *
 * @description
 * Creates a cryptographically random mnemonic using the BIP-39 wordlist.
 * The mnemonic includes a checksum for error detection.
 *
 * @param strength - Entropy bits: 128=12 words, 160=15, 192=18, 224=21, 256=24 words
 * @returns Effect containing the mnemonic string, requiring Bip39Service
 *
 * @example
 * ```typescript
 * import { generateMnemonic, Bip39Live } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const program = generateMnemonic(128).pipe(Effect.provide(Bip39Live))
 * // Returns: "word1 word2 word3 ... word12"
 * ```
 *
 * @throws Never fails
 * @see {@link validateMnemonic} to verify mnemonic validity
 * @since 0.0.1
 */
export const generateMnemonic = (
	strength?: 128 | 160 | 192 | 224 | 256,
): Effect.Effect<string, never, Bip39Service> =>
	Effect.gen(function* () {
		const bip39 = yield* Bip39Service;
		return yield* bip39.generateMnemonic(strength);
	});

/**
 * Validates a BIP-39 mnemonic phrase.
 *
 * @description
 * Checks that the mnemonic uses valid BIP-39 words and has a correct checksum.
 * Does not validate word count alone - must be 12, 15, 18, 21, or 24 words.
 *
 * @param mnemonic - The mnemonic string to validate (space-separated words)
 * @returns Effect containing true if valid, requiring Bip39Service
 *
 * @example
 * ```typescript
 * import { validateMnemonic, Bip39Live } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const program = validateMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')
 *   .pipe(Effect.provide(Bip39Live))
 * // Returns: true
 * ```
 *
 * @throws Never fails
 * @see {@link generateMnemonic} to create valid mnemonics
 * @since 0.0.1
 */
export const validateMnemonic = (
	mnemonic: string,
): Effect.Effect<boolean, never, Bip39Service> =>
	Effect.gen(function* () {
		const bip39 = yield* Bip39Service;
		return yield* bip39.validateMnemonic(mnemonic);
	});

/**
 * Converts a mnemonic to a seed asynchronously.
 *
 * @description
 * Uses PBKDF2-SHA512 with 2048 iterations and salt "mnemonic" + passphrase
 * to derive a 64-byte seed. The async version is preferred for non-blocking.
 *
 * @param mnemonic - The mnemonic string (space-separated words)
 * @param passphrase - Optional passphrase for additional security (default: "")
 * @returns Effect containing the 64-byte seed, requiring Bip39Service
 *
 * @example
 * ```typescript
 * import { mnemonicToSeed, Bip39Live } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const program = mnemonicToSeed('abandon abandon ...', 'my-secret-passphrase')
 *   .pipe(Effect.provide(Bip39Live))
 * // Returns: Uint8Array(64)
 * ```
 *
 * @throws Never fails if mnemonic is valid
 * @see {@link mnemonicToSeedSync} for synchronous version
 * @since 0.0.1
 */
export const mnemonicToSeed = (
	mnemonic: string,
	passphrase?: string,
): Effect.Effect<Uint8Array, never, Bip39Service> =>
	Effect.gen(function* () {
		const bip39 = yield* Bip39Service;
		return yield* bip39.mnemonicToSeed(mnemonic, passphrase);
	});

/**
 * Converts a mnemonic to a seed synchronously.
 *
 * @description
 * Uses PBKDF2-SHA512 with 2048 iterations. Blocks the thread during
 * computation. Use async version for better performance in concurrent code.
 *
 * @param mnemonic - The mnemonic string (space-separated words)
 * @param passphrase - Optional passphrase for additional security (default: "")
 * @returns Effect containing the 64-byte seed, requiring Bip39Service
 *
 * @example
 * ```typescript
 * import { mnemonicToSeedSync, Bip39Live } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const program = mnemonicToSeedSync('abandon abandon ...')
 *   .pipe(Effect.provide(Bip39Live))
 * ```
 *
 * @throws Never fails if mnemonic is valid
 * @see {@link mnemonicToSeed} for async version (preferred)
 * @since 0.0.1
 */
export const mnemonicToSeedSync = (
	mnemonic: string,
	passphrase?: string,
): Effect.Effect<Uint8Array, never, Bip39Service> =>
	Effect.gen(function* () {
		const bip39 = yield* Bip39Service;
		return yield* bip39.mnemonicToSeedSync(mnemonic, passphrase);
	});

/**
 * Returns the word count for a given entropy strength.
 *
 * @description
 * Maps entropy bits to the number of mnemonic words per BIP-39 spec.
 * Formula: (entropyBits + entropyBits/32) / 11 = wordCount
 *
 * @param entropyBits - The entropy in bits (128, 160, 192, 224, or 256)
 * @returns Effect containing the word count, requiring Bip39Service
 *
 * @example
 * ```typescript
 * import { getWordCount, Bip39Live } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const program = getWordCount(256).pipe(Effect.provide(Bip39Live))
 * // Returns: 24
 * ```
 *
 * @throws Never fails
 * @since 0.0.1
 */
export const getWordCount = (
	entropyBits: 128 | 160 | 192 | 224 | 256,
): Effect.Effect<number, never, Bip39Service> =>
	Effect.gen(function* () {
		const bip39 = yield* Bip39Service;
		return yield* bip39.getWordCount(entropyBits);
	});
