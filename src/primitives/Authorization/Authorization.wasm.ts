/**
 * WASM bindings for authorization primitive (EIP-7702)
 * Provides lightweight bindings to Zig implementation via WASM
 */

import * as loader from "../../wasm-loader/loader.js";
import type { BrandedAddress } from "../Address/index.js";
import { type BrandedHash, Hash } from "../Hash/index.js";
import type { Item } from "./Authorization.js";

/**
 * Validate authorization structure
 * @param auth - Authorization to validate
 * @throws Error if authorization is invalid
 */
export function validateWasm(auth: Item): void {
	loader.authorizationValidate({
		chainId: auth.chainId,
		address: auth.address,
		nonce: auth.nonce,
		yParity: auth.yParity,
		r: auth.r,
		s: auth.s,
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
): BrandedHash {
	return loader.authorizationSigningHash(
		chainId,
		address,
		nonce,
	) as BrandedHash;
}

/**
 * Recover authority (signer) from authorization
 * @param auth - Authorization to recover from
 * @returns Recovered authority address
 */
export function authorityWasm(auth: Item): BrandedAddress {
	return loader.authorizationAuthority({
		chainId: auth.chainId,
		address: auth.address,
		nonce: auth.nonce,
		yParity: auth.yParity,
		r: auth.r,
		s: auth.s,
	}) as Address;
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
