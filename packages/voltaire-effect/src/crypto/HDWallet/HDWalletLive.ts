/**
 * @fileoverview Production implementation of HDWalletService using native BIP-32/39/44.
 * @module HDWallet/HDWalletLive
 * @since 0.0.1
 */

import { HDWallet } from "@tevm/voltaire/HDWallet";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { wordsToMnemonic } from "../Bip39/utils.js";
import {
	HardenedDerivationError,
	InvalidPathError,
	InvalidSeedError,
	mapToHDWalletError,
} from "./errors.js";
import {
	type HDNode,
	type HDPath,
	HDWalletService,
} from "./HDWalletService.js";

type HDWalletApi = typeof HDWallet;

const HARDENED_OFFSET = 0x80000000;
const MAX_NORMAL_INDEX = 0x7fffffff;
const MAX_HARDENED_INDEX = HARDENED_OFFSET + MAX_NORMAL_INDEX;

const formatPath = (indices: readonly number[]): string => {
	if (indices.length === 0) return "m";
	return `m/${indices
		.map((index) => {
			if (!Number.isInteger(index)) return String(index);
			if (index >= HARDENED_OFFSET) return `${index - HARDENED_OFFSET}'`;
			return `${index}`;
		})
		.join("/")}`;
};

const normalizePath = (
	HDWallet: HDWalletApi,
	path: string | HDPath,
): { pathString: string; indices: number[] } => {
	if (typeof path === "string") {
		if (!HDWallet.isValidPath(path)) {
			throw new InvalidPathError({
				path,
				message: 'Invalid path format. Expected "m/..." with numeric indices.',
			});
		}
		const components = path.split("/").slice(1);
		const indices = components.map((component) =>
			HDWallet.parseIndex(component),
		);
		return { pathString: path, indices };
	}

	if (path.length === 0) {
		throw new InvalidPathError({
			path: "m",
			message: "Invalid derivation path: path cannot be empty.",
		});
	}

	const pathString = formatPath(path);
	const indices = path.map((index) => {
		if (!Number.isInteger(index) || index < 0) {
			throw new InvalidPathError({
				path: pathString,
				message: `Invalid path index: ${index}`,
			});
		}
		if (index > MAX_HARDENED_INDEX) {
			throw new InvalidPathError({
				path: pathString,
				message: `Invalid path index: ${index}`,
			});
		}
		return index;
	});

	return { pathString, indices };
};

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
 * import { HDWalletService, generateMnemonic } from 'voltaire-effect/crypto/HDWallet'
 * import { HDWalletLive } from 'voltaire-effect/native'
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
export const HDWalletLive = Layer.effect(
	HDWalletService,
	Effect.gen(function* () {
		return {
			derive: (node, path) =>
				Effect.try({
					try: () => {
						const { pathString, indices } = normalizePath(HDWallet, path);
						const hardenedIndex = indices.find(
							(index) => index >= HARDENED_OFFSET,
						);
						if (
							hardenedIndex !== undefined &&
							!HDWallet.canDeriveHardened(
								node as ReturnType<typeof HDWallet.fromSeed>,
							)
						) {
							throw new HardenedDerivationError({
								path: pathString,
								index: hardenedIndex - HARDENED_OFFSET,
								message: `Cannot derive hardened index ${
									hardenedIndex - HARDENED_OFFSET
								}' from public key`,
							});
						}

						let currentNode = node as ReturnType<typeof HDWallet.fromSeed>;
						for (const index of indices) {
							currentNode = HDWallet.deriveChild(currentNode, index);
						}

						return currentNode as HDNode;
					},
					catch: (error) => {
						if (error instanceof InvalidPathError) return error;
						if (error instanceof HardenedDerivationError) return error;
						const pathString =
							typeof path === "string" ? path : formatPath(path);
						return mapToHDWalletError(error, { path: pathString });
					},
				}),
			generateMnemonic: (strength = 128) =>
				Effect.promise(() => HDWallet.generateMnemonic(strength as never)).pipe(
					Effect.map((words) => wordsToMnemonic(words)),
				),
			fromSeed: (seed) =>
				Effect.try({
					try: () => {
						if (seed.length < 16 || seed.length > 64) {
							throw new InvalidSeedError({
								seedLength: seed.length,
								message: `Seed must be 16-64 bytes, got ${seed.length}`,
							});
						}
						return HDWallet.fromSeed(seed) as HDNode;
					},
					catch: (error) => {
						if (error instanceof InvalidSeedError) return error;
						return mapToHDWalletError(error, { seedLength: seed.length });
					},
				}),
			fromMnemonic: (mnemonic, passphrase) => {
				let seedLength: number | undefined;
				return Effect.tryPromise({
					try: async () => {
						const seed = await HDWallet.mnemonicToSeed(mnemonic, passphrase);
						seedLength = seed.length;
						if (seed.length < 16 || seed.length > 64) {
							throw new InvalidSeedError({
								seedLength: seed.length,
								message: `Seed must be 16-64 bytes, got ${seed.length}`,
							});
						}
						return HDWallet.fromSeed(seed) as HDNode;
					},
					catch: (error) => mapToHDWalletError(error, { seedLength }),
				});
			},
			mnemonicToSeed: (mnemonic) =>
				Effect.tryPromise({
					try: () => HDWallet.mnemonicToSeed(mnemonic),
					catch: (error) => mapToHDWalletError(error, {}),
				}),
			getPrivateKey: (node) =>
				Effect.sync(() =>
					HDWallet.getPrivateKey(node as ReturnType<typeof HDWallet.fromSeed>),
				),
			getPublicKey: (node) =>
				Effect.sync(() =>
					HDWallet.getPublicKey(node as ReturnType<typeof HDWallet.fromSeed>),
				),
		};
	}),
);
