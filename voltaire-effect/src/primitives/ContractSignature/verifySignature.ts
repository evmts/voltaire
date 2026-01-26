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

const SIGNATURE_LENGTH = 65;
const SIGNATURE_COMPONENT_LENGTH = 32;

const assertSignatureComponentLength = (
	component: Uint8Array,
	name: "r" | "s",
) => {
	if (component.length !== SIGNATURE_COMPONENT_LENGTH) {
		throw new InvalidSignatureFormatError(
			`Signature ${name} must be ${SIGNATURE_COMPONENT_LENGTH} bytes`,
		);
	}
};

const toSignatureComponents = (
	signature: SignatureInput,
): { r: Uint8Array; s: Uint8Array; v: number } => {
	if (signature instanceof Uint8Array) {
		if (signature.length !== SIGNATURE_LENGTH) {
			throw new InvalidSignatureFormatError(
				`Signature must be ${SIGNATURE_LENGTH} bytes`,
			);
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
	typeof code === "string" && (code === "0x" || code === "0x0" || code === "0x00");

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

				const addressHex =
					typeof address === "string" ? address : Address.toHex(address);
				const code = await providerAdapter.request("eth_getCode", [
					addressHex,
					"latest",
				]);

				if (isEmptyCode(code)) {
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
				}

				const signatureBytes = toSignatureBytes(signature);
				return await ContractSignature.isValidSignature(
					providerAdapter,
					address as any,
					hash as any,
					signatureBytes,
				);
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
