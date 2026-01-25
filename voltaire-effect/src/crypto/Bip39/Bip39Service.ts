/**
 * @fileoverview Bip39Service Effect service definition for BIP-39 mnemonic operations.
 * @module Bip39/Bip39Service
 * @since 0.0.1
 */
import { Bip39 } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Shape interface for BIP-39 mnemonic operations.
 *
 * @description
 * Defines the contract for BIP-39 implementations. All methods return Effect
 * types for composable, type-safe async/error handling.
 *
 * @since 0.0.1
 */
export interface Bip39ServiceShape {
	/**
	 * Generates a random BIP-39 mnemonic phrase.
	 * @param strength - Entropy bits (128=12 words, 256=24 words)
	 * @returns Effect containing the mnemonic string
	 */
	readonly generateMnemonic: (
		strength?: 128 | 160 | 192 | 224 | 256,
	) => Effect.Effect<string>;

	/**
	 * Validates a BIP-39 mnemonic phrase.
	 * @param mnemonic - The mnemonic string to validate
	 * @returns Effect containing true if valid
	 */
	readonly validateMnemonic: (mnemonic: string) => Effect.Effect<boolean>;

	/**
	 * Converts a mnemonic to a seed asynchronously.
	 * @param mnemonic - The mnemonic string
	 * @param passphrase - Optional passphrase
	 * @returns Effect containing the 64-byte seed
	 */
	readonly mnemonicToSeed: (
		mnemonic: string,
		passphrase?: string,
	) => Effect.Effect<Uint8Array>;

	/**
	 * Converts a mnemonic to a seed synchronously.
	 * @param mnemonic - The mnemonic string
	 * @param passphrase - Optional passphrase
	 * @returns Effect containing the 64-byte seed
	 */
	readonly mnemonicToSeedSync: (
		mnemonic: string,
		passphrase?: string,
	) => Effect.Effect<Uint8Array>;

	/**
	 * Returns the word count for a given entropy strength.
	 * @param entropyBits - The entropy in bits
	 * @returns Effect containing the word count
	 */
	readonly getWordCount: (
		entropyBits: 128 | 160 | 192 | 224 | 256,
	) => Effect.Effect<number>;
}

/**
 * BIP-39 mnemonic service for Effect-based applications.
 * Generates and validates mnemonic phrases for HD wallet derivation.
 *
 * @example
 * ```typescript
 * import { Bip39Service, Bip39Live } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const bip39 = yield* Bip39Service
 *   const mnemonic = yield* bip39.generateMnemonic(128)
 *   const isValid = yield* bip39.validateMnemonic(mnemonic)
 *   return yield* bip39.mnemonicToSeed(mnemonic)
 * }).pipe(Effect.provide(Bip39Live))
 * ```
 * @since 0.0.1
 */
export class Bip39Service extends Context.Tag("Bip39Service")<
	Bip39Service,
	Bip39ServiceShape
>() {}

/**
 * Production layer for Bip39Service using native BIP-39 implementation.
 *
 * @description
 * Provides real cryptographic BIP-39 operations. Uses secure random number
 * generation and proper PBKDF2-SHA512 for seed derivation.
 *
 * @example
 * ```typescript
 * import { Bip39Service, Bip39Live } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const bip39 = yield* Bip39Service
 *   return yield* bip39.generateMnemonic(256)
 * }).pipe(Effect.provide(Bip39Live))
 * ```
 *
 * @since 0.0.1
 * @see {@link Bip39Test} for unit testing
 */
export const Bip39Live = Layer.succeed(Bip39Service, {
	generateMnemonic: (strength = 128) =>
		Effect.sync(() => Bip39.generateMnemonic(strength)),
	validateMnemonic: (mnemonic) =>
		Effect.sync(() => Bip39.validateMnemonic(mnemonic)),
	mnemonicToSeed: (mnemonic, passphrase) =>
		Effect.promise(() => Bip39.mnemonicToSeed(mnemonic, passphrase)),
	mnemonicToSeedSync: (mnemonic, passphrase) =>
		Effect.sync(() => Bip39.mnemonicToSeedSync(mnemonic, passphrase)),
	getWordCount: (entropyBits) =>
		Effect.sync(() => Bip39.getWordCount(entropyBits)),
});

const TEST_MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

/**
 * Test layer for Bip39Service returning deterministic mock values.
 *
 * @description
 * Provides mock implementations for unit testing. Returns the standard
 * BIP-39 test vector mnemonic and always validates as true.
 * Use when testing application logic without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { Bip39Service, Bip39Test, generateMnemonic } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = generateMnemonic(128).pipe(Effect.provide(Bip39Test))
 * // Always returns test vector mnemonic
 * ```
 *
 * @since 0.0.1
 */
export const Bip39Test = Layer.succeed(Bip39Service, {
	generateMnemonic: (_strength) => Effect.succeed(TEST_MNEMONIC),
	validateMnemonic: (_mnemonic) => Effect.succeed(true),
	mnemonicToSeed: (_mnemonic, _passphrase) =>
		Effect.succeed(new Uint8Array(64)),
	mnemonicToSeedSync: (_mnemonic, _passphrase) =>
		Effect.succeed(new Uint8Array(64)),
	getWordCount: (_entropyBits) => Effect.succeed(12),
});
