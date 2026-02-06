/**
 * @fileoverview Error types and mapping helpers for Secp256k1 Effect wrappers.
 *
 * @module Secp256k1/errors
 * @since 0.0.1
 */

import {
	InvalidPrivateKeyError as VoltaireInvalidPrivateKeyError,
	InvalidPublicKeyError as VoltaireInvalidPublicKeyError,
	InvalidSignatureError as VoltaireInvalidSignatureError,
	Secp256k1Error as VoltaireSecp256k1Error,
} from "@tevm/voltaire/Secp256k1";
import * as Data from "effect/Data";

/**
 * Base error for all Secp256k1 cryptographic operations.
 *
 * @since 0.0.1
 */
export class Secp256k1Error extends Data.TaggedError("Secp256k1Error")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Invalid private key format or value.
 *
 * @since 0.0.1
 */
export class InvalidPrivateKeyError extends Data.TaggedError(
	"InvalidPrivateKeyError",
)<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Invalid public key format or not on curve.
 *
 * @since 0.0.1
 */
export class InvalidPublicKeyError extends Data.TaggedError(
	"InvalidPublicKeyError",
)<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Invalid signature format or components.
 *
 * @since 0.0.1
 */
export class InvalidSignatureError extends Data.TaggedError(
	"InvalidSignatureError",
)<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Recovery ID is invalid for signature recovery.
 *
 * @since 0.0.1
 */
export class InvalidRecoveryIdError extends Data.TaggedError(
	"InvalidRecoveryIdError",
)<{
	readonly message: string;
	readonly recoveryId: number;
	readonly cause?: unknown;
}> {}

/**
 * Union of all Secp256k1 error types.
 *
 * @since 0.0.1
 */
export type Secp256k1Errors =
	| Secp256k1Error
	| InvalidPrivateKeyError
	| InvalidPublicKeyError
	| InvalidSignatureError
	| InvalidRecoveryIdError;

export type Secp256k1Operation = "sign" | "recover" | "verify";

const getMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

const getRecoveryId = (error: unknown): number | undefined => {
	if (!error || typeof error !== "object") return undefined;
	const candidate =
		(error as { recoveryId?: unknown }).recoveryId ??
		(error as { v?: unknown }).v;
	return typeof candidate === "number" ? candidate : undefined;
};

/**
 * Maps unknown errors to specific Secp256k1 error types.
 *
 * @since 0.0.1
 */
export function mapToSecp256k1Error(
	error: unknown,
	operation: "sign",
): InvalidPrivateKeyError | Secp256k1Error;
export function mapToSecp256k1Error(
	error: unknown,
	operation: "recover",
): InvalidSignatureError | InvalidRecoveryIdError | Secp256k1Error;
export function mapToSecp256k1Error(
	error: unknown,
	operation: "verify",
): InvalidSignatureError | InvalidPublicKeyError | Secp256k1Error;
export function mapToSecp256k1Error(
	error: unknown,
	operation: Secp256k1Operation,
): Secp256k1Errors {
	const message = getMessage(error);
	const normalized = message.toLowerCase();
	const isPrivateKey =
		normalized.includes("private key") || normalized.includes("scalar");
	const isPublicKey =
		normalized.includes("public key") || normalized.includes("point");
	const isSignature = normalized.includes("signature");
	const isRecovery =
		normalized.includes("recovery") || normalized.includes("recovery id");
	const recoveryId = getRecoveryId(error);

	switch (operation) {
		case "sign": {
			if (error instanceof InvalidPrivateKeyError) return error;
			if (error instanceof Secp256k1Error) return error;
			if (error instanceof VoltaireInvalidPrivateKeyError) {
				return new InvalidPrivateKeyError({
					message: error.message,
					cause: error,
				});
			}
			if (error instanceof VoltaireSecp256k1Error) {
				return new Secp256k1Error({ message: error.message, cause: error });
			}
			if (isPrivateKey) {
				return new InvalidPrivateKeyError({
					message: `Invalid private key: ${message}`,
					cause: error,
				});
			}
			return new Secp256k1Error({
				message: `sign failed: ${message}`,
				cause: error,
			});
		}
		case "recover": {
			if (error instanceof InvalidSignatureError) return error;
			if (error instanceof InvalidRecoveryIdError) return error;
			if (error instanceof Secp256k1Error) return error;
			if (error instanceof VoltaireInvalidSignatureError) {
				return new InvalidSignatureError({
					message: error.message,
					cause: error,
				});
			}
			if (error instanceof VoltaireSecp256k1Error) {
				return new Secp256k1Error({ message: error.message, cause: error });
			}
			if (isRecovery) {
				return new InvalidRecoveryIdError({
					message: `Invalid recovery ID: ${message}`,
					recoveryId: recoveryId ?? -1,
					cause: error,
				});
			}
			if (isSignature) {
				return new InvalidSignatureError({
					message: `Invalid signature: ${message}`,
					cause: error,
				});
			}
			return new Secp256k1Error({
				message: `recover failed: ${message}`,
				cause: error,
			});
		}
		case "verify": {
			if (error instanceof InvalidSignatureError) return error;
			if (error instanceof InvalidPublicKeyError) return error;
			if (error instanceof Secp256k1Error) return error;
			if (error instanceof VoltaireInvalidSignatureError) {
				return new InvalidSignatureError({
					message: error.message,
					cause: error,
				});
			}
			if (error instanceof VoltaireInvalidPublicKeyError) {
				return new InvalidPublicKeyError({
					message: error.message,
					cause: error,
				});
			}
			if (error instanceof VoltaireSecp256k1Error) {
				return new Secp256k1Error({ message: error.message, cause: error });
			}
			if (isPublicKey) {
				return new InvalidPublicKeyError({
					message: `Invalid public key: ${message}`,
					cause: error,
				});
			}
			if (isSignature) {
				return new InvalidSignatureError({
					message: `Invalid signature: ${message}`,
					cause: error,
				});
			}
			return new Secp256k1Error({
				message: `verify failed: ${message}`,
				cause: error,
			});
		}
	}
}
