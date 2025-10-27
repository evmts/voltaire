/**
 * EIP-7702 authorization utilities
 * Set EOA account code utilities for transaction authorization lists
 */

export type Hex = `0x${string}`;
export type Address = `0x${string}`;

/**
 * Authorization tuple for EIP-7702 transactions
 */
export type Authorization = {
	chainId: bigint;
	address: Address;
	nonce: bigint;
	yParity: number;
	r: Hex;
	s: Hex;
};

/**
 * Create authorization for EIP-7702 transaction
 * @param chainId - Chain ID
 * @param address - Code address to authorize
 * @param nonce - Account nonce
 * @param privateKey - Private key to sign authorization
 * @returns Signed authorization tuple
 */
export function createAuthorization(
	chainId: bigint,
	address: Address,
	nonce: bigint,
	privateKey: Hex,
): Authorization {
	throw new Error("not implemented");
}

/**
 * Hash authorization for signing
 * @param authorization - Authorization tuple (without signature)
 * @returns 32-byte hash to sign
 */
export function hashAuthorization(authorization: Omit<Authorization, "yParity" | "r" | "s">): Hex {
	throw new Error("not implemented");
}

/**
 * Verify authorization signature
 * @param authorization - Complete authorization tuple
 * @returns True if signature is valid
 */
export function verifyAuthorization(authorization: Authorization): boolean {
	throw new Error("not implemented");
}

/**
 * Recover signer address from authorization
 * @param authorization - Complete authorization tuple
 * @returns Recovered signer address
 */
export function recoverAuthorizationAddress(authorization: Authorization): Address {
	throw new Error("not implemented");
}

/**
 * Encode authorization list for transaction
 * @param authorizations - Array of authorization tuples
 * @returns RLP-encoded authorization list
 */
export function encodeAuthorizationList(authorizations: Authorization[]): Hex {
	throw new Error("not implemented");
}

/**
 * Decode authorization list from transaction
 * @param encoded - RLP-encoded authorization list
 * @returns Array of authorization tuples
 */
export function decodeAuthorizationList(encoded: Hex): Authorization[] {
	throw new Error("not implemented");
}

/**
 * Compute authority (authorized account) from authorization
 * The account that delegates code execution
 * @param authorization - Authorization tuple
 * @returns Authority address
 */
export function getAuthority(authorization: Authorization): Address {
	throw new Error("not implemented");
}
