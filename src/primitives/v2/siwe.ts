import type { Address } from "./address.js";

/**
 * Sign-In with Ethereum (EIP-4361) Message
 *
 * A structured message format for authentication using Ethereum accounts.
 * Supports domains, URIs, nonces, timestamps, and optional resources.
 */
export interface SiweMessage {
	/** RFC 4501 dns authority that is requesting the signing */
	domain: string;
	/** Ethereum address performing the signing */
	address: Address;
	/** Human-readable ASCII assertion that the user will sign (optional) */
	statement?: string;
	/** RFC 3986 URI referring to the resource that is the subject of the signing */
	uri: string;
	/** Current version of the message (must be "1") */
	version: string;
	/** EIP-155 Chain ID to which the session is bound */
	chainId: number;
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
}

/**
 * Parse a SIWE message from a formatted string
 *
 * @param text Formatted SIWE message string
 * @returns Parsed SiweMessage object
 * @throws Error if message format is invalid
 *
 * @example
 * ```ts
 * const text = `example.com wants you to sign in with your Ethereum account:
 * 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
 *
 * Sign in to Example
 *
 * URI: https://example.com
 * Version: 1
 * Chain ID: 1
 * Nonce: 32891756
 * Issued At: 2021-09-30T16:25:24Z`;
 *
 * const message = parse(text);
 * ```
 */
export function parse(_text: string): SiweMessage {
	// TODO: Implement SIWE message parsing
	// Parse header, address, optional statement, and required/optional fields
	// Validate format according to EIP-4361 specification
	throw new Error("Not implemented");
}

/**
 * Format a SIWE message into a string for signing
 *
 * @param message SiweMessage to format
 * @returns Formatted string according to EIP-4361 specification
 *
 * @example
 * ```ts
 * const message: SiweMessage = {
 *   domain: "example.com",
 *   address: myAddress,
 *   uri: "https://example.com",
 *   version: "1",
 *   chainId: 1,
 *   nonce: "32891756",
 *   issuedAt: "2021-09-30T16:25:24Z",
 * };
 *
 * const formatted = format(message);
 * // Returns:
 * // example.com wants you to sign in with your Ethereum account:
 * // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
 * // ...
 * ```
 */
export function format(_message: SiweMessage): string {
	// TODO: Implement SIWE message formatting
	// Format according to EIP-4361 specification with proper field ordering:
	// 1. Domain header with address
	// 2. Optional statement
	// 3. Required fields (URI, Version, Chain ID, Nonce, Issued At)
	// 4. Optional fields (Expiration Time, Not Before, Request ID, Resources)
	throw new Error("Not implemented");
}

/**
 * Verify a SIWE message signature
 *
 * @param message The SIWE message that was signed
 * @param signature The signature to verify (65 bytes: r, s, v)
 * @returns true if signature is valid and matches message address
 *
 * @example
 * ```ts
 * const message: SiweMessage = { ... };
 * const signature = new Uint8Array(65); // r, s, v
 *
 * const isValid = verify(message, signature);
 * if (isValid) {
 *   // Signature is valid, user is authenticated
 * }
 * ```
 */
export function verify(
	_message: SiweMessage,
	_signature: Uint8Array,
): boolean {
	// TODO: Implement SIWE signature verification
	// 1. Format the message
	// 2. Hash with EIP-191 prefix
	// 3. Recover public key from signature
	// 4. Derive address from public key
	// 5. Compare with message.address
	throw new Error("Not implemented");
}

/**
 * Generate a cryptographically secure random nonce for SIWE messages
 *
 * @param length Length of nonce (minimum 8, default 11)
 * @returns Random alphanumeric nonce string
 *
 * @example
 * ```ts
 * const nonce = generateNonce();
 * // Returns something like "a7b9c2d4e6f"
 *
 * const longNonce = generateNonce(16);
 * // Returns something like "a7b9c2d4e6f8g0h1"
 * ```
 */
export function generateNonce(_length: number = 11): string {
	// TODO: Implement secure nonce generation
	// Use crypto.getRandomValues to generate random bytes
	// Convert to alphanumeric string (base62 or similar)
	// Ensure minimum length of 8 characters
	throw new Error("Not implemented");
}
