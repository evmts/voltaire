/**
 * @module ContractSignature/verifySignature
 * @description Effect wrapper for contract signature verification.
 *
 * Provides typed error handling for EIP-1271 and EOA signature verification.
 *
 * @since 0.1.0
 */

import {
	Address,
	type BrandedAddress,
	type BrandedHash,
	ContractSignature,
	Secp256k1,
} from "@tevm/voltaire";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import { getCode, call } from "../../services/Provider/functions/index.js";
import { ProviderService } from "../../services/Provider/index.js";

type AddressType = BrandedAddress.AddressType;
type HashType = BrandedHash.HashType;

/**
 * Signature components or raw bytes
 */
export type SignatureInput =
	| { r: Uint8Array; s: Uint8Array; v: number }
	| Uint8Array;

/**
 * Error thrown when signature verification fails due to an error (not invalid signature).
 * @since 0.1.0
 */
export class SignatureVerificationError extends Data.TaggedError(
	"SignatureVerificationError",
)<{
	readonly input: {
		address: string;
		hash: Uint8Array;
	};
	readonly message: string;
	readonly code?: number;
	readonly context?: Record<string, unknown>;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when signature format is invalid.
 * @since 0.1.0
 */
export class InvalidSignatureFormatError extends Data.TaggedError(
	"InvalidSignatureFormatError",
)<{
	readonly message: string;
	readonly code?: number;
	readonly context?: Record<string, unknown>;
	readonly cause?: unknown;
}> {}

const SIGNATURE_LENGTH = 65;
const SIGNATURE_COMPONENT_LENGTH = 32;

const assertSignatureComponentLength = (
	component: Uint8Array,
	name: "r" | "s",
) => {
	if (component.length !== SIGNATURE_COMPONENT_LENGTH) {
		throw new InvalidSignatureFormatError({
			message: `Signature ${name} must be ${SIGNATURE_COMPONENT_LENGTH} bytes`,
		});
	}
};

const toSignatureComponents = (
	signature: SignatureInput,
): { r: Uint8Array; s: Uint8Array; v: number } => {
	if (signature instanceof Uint8Array) {
		if (signature.length !== SIGNATURE_LENGTH) {
			throw new InvalidSignatureFormatError({
				message: `Signature must be ${SIGNATURE_LENGTH} bytes`,
			});
		}
		return {
			r: signature.slice(0, 32),
			s: signature.slice(32, 64),
			v: signature[64] ?? 0,
		};
	}
	assertSignatureComponentLength(signature.r, "r");
	assertSignatureComponentLength(signature.s, "s");
	return signature;
};

const concatSignature = (signature: {
	r: Uint8Array;
	s: Uint8Array;
	v: number;
}): Uint8Array => {
	assertSignatureComponentLength(signature.r, "r");
	assertSignatureComponentLength(signature.s, "s");
	const result = new Uint8Array(SIGNATURE_LENGTH);
	result.set(signature.r, 0);
	result.set(signature.s, 32);
	result[64] = signature.v;
	return result;
};

const toSignatureBytes = (signature: SignatureInput): Uint8Array =>
	signature instanceof Uint8Array ? signature : concatSignature(signature);

const bytesToBigInt = (bytes: Uint8Array): bigint => {
	let result = 0n;
	for (const byte of bytes) {
		result = (result << 8n) | BigInt(byte);
	}
	return result;
};

const isEmptyCode = (code: unknown): code is string =>
	typeof code === "string" &&
	(code === "0x" || code === "0x0" || code === "0x00");

// EIP-1271 magic value
const EIP1271_MAGIC_VALUE = "0x1626ba7e";

/**
 * Verify a signature for both EOA and contract accounts (EIP-1271).
 *
 * Unlike the base voltaire function which silently returns `false` for errors,
 * this Effect wrapper properly distinguishes between:
 * - Invalid signatures (returns `false`)
 * - Format errors (throws `InvalidSignatureFormatError`)
 * - Network/verification errors (throws `SignatureVerificationError`)
 *
 * @param address - Address to verify signature for (EOA or contract)
 * @param hash - Message hash that was signed
 * @param signature - ECDSA signature (65 bytes or {r, s, v} components)
 * @returns Effect that resolves to `true` if valid, `false` if invalid
 *
 * @example
 * ```typescript
 * import * as ContractSignature from 'voltaire-effect/primitives/ContractSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const program = ContractSignature.verifySignature(
 *   signerAddress,
 *   messageHash,
 *   signature
 * ).pipe(
 *   Effect.catchTag("InvalidSignatureFormatError", (e) =>
 *     Effect.succeed(false) // Treat format errors as invalid
 *   ),
 *   Effect.catchTag("SignatureVerificationError", (e) =>
 *     Effect.fail(e) // Re-throw network errors
 *   )
 * )
 * ```
 *
 * @since 0.1.0
 */
export const verifySignature = (
	address: AddressType | `0x${string}`,
	hash: HashType | Uint8Array,
	signature: SignatureInput,
): Effect.Effect<
	boolean,
	SignatureVerificationError | InvalidSignatureFormatError,
	ProviderService
> =>
	Effect.gen(function* () {
		const addressStr =
			typeof address === "string" ? address : Address.toHex(address);
		const addressHex = addressStr as `0x${string}`;

		// Get code to determine if EOA or contract
		const code = yield* getCode(addressHex, "latest").pipe(
			Effect.mapError(
				(e) =>
					new SignatureVerificationError({
						input: {
							address: addressStr,
							hash: hash instanceof Uint8Array ? hash : new Uint8Array(hash),
						},
						message: `Failed to get code: ${e.message}`,
						cause: e,
					}),
			),
		);

		// EOA verification
		if (isEmptyCode(code)) {
			return yield* Effect.try({
				try: () => {
					const sigComponents = toSignatureComponents(signature);
					const publicKey = Secp256k1.recoverPublicKey(
						sigComponents,
						hash as any,
					);
					const x = bytesToBigInt(publicKey.slice(0, 32));
					const y = bytesToBigInt(publicKey.slice(32, 64));
					const recoveredAddress = Address.fromPublicKey(x, y);
					const expectedAddress =
						typeof address === "string" ? Address(address) : address;
					return Address.equals(recoveredAddress, expectedAddress);
				},
				catch: (e) => {
					if (e instanceof InvalidSignatureFormatError) {
						return e;
					}
					if (
						e instanceof Error &&
						(e.name === "InvalidSignatureFormatError" ||
							e.name === "InvalidSignatureError")
					) {
						return new InvalidSignatureFormatError({
							message: e.message,
							cause: e,
						});
					}
					return new SignatureVerificationError({
						input: {
							address: addressStr,
							hash: hash instanceof Uint8Array ? hash : new Uint8Array(hash),
						},
						message:
							e instanceof Error ? e.message : "Signature verification failed",
						cause: e,
					});
				},
			});
		}

		// Contract (EIP-1271) verification
		const signatureBytes = yield* Effect.try({
			try: () => toSignatureBytes(signature),
			catch: (e) => {
				if (e instanceof InvalidSignatureFormatError) {
					return e;
				}
				return new InvalidSignatureFormatError({
					message: e instanceof Error ? e.message : "Invalid signature format",
					cause: e,
				});
			},
		});

		// Build EIP-1271 isValidSignature call data
		const hashHex =
			hash instanceof Uint8Array
				? `0x${Buffer.from(hash).toString("hex")}`
				: `0x${Buffer.from(hash).toString("hex")}`;
		const sigHex = `0x${Buffer.from(signatureBytes).toString("hex")}`;

		// isValidSignature(bytes32 hash, bytes signature) selector: 0x1626ba7e
		// ABI encode: selector + hash (32 bytes) + offset to signature (32) + signature length (32) + signature data
		const hashPadded = hashHex.slice(2).padStart(64, "0");
		const sigOffset = "0000000000000000000000000000000000000000000000000000000000000040"; // 64 in hex
		const sigLength = signatureBytes.length.toString(16).padStart(64, "0");
		const sigPadded = sigHex.slice(2).padEnd(Math.ceil(signatureBytes.length / 32) * 64, "0");
		const callData = `0x1626ba7e${hashPadded}${sigOffset}${sigLength}${sigPadded}` as `0x${string}`;

		const result = yield* call({ to: addressHex, data: callData }).pipe(
			Effect.mapError(
				(e) =>
					new SignatureVerificationError({
						input: {
							address: addressStr,
							hash: hash instanceof Uint8Array ? hash : new Uint8Array(hash),
						},
						message: `EIP-1271 call failed: ${e.message}`,
						cause: e,
					}),
			),
		);

		// Check if result matches EIP-1271 magic value
		return result.toLowerCase().startsWith(EIP1271_MAGIC_VALUE);
	});
