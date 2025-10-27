/**
 * SIWE (Sign-In with Ethereum) utilities
 * EIP-4361: Sign-In with Ethereum message parsing and validation
 */

export type Hex = `0x${string}`;
export type Address = `0x${string}`;

/**
 * SIWE message fields
 */
export type SiweMessage = {
	domain: string;
	address: Address;
	statement?: string;
	uri: string;
	version: string;
	chainId: number;
	nonce: string;
	issuedAt: string;
	expirationTime?: string;
	notBefore?: string;
	requestId?: string;
	resources?: string[];
};

/**
 * Parse SIWE message from string
 * @param message - SIWE message string
 * @returns Parsed SIWE fields
 */
export function parseSiweMessage(message: string): SiweMessage {
	throw new Error("not implemented");
}

/**
 * Format SIWE message to string
 * @param fields - SIWE message fields
 * @returns Formatted SIWE message string
 */
export function formatSiweMessage(fields: SiweMessage): string {
	throw new Error("not implemented");
}

/**
 * Validate SIWE message format and fields
 * @param message - SIWE message (string or parsed)
 * @returns True if valid
 */
export function validateSiweMessage(message: string | SiweMessage): boolean {
	throw new Error("not implemented");
}

/**
 * Generate cryptographically secure nonce for SIWE
 * @param length - Nonce length (default: 8 bytes = 16 hex chars)
 * @returns Random nonce string
 */
export function generateSiweNonce(length?: number): string {
	throw new Error("not implemented");
}

/**
 * Verify SIWE message signature
 * @param message - SIWE message string
 * @param signature - Message signature
 * @returns True if signature is valid for message
 */
export function verifySiweMessage(message: string, signature: Hex): Promise<boolean> {
	throw new Error("not implemented");
}

/**
 * Hash SIWE message for signing
 * Uses EIP-191 personal message hashing
 * @param message - SIWE message (string or parsed)
 * @returns 32-byte message hash
 */
export function hashSiweMessage(message: string | SiweMessage): Hex {
	throw new Error("not implemented");
}

/**
 * Check if SIWE message is expired
 * @param message - SIWE message (string or parsed)
 * @param now - Current time (default: Date.now())
 * @returns True if message is expired
 */
export function isSiweMessageExpired(message: string | SiweMessage, now?: Date): boolean {
	throw new Error("not implemented");
}

/**
 * Check if SIWE message is not yet valid
 * @param message - SIWE message (string or parsed)
 * @param now - Current time (default: Date.now())
 * @returns True if message is not yet valid (before notBefore time)
 */
export function isSiweMessageNotYetValid(message: string | SiweMessage, now?: Date): boolean {
	throw new Error("not implemented");
}
