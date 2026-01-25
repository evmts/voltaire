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
 * @throws Never fails if inputs are valid
 * @see {@link fromSeed} to create the master node
 * @since 0.0.1
 */
export const derive = (
	node: HDNode,
	path: string | HDPath,
): Effect.Effect<HDNode, never, HDWalletService> =>
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
 * @param strength - Entropy bits: 128 = 12 words, 256 = 24 words (default: 128)
 * @returns Effect containing the mnemonic word array, requiring HDWalletService
 *
 * @example
 * ```typescript
 * import { generateMnemonic, HDWalletLive } from 'voltaire-effect/crypto/HDWallet'
 * import * as Effect from 'effect/Effect'
 *
 * const program = generateMnemonic(256).pipe(Effect.provide(HDWalletLive))
 * // Returns 24 words from BIP-39 wordlist
 * ```
 *
 * @throws Never fails
 * @see {@link mnemonicToSeed} to convert mnemonic to seed
 * @since 0.0.1
 */
export const generateMnemonic = (
	strength: 128 | 256 = 128,
): Effect.Effect<string[], never, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.generateMnemonic(strength);
	});

/**
 * Creates a master HD node from a seed.
 *
 * @description
 * Creates the root node of the HD tree from a 64-byte seed. The seed is typically
 * derived from a BIP-39 mnemonic using PBKDF2. The master node is at path "m".
 *
 * @param seed - The 64-byte seed (typically from mnemonicToSeed)
 * @returns Effect containing the master HD node, requiring HDWalletService
 *
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
 *
 * @throws Never fails if seed is valid
 * @see {@link mnemonicToSeed} to generate seed from mnemonic
 * @see {@link derive} to derive child nodes
 * @since 0.0.1
 */
export const fromSeed = (
	seed: Uint8Array,
): Effect.Effect<HDNode, never, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.fromSeed(seed);
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
 * @throws Never fails if mnemonic is valid
 * @see {@link generateMnemonic} to create a mnemonic
 * @see {@link fromSeed} to create master node from seed
 * @since 0.0.1
 */
export const mnemonicToSeed = (
	mnemonic: string[],
): Effect.Effect<Uint8Array, never, HDWalletService> =>
	Effect.gen(function* () {
		const hdwallet = yield* HDWalletService;
		return yield* hdwallet.mnemonicToSeed(mnemonic);
	});

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
