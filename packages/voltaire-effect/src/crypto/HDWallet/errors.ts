/**
 * @fileoverview Error types and mapping helpers for HDWallet Effect wrappers.
 *
 * @module HDWallet/errors
 * @since 0.0.1
 */

import * as Data from "effect/Data";

/**
 * Invalid BIP-32/44 derivation path format.
 *
 * @since 0.0.1
 */
export class InvalidPathError extends Data.TaggedError("InvalidPathError")<{
	readonly path: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Seed bytes invalid for BIP-32 master key derivation.
 * Seed must be 16-64 bytes (128-512 bits) per BIP-32.
 *
 * @since 0.0.1
 */
export class InvalidSeedError extends Data.TaggedError("InvalidSeedError")<{
	readonly seedLength: number;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Cannot perform hardened derivation from extended public key.
 * Hardened paths (with ') require private key.
 *
 * @since 0.0.1
 */
export class HardenedDerivationError extends Data.TaggedError(
	"HardenedDerivationError",
)<{
	readonly path: string;
	readonly index: number;
	readonly message: string;
}> {}

/**
 * Child key derivation produced invalid key material.
 * This is rare but possible per BIP-32.
 *
 * @since 0.0.1
 */
export class InvalidKeyError extends Data.TaggedError("InvalidKeyError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Union of all HDWallet error types.
 *
 * @since 0.0.1
 */
export type HDWalletError =
	| InvalidPathError
	| InvalidSeedError
	| HardenedDerivationError
	| InvalidKeyError;

const getMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

/**
 * Maps unknown errors to appropriate HDWallet error type.
 *
 * @since 0.0.1
 */
export const mapToHDWalletError = (
	error: unknown,
	context: { path?: string; seedLength?: number },
): HDWalletError => {
	if (error instanceof InvalidPathError) return error;
	if (error instanceof InvalidSeedError) return error;
	if (error instanceof HardenedDerivationError) return error;
	if (error instanceof InvalidKeyError) return error;

	const message = getMessage(error);
	const normalized = message.toLowerCase();

	if (normalized.includes("hardened") || normalized.includes("public")) {
		return new HardenedDerivationError({
			path: context.path ?? "unknown",
			index: -1,
			message: `Cannot derive hardened path from public key: ${message}`,
		});
	}

	if (normalized.includes("path") || normalized.includes("derivation")) {
		return new InvalidPathError({
			path: context.path ?? "unknown",
			message: `Invalid derivation path: ${message}`,
			cause: error,
		});
	}

	if (
		normalized.includes("seed") ||
		normalized.includes("mnemonic") ||
		normalized.includes("length")
	) {
		return new InvalidSeedError({
			seedLength: context.seedLength ?? -1,
			message: `Invalid seed: ${message}`,
			cause: error,
		});
	}

	return new InvalidKeyError({
		message: `Key derivation failed: ${message}`,
		cause: error,
	});
};
