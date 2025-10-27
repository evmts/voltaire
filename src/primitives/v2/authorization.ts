/**
 * EIP-7702 Authorization List
 * Set EOA code authorization for account abstraction
 */

import type { Address } from "../address.js";
import type { Hash } from "../hash.js";

/**
 * EIP-7702 Authorization
 * Allows EOA to delegate code execution to another address
 */
export interface Authorization {
	/** Chain ID where authorization is valid */
	chainId: bigint;
	/** Address to delegate code execution to */
	address: Address;
	/** Nonce of the authorizing account */
	nonce: bigint;
	/** Signature Y parity (0 or 1) */
	yParity: number;
	/** Signature r value */
	r: bigint;
	/** Signature s value */
	s: bigint;
}

/**
 * Type guard: Check if value is Authorization
 */
export function isAuthorization(value: unknown): value is Authorization {
	if (typeof value !== "object" || value === null) return false;
	const auth = value as Partial<Authorization>;
	return (
		typeof auth.chainId === "bigint" &&
		typeof auth.address === "object" &&
		auth.address !== null &&
		"bytes" in auth.address &&
		typeof auth.nonce === "bigint" &&
		typeof auth.yParity === "number" &&
		typeof auth.r === "bigint" &&
		typeof auth.s === "bigint"
	);
}

/**
 * EIP-7702 magic byte for signing hash
 */
export const MAGIC_BYTE = 0x05;

/**
 * Gas costs for EIP-7702
 */
export const PER_EMPTY_ACCOUNT_COST = 25000n;
export const PER_AUTH_BASE_COST = 12500n;

/**
 * Validation error types
 */
export class AuthorizationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthorizationError";
	}
}

/**
 * Validate authorization structure
 *
 * @param auth Authorization to validate
 * @throws AuthorizationError if invalid
 */
export function validate(auth: Authorization): void {
	// Chain ID must be non-zero
	if (auth.chainId === 0n) {
		throw new AuthorizationError("Chain ID must be non-zero");
	}

	// Address must not be zero
	if (auth.address.bytes.every((byte) => byte === 0)) {
		throw new AuthorizationError("Address cannot be zero address");
	}

	// yParity must be 0 or 1
	if (auth.yParity !== 0 && auth.yParity !== 1) {
		throw new AuthorizationError("yParity must be 0 or 1");
	}

	// r and s must be non-zero
	if (auth.r === 0n) {
		throw new AuthorizationError("Signature r cannot be zero");
	}
	if (auth.s === 0n) {
		throw new AuthorizationError("Signature s cannot be zero");
	}

	// secp256k1 curve order N
	const N =
		0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

	// r must be < N
	if (auth.r >= N) {
		throw new AuthorizationError("Signature r must be less than curve order");
	}

	// s must be <= N/2 (no malleable signatures)
	const halfN = N >> 1n;
	if (auth.s > halfN) {
		throw new AuthorizationError("Signature s too high (malleable signature)");
	}
}

/**
 * Create Authorization (stub)
 *
 * @param chainId Chain ID
 * @param address Target address
 * @param nonce Account nonce
 * @param privateKey Private key (32 bytes)
 * @returns Signed authorization
 */
export function create(
	chainId: bigint,
	address: Address,
	nonce: bigint,
	privateKey: Uint8Array,
): Authorization {
	// TODO: Implement authorization creation with signing
	throw new Error("Authorization.create() not yet implemented");
}

/**
 * Calculate signing hash for authorization (stub)
 *
 * @param auth Authorization (without signature)
 * @returns Hash to sign
 */
export function hash(auth: {
	chainId: bigint;
	address: Address;
	nonce: bigint;
}): Hash {
	// TODO: Implement keccak256(MAGIC || rlp([chain_id, address, nonce]))
	throw new Error("Authorization.hash() not yet implemented");
}

/**
 * Verify authorization signature and recover authority (stub)
 *
 * @param auth Authorization with signature
 * @returns Recovered signer address (authority)
 */
export function verify(auth: Authorization): Address {
	// TODO: Implement signature verification and recovery
	validate(auth);
	throw new Error("Authorization.verify() not yet implemented");
}

/**
 * Calculate gas cost for authorization list
 *
 * @param authList List of authorizations
 * @param emptyAccounts Number of empty accounts being authorized
 * @returns Total gas cost
 */
export function calculateGasCost(
	authList: Authorization[],
	emptyAccounts: number,
): bigint {
	const authCost = BigInt(authList.length) * PER_AUTH_BASE_COST;
	const emptyCost = BigInt(emptyAccounts) * PER_EMPTY_ACCOUNT_COST;
	return authCost + emptyCost;
}

/**
 * Delegation designation result
 */
export interface DelegationDesignation {
	/** Authority (signer) address */
	authority: Address;
	/** Delegated code address */
	delegatedAddress: Address;
}

/**
 * Process authorization list and return delegations (stub)
 *
 * @param authList List of authorizations
 * @returns Array of delegation designations
 */
export function processAuthorizations(
	authList: Authorization[],
): DelegationDesignation[] {
	// TODO: Implement authorization processing
	// For each auth: validate, recover authority, create delegation
	throw new Error("processAuthorizations() not yet implemented");
}
