/**
 * @fileoverview HD wallet derivation operations for Effect.
 * @module HDWallet/derive
 * @since 0.0.1
 */
import * as Effect from "effect/Effect";
import {
	type HDNode,
	type HDPath,
	HDWalletService,
} from "./HDWalletService.js";
import type { MnemonicStrength } from "../Bip39/types.js";
import { InvalidKeyError, type HDWalletError } from "./errors.js";

/**
 * Derives a child HD node from a parent node using the given path.
 *
 * @description
 * Performs BIP-32 child key derivation using either a string path (e.g., "m/44'/60'/0'/0/0")
 * or an array of indices. Hardened derivation is indicated by apostrophe in string paths
 * or by adding 0x80000000 to numeric indices.
 *
 * @param node - The parent HD node to derive from
 * @param path - Derivation path (e.g., "m/44'/60'/0'/0/0" or array of indices)
 * @returns Effect containing the derived child node, requiring HDWalletService
 *
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
 *
 * @throws InvalidPathError if derivation path is invalid
 * @throws HardenedDerivationError if hardened derivation is attempted from a public node
 * @throws InvalidKeyError if child key derivation fails
 * @see {@link fromSeed} to create the master node
 * @since 0.0.1
 */
export const derive = (
	node: HDNode,
	path: string | HDPath,
): Effect.Effect<HDNode, HDWalletError, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.derive(node, path);
	});

/**
 * Generates a new random BIP-39 mnemonic phrase.
 *
 * @description
 * Creates a cryptographically random mnemonic phrase using secure random number
 * generation. The mnemonic encodes entropy plus a checksum, enabling wallet recovery.
 *
 * @param strength - Entropy bits: 128 = 12 words, 160 = 15, 192 = 18, 224 = 21, 256 = 24 (default: 128)
 * @returns Effect containing the space-separated mnemonic sentence, requiring HDWalletService
 *
 * @example
 * ```typescript
 * import { generateMnemonic, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = generateMnemonic(256).pipe(Effect.provide(HDWalletLive))
 * // Returns 24 words from BIP-39 wordlist, space-separated
 * ```
 *
 * @throws Never fails
 * @see {@link mnemonicToSeed} to convert mnemonic to seed
 * @since 0.0.1
 */
export const generateMnemonic = (
	strength: MnemonicStrength = 128,
): Effect.Effect<string, never, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.generateMnemonic(strength);
	});

/**
 * Creates a master HD node from a seed.
 *
 * @description
 * Creates the root node of the HD tree from a 16-64 byte seed. The seed is typically
 * derived from a BIP-39 mnemonic using PBKDF2. The master node is at path "m".
 *
 * @param seed - The 16-64 byte seed (typically from mnemonicToSeed)
 * @returns Effect containing the master HD node, requiring HDWalletService
 *
 * @example
 * ```typescript
 * import { fromSeed, mnemonicToSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import { mnemonicToWords } from 'voltaire-effect/crypto/Bip39'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const seed = yield* mnemonicToSeed(mnemonicToWords(mnemonic))
 *   return yield* fromSeed(seed)
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 *
 * @throws InvalidSeedError if seed length is invalid
 * @throws InvalidKeyError if master key derivation fails
 * @see {@link mnemonicToSeed} to generate seed from mnemonic
 * @see {@link derive} to derive child nodes
 * @since 0.0.1
 */
export const fromSeed = (
	seed: Uint8Array,
): Effect.Effect<HDNode, HDWalletError, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.fromSeed(seed);
	});

/**
 * Creates a master HD node from a mnemonic sentence.
 *
 * @description
 * Converts the mnemonic to a seed and derives the master HD node.
 *
 * @param mnemonic - Space-separated mnemonic sentence
 * @param passphrase - Optional passphrase (default: "")
 * @returns Effect containing the master HD node, requiring HDWalletService
 *
 * @example
 * ```typescript
 * import { fromMnemonic, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = fromMnemonic("abandon abandon ...", "passphrase").pipe(
 *   Effect.provide(HDWalletLive)
 * )
 * ```
 *
 * @throws InvalidSeedError if derived seed is invalid
 * @throws InvalidKeyError if master key derivation fails
 * @since 0.0.1
 */
export const fromMnemonic = (
	mnemonic: string,
	passphrase?: string,
): Effect.Effect<HDNode, HDWalletError, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.fromMnemonic(mnemonic, passphrase);
	});

/**
 * Converts a mnemonic phrase to a 64-byte seed.
 *
 * @description
 * Uses PBKDF2-SHA512 with 2048 iterations to derive a 64-byte seed from the mnemonic.
 * The seed is used to create the master HD node. An optional passphrase can be used
 * for additional security (not implemented in this wrapper).
 *
 * @param mnemonic - Array of BIP-39 mnemonic words
 * @returns Effect containing the 64-byte seed, requiring HDWalletService
 *
 * @example
 * ```typescript
 * import { mnemonicToSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const words = ['abandon', 'abandon', 'abandon', 'abandon', 'abandon',
 *                'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about']
 * const program = mnemonicToSeed(words).pipe(Effect.provide(HDWalletLive))
 * ```
 *
 * @throws InvalidSeedError if mnemonic conversion fails
 * @see {@link generateMnemonic} to create a mnemonic
 * @see {@link withSeed} to ensure seed cleanup after use
 * @see {@link fromSeed} to create master node from seed
 * @since 0.0.1
 */
export const mnemonicToSeed = (
	mnemonic: string[],
): Effect.Effect<Uint8Array, HDWalletError, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.mnemonicToSeed(mnemonic);
	});

/**
 * Derives a mnemonic seed, uses it, and zeroes it after use.
 *
 * @description
 * Wraps {@link mnemonicToSeed} with `Effect.acquireRelease` to ensure the
 * seed is wiped from memory after the provided effect completes.
 *
 * @param mnemonic - Array of BIP-39 mnemonic words
 * @param use - Effect that consumes the derived seed
 * @returns Effect containing the result of `use`
 *
 * @example
 * ```typescript
 * import { withSeed, fromSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = withSeed(words, (seed) =>
 *   fromSeed(seed)
 * ).pipe(Effect.provide(HDWalletLive))
 * ```
 *
 * @since 0.0.1
 */
export const withSeed = <R, E, A>(
	mnemonic: string[],
	use: (seed: Uint8Array) => Effect.Effect<A, E, R>,
): Effect.Effect<A, E | HDWalletError, R | HDWalletService> =>
	Effect.acquireRelease(
		mnemonicToSeed(mnemonic),
		(seed) => Effect.sync(() => seed.fill(0)),
	).pipe(Effect.flatMap(use), Effect.scoped);

/**
 * Extracts the private key from an HD node.
 *
 * @description
 * Retrieves the 32-byte secp256k1 private key from the HD node. This key can be
 * used for signing transactions and deriving Ethereum addresses. Returns null
 * for neutered (public-key-only) nodes.
 *
 * @param node - The HD node containing the private key
 * @returns Effect containing the 32-byte private key or null, requiring HDWalletService
 *
 * @example
 * ```typescript
 * import { getPrivateKey, derive, fromSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const master = yield* fromSeed(seed)
 *   const account = yield* derive(master, "m/44'/60'/0'/0/0")
 *   return yield* getPrivateKey(account)
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 *
 * @throws Never fails
 * @see {@link getPublicKey} to extract the public key
 * @since 0.0.1
 */
export const getPrivateKey = (
	node: HDNode,
): Effect.Effect<Uint8Array | null, never, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.getPrivateKey(node);
	});

/**
 * Extracts a private key, uses it, and zeroes it after use.
 *
 * @description
 * Wraps {@link getPrivateKey} with `Effect.acquireRelease` to ensure key
 * material is wiped from memory after the provided effect completes.
 *
 * @param node - The HD node containing the private key
 * @param use - Effect that consumes the private key
 * @returns Effect containing the result of `use`
 *
 * @example
 * ```typescript
 * import { withPrivateKey, derive, fromSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const master = yield* fromSeed(seed)
 *   const account = yield* derive(master, "m/44'/60'/0'/0/0")
 *   return yield* withPrivateKey(account, (key) => Effect.sync(() => key))
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 *
 * @throws InvalidKeyError if the node does not contain a private key
 * @since 0.0.1
 */
export const withPrivateKey = <R, E, A>(
	node: HDNode,
	use: (key: Uint8Array) => Effect.Effect<A, E, R>,
): Effect.Effect<A, E | HDWalletError, R | HDWalletService> =>
	Effect.acquireRelease<
		Uint8Array | null,
		never,
		HDWalletService,
		void,
		never
	>(
		getPrivateKey(node),
		(key) =>
			Effect.sync(() => {
				if (key) {
					key.fill(0);
				}
			}),
	).pipe(
		Effect.flatMap(
			(key): Effect.Effect<A, E | HDWalletError, R> =>
				key
					? use(key)
					: Effect.fail(
							new InvalidKeyError({
								message: "HD node does not contain a private key.",
							}),
						),
		),
		Effect.scoped,
	);

/**
 * Extracts the public key from an HD node.
 *
 * @description
 * Retrieves the 33-byte compressed secp256k1 public key from the HD node.
 * The public key can be used to derive Ethereum addresses (keccak256 of
 * uncompressed key, take last 20 bytes).
 *
 * @param node - The HD node containing the public key
 * @returns Effect containing the 33-byte compressed public key or null, requiring HDWalletService
 *
 * @example
 * ```typescript
 * import { getPublicKey, derive, fromSeed, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const master = yield* fromSeed(seed)
 *   const account = yield* derive(master, "m/44'/60'/0'/0/0")
 *   return yield* getPublicKey(account) // 33 bytes, compressed format
 * }).pipe(Effect.provide(HDWalletLive))
 * ```
 *
 * @throws Never fails
 * @see {@link getPrivateKey} to extract the private key
 * @since 0.0.1
 */
export const getPublicKey = (
	node: HDNode,
): Effect.Effect<Uint8Array | null, never, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.getPublicKey(node);
	});
