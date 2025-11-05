import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";

/**
 * Sign-In with Ethereum Message (EIP-4361)
 *
 * A structured message format for authentication using Ethereum accounts.
 * Supports domains, URIs, nonces, timestamps, and optional resources.
 */
export type BrandedMessage<
	TDomain extends string = string,
	TAddress extends BrandedAddress = BrandedAddress,
	TUri extends string = string,
	TVersion extends string = string,
	TChainId extends number = number,
> = {
	/** RFC 4501 dns authority that is requesting the signing */
	domain: TDomain;
	/** Ethereum address performing the signing */
	address: TAddress;
	/** Human-readable ASCII assertion that the user will sign (optional) */
	statement?: string;
	/** RFC 3986 URI referring to the resource that is the subject of the signing */
	uri: TUri;
	/** Current version of the message (must be "1") */
	version: TVersion;
	/** EIP-155 Chain ID to which the session is bound */
	chainId: TChainId;
	/** Randomized token to prevent replay attacks, at least 8 alphanumeric characters */
	nonce: string;
	/** ISO 8601 datetime string of the current time */
	issuedAt: string;
	/** ISO 8601 datetime string after which the message is no longer valid (optional) */
	expirationTime?: string;
	/** ISO 8601 datetime string before which the message is invalid (optional) */
	notBefore?: string;
	/** System-specific identifier that may be used to uniquely refer to the sign-in request (optional) */
	requestId?: string;
	/** List of information or references to information the user wishes to have resolved (optional) */
	resources?: string[];
};

/**
 * Signature type for SIWE verification
 * 65 bytes: r (32) + s (32) + v (1)
 */
export type Signature = Uint8Array;

/**
 * Validation result with detailed error information
 */
export type ValidationResult =
	| { valid: true }
	| { valid: false; error: ValidationError };

/**
 * Validation error types
 */
export type ValidationError =
	| { type: "invalid_domain"; message: string }
	| { type: "invalid_address"; message: string }
	| { type: "invalid_uri"; message: string }
	| { type: "invalid_version"; message: string }
	| { type: "invalid_chain_id"; message: string }
	| { type: "invalid_nonce"; message: string }
	| { type: "invalid_timestamp"; message: string }
	| { type: "expired"; message: string }
	| { type: "not_yet_valid"; message: string }
	| { type: "signature_mismatch"; message: string };
