/**
 * EIP-7702 Authorization List
 *
 * Set EOA code authorization for account abstraction.
 * All types and operations as top-level exports.
 *
 * @example
 * ```typescript
 * import * as Authorization from './authorization.js';
 *
 * // Types
 * const auth: Authorization.Item = { chainId: 1n, address, nonce: 0n, yParity: 0, r: 0n, s: 0n };
 *
 * // Operations using this: pattern
 * validate.call(auth);
 * const sigHash = hash.call(auth);
 * const authority = verify.call(auth);
 * ```
 */

import { Keccak256 } from "../../crypto/Keccak256/index.js";
import { Secp256k1 } from "../../crypto/Secp256k1/index.js";
import * as Address from "../Address/index.js";
import { Hash, type BrandedHash } from "../Hash/index.js";
import * as Rlp from "../Rlp/index.js";

// ==========================================================================
// Core Types
// ==========================================================================

/**
 * EIP-7702 Authorization
 * Allows EOA to delegate code execution to another address
 */
export type Item = {
	/** Chain ID where authorization is valid */
	chainId: bigint;
	/** Address to delegate code execution to */
	address: BrandedAddress.Address;
	/** Nonce of the authorizing account */
	nonce: bigint;
	/** Signature Y parity (0 or 1) */
	yParity: number;
	/** Signature r value */
	r: bigint;
	/** Signature s value */
	s: bigint;
};

/**
 * Authorization without signature (for hashing)
 */
export type Unsigned = {
	chainId: bigint;
	address: BrandedAddress.Address;
	nonce: bigint;
};

/**
 * Delegation designation result
 */
export type DelegationDesignation = {
	/** Authority (signer) address */
	authority: Address.Address;
	/** Delegated code address */
	delegatedAddress: Address.Address;
};

// ==========================================================================
// Constants
// ==========================================================================

/**
 * EIP-7702 magic byte for signing hash
 */
export const MAGIC_BYTE = 0x05;

/**
 * Gas cost per empty account authorization
 */
export const PER_EMPTY_ACCOUNT_COST = 25000n;

/**
 * Base gas cost per authorization
 */
export const PER_AUTH_BASE_COST = 12500n;

/**
 * secp256k1 curve order N
 */
export const SECP256K1_N =
	0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/**
 * secp256k1 curve order N / 2 (for malleability check)
 */
export const SECP256K1_HALF_N = SECP256K1_N >> 1n;

// ==========================================================================
// Error Types
// ==========================================================================

/**
 * Authorization validation error
 */
export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthorizationValidationError";
	}
}

// ==========================================================================
// Type Guards
// ==========================================================================

/**
 * Check if value is Item
 *
 * @param value - Value to check
 * @returns True if value is Item
 *
 * @example
 * ```typescript
 * const value: unknown = {...};
 * if (isItem(value)) {
 *   // value is Item
 * }
 * ```
 *
 * Note: Type guards don't use this: pattern as they operate on unknown values
 */
export function isItem(value: unknown): value is Item {
	if (typeof value !== "object" || value === null) return false;
	const auth = value as Partial<Item>;
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
 * Check if value is Unsigned
 *
 * @param value - Value to check
 * @returns True if value is Unsigned
 *
 * Note: Type guards don't use this: pattern as they operate on unknown values
 */
export function isUnsigned(value: unknown): value is Unsigned {
	if (typeof value !== "object" || value === null) return false;
	const auth = value as Partial<Unsigned>;
	return (
		typeof auth.chainId === "bigint" &&
		typeof auth.address === "object" &&
		auth.address !== null &&
		"bytes" in auth.address &&
		typeof auth.nonce === "bigint"
	);
}

// ==========================================================================
// Validation
// ==========================================================================

/**
 * Validate authorization structure
 *
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * try {
 *   validate.call(auth);
 * } catch (e) {
 *   if (e instanceof ValidationError) {
 *     console.error(e.message);
 *   }
 * }
 * ```
 */
export function validate(this: Item): void {
	// Chain ID must be non-zero
	if (this.chainId === 0n) {
		throw new ValidationError("Chain ID must be non-zero");
	}

	// Address must not be zero
	if (Array.from(this.address).every((byte) => byte === 0)) {
		throw new ValidationError("Address cannot be zero address");
	}

	// yParity must be 0 or 1
	if (this.yParity !== 0 && this.yParity !== 1) {
		throw new ValidationError("yParity must be 0 or 1");
	}

	// r and s must be non-zero
	if (this.r === 0n) {
		throw new ValidationError("Signature r cannot be zero");
	}
	if (this.s === 0n) {
		throw new ValidationError("Signature s cannot be zero");
	}

	// r must be < N
	if (this.r >= SECP256K1_N) {
		throw new ValidationError("Signature r must be less than curve order");
	}

	// s must be <= N/2 (no malleable signatures)
	if (this.s > SECP256K1_HALF_N) {
		throw new ValidationError("Signature s too high (malleable signature)");
	}
}

// ==========================================================================
// Hashing
// ==========================================================================

/**
 * Calculate signing hash for authorization
 *
 * Hash = keccak256(MAGIC || rlp([chain_id, address, nonce]))
 *
 * @returns Hash to sign
 *
 * @example
 * ```typescript
 * const unsigned: Unsigned = { chainId: 1n, address, nonce: 0n };
 * const sigHash = hash.call(unsigned);
 * // Now sign sigHash with private key
 * ```
 */
export function hash(this: Unsigned): BrandedHash {
	// Helper to encode bigint compact (remove leading zeros)
	function encodeBigintCompact(value: bigint): Uint8Array {
		if (value === 0n) return new Uint8Array(0);
		let byteLength = 0;
		let temp = value;
		while (temp > 0n) {
			byteLength++;
			temp >>= 8n;
		}
		const bytes = new Uint8Array(byteLength);
		let val = value;
		for (let i = byteLength - 1; i >= 0; i--) {
			bytes[i] = Number(val & 0xffn);
			val >>= 8n;
		}
		return bytes;
	}

	// RLP encode [chainId, address, nonce]
	const fields = [
		encodeBigintCompact(this.chainId),
		this.address,
		encodeBigintCompact(this.nonce),
	];
	const rlpEncoded = Rlp.encode(fields);

	// Prepend MAGIC_BYTE (0x05)
	const data = new Uint8Array(1 + rlpEncoded.length);
	data[0] = MAGIC_BYTE;
	data.set(rlpEncoded, 1);

	// keccak256 hash
	return Keccak256.hash(data);
}

// ==========================================================================
// Creation
// ==========================================================================

/**
 * Create signed authorization from unsigned
 *
 * @param privateKey - Private key (32 bytes) for signing
 * @returns Signed authorization
 *
 * @example
 * ```typescript
 * const unsigned: Unsigned = { chainId: 1n, address, nonce: 0n };
 * const auth = sign.call(unsigned, privateKey);
 * ```
 */
export function sign(this: Unsigned, privateKey: Uint8Array): Item {
	// Hash the unsigned authorization
	const messageHash = hash.call(this);

	// Sign with secp256k1
	const sig = Secp256k1.sign(messageHash, privateKey);

	// Extract r, s, yParity from signature
	// Signature is { r, s, v }
	const r = sig.r;
	const s = sig.s;

	// Convert r and s to bigint
	let rBigint = 0n;
	let sBigint = 0n;
	for (let i = 0; i < 32; i++) {
		const rByte = r[i];
		const sByte = s[i];
		if (rByte !== undefined && sByte !== undefined) {
			rBigint = (rBigint << 8n) | BigInt(rByte);
			sBigint = (sBigint << 8n) | BigInt(sByte);
		}
	}

	// Recover yParity by trying both values
	let yParity = 0;
	try {
		const recovered = Secp256k1.recoverPublicKey({ r, s, v: 0 }, messageHash);
		const recoveredAddress = addressFromPublicKey(recovered);
		if (!addressesEqual(recoveredAddress, this.address)) {
			yParity = 1;
		}
	} catch {
		yParity = 1;
	}

	return {
		chainId: this.chainId,
		address: this.address,
		nonce: this.nonce,
		yParity,
		r: rBigint,
		s: sBigint,
	};
}

// ==========================================================================
// Verification
// ==========================================================================

/**
 * Verify authorization signature and recover authority
 *
 * @returns Recovered signer address (authority)
 * @throws ValidationError if validation fails
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * const authority = verify.call(auth);
 * console.log(`Authorized by: ${authority}`);
 * ```
 */
export function verify(this: Item): BrandedAddress.Address {
	// Validate structure first
	validate.call(this);

	// Hash the unsigned portion
	const unsigned: Unsigned = {
		chainId: this.chainId,
		address: this.address,
		nonce: this.nonce,
	};
	const messageHash = hash.call(unsigned);

	// Convert r and s bigints to Uint8Array
	const r = new Uint8Array(32);
	const s = new Uint8Array(32);
	let rVal = this.r;
	let sVal = this.s;
	for (let i = 31; i >= 0; i--) {
		r[i] = Number(rVal & 0xffn);
		s[i] = Number(sVal & 0xffn);
		rVal >>= 8n;
		sVal >>= 8n;
	}

	// Recover public key from signature
	const signature = { r, s, v: this.yParity };
	const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);

	// Derive address from public key
	return addressFromPublicKey(publicKey);
}

// ==========================================================================
// Gas Calculations
// ==========================================================================

/**
 * Calculate gas cost for authorization list
 *
 * @param emptyAccounts - Number of empty accounts being authorized
 * @returns Total gas cost
 *
 * @example
 * ```typescript
 * const authList: Item[] = [...];
 * const gas = calculateGasCost.call(authList, 2);
 * console.log(`Gas required: ${gas}`);
 * ```
 */
export function calculateGasCost(this: Item[], emptyAccounts: number): bigint {
	const authCost = BigInt(this.length) * PER_AUTH_BASE_COST;
	const emptyCost = BigInt(emptyAccounts) * PER_EMPTY_ACCOUNT_COST;
	return authCost + emptyCost;
}

/**
 * Calculate gas cost for this authorization
 *
 * @param isEmpty - Whether the account is empty
 * @returns Gas cost for this authorization
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * const gas = getGasCost.call(auth, true);
 * ```
 */
export function getGasCost(this: Item, isEmpty: boolean): bigint {
	return PER_AUTH_BASE_COST + (isEmpty ? PER_EMPTY_ACCOUNT_COST : 0n);
}

// ==========================================================================
// Processing
// ==========================================================================

/**
 * Process authorization and return delegation designation
 *
 * @returns Delegation designation with authority and delegated address
 * @throws ValidationError if authorization is invalid
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * const delegation = process.call(auth);
 * console.log(`${delegation.authority} delegates to ${delegation.delegatedAddress}`);
 * ```
 */
export function process(this: Item): DelegationDesignation {
	// Validate and recover authority
	const authority = verify.call(this);

	return {
		authority,
		delegatedAddress: this.address,
	};
}

/**
 * Process authorization list and return all delegations
 *
 * @returns Array of delegation designations
 * @throws ValidationError if any authorization is invalid
 *
 * @example
 * ```typescript
 * const authList: Item[] = [...];
 * const delegations = processAll.call(authList);
 * delegations.forEach(d => {
 *   console.log(`${d.authority} -> ${d.delegatedAddress}`);
 * });
 * ```
 */
export function processAll(this: Item[]): DelegationDesignation[] {
	return this.map((auth) => process.call(auth));
}

// ==========================================================================
// Utilities
// ==========================================================================

/**
 * Format authorization to human-readable string
 *
 * @returns Human-readable string
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * console.log(format.call(auth));
 * // "Authorization(chain=1, to=0x..., nonce=0)"
 * ```
 */
export function format(this: Item | Unsigned): string {
	if ("r" in this && "s" in this) {
		return `Authorization(chain=${this.chainId}, to=${formatAddress(
			this.address,
		)}, nonce=${this.nonce}, r=0x${this.r.toString(16)}, s=0x${this.s.toString(
			16,
		)}, v=${this.yParity})`;
	}
	return `Authorization(chain=${this.chainId}, to=${formatAddress(
		this.address,
	)}, nonce=${this.nonce})`;
}

/**
 * Helper to format address (shortened)
 */
function formatAddress(addr: BrandedAddress.Address): string {
	const hex = Array.from(addr)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`;
}

/**
 * Check if this authorization equals another
 *
 * @param other - Other authorization to compare
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const auth1: Item = {...};
 * const auth2: Item = {...};
 * if (equals.call(auth1, auth2)) {
 *   console.log('Authorizations are equal');
 * }
 * ```
 */
export function equals(this: Item, other: Item): boolean {
	return (
		this.chainId === other.chainId &&
		addressesEqual(this.address, other.address) &&
		this.nonce === other.nonce &&
		this.yParity === other.yParity &&
		this.r === other.r &&
		this.s === other.s
	);
}

/**
 * Helper to check address equality
 */
function addressesEqual(a: BrandedAddress.Address, b: BrandedAddress.Address): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

/**
 * Helper to derive address from public key
 */
function addressFromPublicKey(publicKey: Uint8Array): BrandedAddress.Address {
	// Public key is 64 bytes (uncompressed, no prefix)
	// Extract x and y coordinates
	let x = 0n;
	let y = 0n;
	for (let i = 0; i < 32; i++) {
		const xByte = publicKey[i];
		const yByte = publicKey[32 + i];
		if (xByte !== undefined && yByte !== undefined) {
			x = (x << 8n) | BigInt(xByte);
			y = (y << 8n) | BigInt(yByte);
		}
	}
	return Address.fromPublicKey(x, y);
}

// ==========================================================================
// Branded Types
// ==========================================================================

/**
 * Authorization type alias for branded type pattern
 */
export type Authorization = Item;
