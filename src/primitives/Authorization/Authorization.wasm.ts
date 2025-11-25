/**
 * WASM bindings for authorization primitive (EIP-7702)
 * Provides lightweight bindings to Zig implementation via WASM
 */

import * as loader from "../../wasm-loader/loader.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { AuthorizationType } from "./AuthorizationType.js";

// Helper to convert Uint8Array to bigint
function bytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (const byte of bytes) {
		result = (result << 8n) | BigInt(byte);
	}
	return result;
}

/**
 * Validate authorization structure
 * @param auth - Authorization to validate
 * @throws Error if authorization is invalid
 */
export function validateWasm(auth: AuthorizationType): void {
	loader.authorizationValidate({
		chainId: auth.chainId,
		address: auth.address,
		nonce: auth.nonce,
		yParity: auth.yParity,
		r: bytesToBigInt(auth.r),
		s: bytesToBigInt(auth.s),
	});
}

/**
 * Calculate signing hash for authorization
 * @param chainId - Chain ID
 * @param address - Target address
 * @param nonce - Nonce
 * @returns Signing hash
 */
export function signingHashWasm(
	chainId: bigint,
	address: BrandedAddress,
	nonce: bigint,
): HashType {
	return loader.authorizationSigningHash(chainId, address, nonce) as HashType;
}

/**
 * Recover authority (signer) from authorization
 * @param auth - Authorization to recover from
 * @returns Recovered authority address
 */
export function authorityWasm(auth: AuthorizationType): BrandedAddress {
	return loader.authorizationAuthority({
		chainId: auth.chainId,
		address: auth.address,
		nonce: auth.nonce,
		yParity: auth.yParity,
		r: bytesToBigInt(auth.r),
		s: bytesToBigInt(auth.s),
	}) as BrandedAddress;
}

/**
 * Calculate gas cost for authorization list
 * @param authCount - Number of authorizations
 * @param emptyAccounts - Number of empty accounts
 * @returns Gas cost as bigint
 */
export function gasCostWasm(authCount: number, emptyAccounts: number): bigint {
	return loader.authorizationGasCost(authCount, emptyAccounts);
}
