/**
 * @fileoverview Sign-In with Ethereum (SIWE) helpers for Effect.
 * @module Auth/siwe
 * @since 0.1.0
 */

import type { AddressType } from "@tevm/voltaire/Address";
import { Address } from "@tevm/voltaire/Address";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import type { ParseError } from "effect/ParseResult";
import * as Schema from "effect/Schema";
import type { KeccakService } from "../crypto/Keccak256/index.js";
import type { Secp256k1Service } from "../crypto/Secp256k1/index.js";
import {
	constantTimeEqual,
	type SignatureInput,
	verifyMessage,
} from "../crypto/Signature/index.js";
import * as Signature from "../primitives/Signature/index.js";
import {
	format,
	generateNonce,
	MessageStruct,
	type SiweMessageType,
	Schema as SiweStringSchema,
	validate,
} from "../primitives/Siwe/index.js";

/**
 * SIWE message fields (EIP-4361).
 *
 * @since 0.1.0
 */
export type SiweMessage = SiweMessageType;

/**
 * Alias for SIWE fields returned from verification.
 *
 * @since 0.1.0
 */
export type SiweFields = SiweMessage;

/**
 * Parse error type from Effect Schema decoding.
 *
 * @since 0.1.0
 */
export type { ParseError } from "effect/ParseResult";

/**
 * Parameters for creating a SIWE message string.
 *
 * @since 0.1.0
 */
export type CreateSiweMessageParams = {
	/** RFC 4501 DNS authority requesting the signing */
	domain: string;
	/** Optional scheme to prefix the domain (e.g. "https") */
	scheme?: string;
	/** Ethereum address performing the signing (hex string or bytes) */
	address: AddressType | string;
	/** RFC 3986 URI referring to the subject of the signing */
	uri: string;
	/** Current version of the message (defaults to "1") */
	version?: string;
	/** EIP-155 Chain ID to which the session is bound */
	chainId: number;
	/** Human-readable statement to be signed */
	statement?: string;
	/** Randomized token to prevent replay attacks */
	nonce?: string;
	/** ISO 8601 datetime string of the current time */
	issuedAt?: string | Date;
	/** ISO 8601 datetime string after which the message is invalid */
	expirationTime?: string | Date;
	/** ISO 8601 datetime string before which the message is invalid */
	notBefore?: string | Date;
	/** System-specific identifier for the sign-in request */
	requestId?: string;
	/** List of resources for the user to authorize */
	resources?: readonly string[];
};

/**
 * Parameters for verifying a SIWE message and signature.
 *
 * @since 0.1.0
 */
export type VerifySiweMessageParams = {
	/** EIP-4361 formatted SIWE message string */
	message: string;
	/** Signature produced by the signer (hex string, bytes, or r/s/v object) */
	signature: SignatureInput | string;
	/** Expected signer address (optional) */
	address?: AddressType | string;
	/** Expected domain (optional) */
	domain?: string;
	/** Expected nonce (optional) */
	nonce?: string;
	/** Expected scheme (optional, e.g. "https") */
	scheme?: string;
	/** Time to use for expiration checks (defaults to now) */
	time?: Date;
};

/**
 * Error thrown when SIWE verification fails.
 *
 * @since 0.1.0
 */
export class VerifyError extends Data.TaggedError("VerifyError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {
	/**
	 * Creates a new VerifyError.
	 *
	 * @param message - Error description
	 * @param options - Optional cause
	 */
	static of(message: string, options?: { cause?: unknown }): VerifyError {
		return new VerifyError({ message, cause: options?.cause });
	}
}

/**
 * Schema for SIWE message object validation.
 *
 * @since 0.1.0
 */
export const SiweMessageSchema = MessageStruct;

const normalizeDomain = (domain: string): string =>
	domain.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "").trim();

const normalizeDate = (value?: string | Date): string | undefined =>
	value instanceof Date ? value.toISOString() : value;

const normalizeAddress = (address: AddressType | string): AddressType => {
	if (address instanceof Uint8Array) return address as AddressType;
	return Address.fromHex(address);
};

const normalizeAddressEffect = (
	address: AddressType | string,
): Effect.Effect<AddressType, VerifyError> =>
	Effect.try({
		try: () => normalizeAddress(address),
		catch: (error) =>
			VerifyError.of("Invalid address format", { cause: error }),
	});

const parseHeader = (message: string): { scheme?: string; domain?: string } => {
	const [line] = message.split("\n", 1);
	if (!line) return {};
	const match =
		/^(?:(?<scheme>[a-zA-Z][a-zA-Z0-9+.-]*):\/\/)?(?<domain>.+) wants you to sign in with your Ethereum account:$/.exec(
			line,
		);
	if (!match?.groups) return {};
	return {
		scheme: match.groups.scheme,
		domain: match.groups.domain,
	};
};

const normalizeSignature = (
	signature: SignatureInput | string,
): Effect.Effect<SignatureInput, VerifyError> => {
	if (typeof signature !== "string") return Effect.succeed(signature);
	return Schema.decode(Signature.Hex)(signature).pipe(
		Effect.mapError((error) =>
			VerifyError.of("Invalid signature format", { cause: error }),
		),
	);
};

/**
 * Creates a SIWE (EIP-4361) message string.
 *
 * @param params - SIWE message parameters
 * @returns Formatted SIWE message string
 *
 * @since 0.1.0
 */
export const createSiweMessage = (params: CreateSiweMessageParams): string => {
	const address = normalizeAddress(params.address);
	const domainHasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(params.domain);
	const domain =
		params.scheme && !domainHasScheme
			? `${params.scheme}://${params.domain}`
			: params.domain;
	const message: SiweMessage = {
		domain,
		address,
		statement: params.statement,
		uri: params.uri,
		version: params.version ?? "1",
		chainId: params.chainId,
		nonce: params.nonce ?? generateNonce(),
		issuedAt: normalizeDate(params.issuedAt) ?? new Date().toISOString(),
		...(params.expirationTime
			? { expirationTime: normalizeDate(params.expirationTime) }
			: {}),
		...(params.notBefore ? { notBefore: normalizeDate(params.notBefore) } : {}),
		...(params.requestId ? { requestId: params.requestId } : {}),
		...(params.resources ? { resources: [...params.resources] } : {}),
	};

	return format(message);
};

/**
 * Parses a SIWE message string into fields using Effect Schema.
 *
 * @param message - Formatted SIWE message string
 * @returns Effect yielding parsed SIWE fields
 *
 * @since 0.1.0
 */
export const parseSiweMessage = (
	message: string,
): Effect.Effect<SiweMessage, ParseError> =>
	Schema.decode(SiweStringSchema)(message).pipe(
		Effect.flatMap((parsed) =>
			Schema.decode(MessageStruct)(parsed).pipe(Effect.as(parsed)),
		),
	);

/**
 * Verifies a SIWE message and signature.
 *
 * This function parses and validates the message, checks optional fields
 * (domain, nonce, address, scheme), and verifies the signature.
 *
 * @param params - Verification parameters
 * @returns Effect yielding SIWE fields on success
 *
 * @since 0.1.0
 */
export const verifySiweMessage = (
	params: VerifySiweMessageParams,
): Effect.Effect<SiweFields, VerifyError, KeccakService | Secp256k1Service> =>
	Effect.gen(function* () {
		const parsed = yield* parseSiweMessage(params.message).pipe(
			Effect.mapError((error) =>
				VerifyError.of("Failed to parse SIWE message", { cause: error }),
			),
		);

		if (params.scheme) {
			const header = parseHeader(params.message);
			const actualScheme = header.scheme;
			if (!actualScheme) {
				return yield* Effect.fail(
					VerifyError.of("Expected scheme is missing from message"),
				);
			}
			if (actualScheme.toLowerCase() !== params.scheme.toLowerCase()) {
				return yield* Effect.fail(
					VerifyError.of("Scheme does not match message"),
				);
			}
		}

		if (params.domain) {
			const expectedDomain = normalizeDomain(params.domain);
			const actualDomain = normalizeDomain(parsed.domain);
			if (expectedDomain !== actualDomain) {
				return yield* Effect.fail(
					VerifyError.of("Domain does not match message"),
				);
			}
		}

		if (params.nonce && parsed.nonce !== params.nonce) {
			return yield* Effect.fail(VerifyError.of("Nonce does not match message"));
		}

		if (params.address) {
			const expectedAddress = yield* normalizeAddressEffect(params.address);
			if (!constantTimeEqual(expectedAddress, parsed.address)) {
				return yield* Effect.fail(
					VerifyError.of("Address does not match message"),
				);
			}
		}

		const validation = validate(
			parsed,
			params.time ? { now: params.time } : undefined,
		);
		if (!validation.valid) {
			return yield* Effect.fail(
				VerifyError.of(validation.error.message, { cause: validation.error }),
			);
		}

		const signature = yield* normalizeSignature(params.signature);

		const isValid = yield* verifyMessage({
			message: params.message,
			signature,
			address: parsed.address,
		}).pipe(
			Effect.mapError((error) =>
				VerifyError.of("Signature verification failed", { cause: error }),
			),
		);

		if (!isValid) {
			return yield* Effect.fail(
				VerifyError.of("Signature does not match message address"),
			);
		}

		return parsed;
	});
