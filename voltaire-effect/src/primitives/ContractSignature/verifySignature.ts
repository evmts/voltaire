/**
 * @module ContractSignature/verifySignature
 * @description Effect wrapper for contract signature verification.
 *
 * Provides typed error handling for EIP-1271 and EOA signature verification.
 *
 * @since 0.1.0
 */

import {
	ContractSignature,
	Address,
	Keccak256,
	Secp256k1,
	type BrandedAddress,
	type BrandedHash,
} from "@tevm/voltaire";
import { AbstractError } from "@tevm/voltaire/errors";
import * as Effect from "effect/Effect";
import * as Runtime from "effect/Runtime";
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
export class SignatureVerificationError extends AbstractError {
	readonly _tag = "SignatureVerificationError" as const;
	readonly input: {
		address: string;
		hash: Uint8Array;
	};

	constructor(
		input: { address: string; hash: Uint8Array },
		message: string,
		options?: { code?: number; context?: Record<string, unknown>; cause?: Error },
	) {
		super(message, options);
		this.name = "SignatureVerificationError";
		this.input = input;
	}
}

/**
 * Error thrown when signature format is invalid.
 * @since 0.1.0
 */
export class InvalidSignatureFormatError extends AbstractError {
	readonly _tag = "InvalidSignatureFormatError" as const;

	constructor(
		message: string,
		options?: { code?: number; context?: Record<string, unknown>; cause?: Error },
	) {
		super(message, options);
		this.name = "InvalidSignatureFormatError";
	}
}

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
		const provider = yield* ProviderService;
		const runtime = yield* Effect.runtime();
		const runPromise = Runtime.runPromise(runtime);

		const addressStr =
			typeof address === "string" ? address : Address.toHex(address);

		return yield* Effect.tryPromise({
			try: async () => {
				const verifyFn = ContractSignature.VerifySignature({
					keccak256: Keccak256.hash,
					recoverPublicKey: Secp256k1.recoverPublicKey as any,
					addressFromPublicKey: Address.fromPublicKey,
				});

				const providerAdapter = {
					request: async (method: string, params: unknown[]) => {
						if (method === "eth_getCode") {
							const [addr, block] = params as [string, string];
							return runPromise(
								provider.getCode(addr as `0x${string}`, block as any),
							);
						}
						if (method === "eth_call") {
							const [callObj] = params as [{ to: string; data: string }];
							return runPromise(
								provider.call({
									to: callObj.to as `0x${string}`,
									data: callObj.data as `0x${string}`,
								}),
							);
						}
						throw new Error(`Unsupported method: ${method}`);
					},
				};

				return await verifyFn(providerAdapter, address as any, hash as any, signature);
			},
			catch: (e) => {
				if (
					e instanceof Error &&
					e.name === "InvalidSignatureFormatError"
				) {
					return new InvalidSignatureFormatError(e.message, { cause: e });
				}
				return new SignatureVerificationError(
					{ address: addressStr, hash: hash instanceof Uint8Array ? hash : new Uint8Array(hash) },
					e instanceof Error ? e.message : "Signature verification failed",
					{ cause: e instanceof Error ? e : undefined },
				);
			},
		});
	});
