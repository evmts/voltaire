/**
 * WASM bindings for authorization primitive (EIP-7702)
 * Provides lightweight bindings to Zig implementation via WASM
 */

import * as loader from "../../wasm-loader/loader.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { AuthorizationType } from "./AuthorizationType.js";
import {
	InvalidAddressError,
	InvalidChainIdError,
	InvalidSignatureComponentError,
	InvalidSignatureRangeError,
	InvalidYParityError,
	MalleableSignatureError,
} from "./errors.js";

// Helper to convert Uint8Array to bigint
function bytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (const byte of bytes) {
		result = (result << 8n) | BigInt(byte);
	}
	return result;
}

/**
 * Validate authorization structure using WASM
 *
 * @param auth - Authorization to validate
 * @throws {InvalidChainIdError} if chainId is zero
 * @throws {InvalidAddressError} if address is zero address
 * @throws {InvalidYParityError} if yParity is not 0 or 1
 * @throws {InvalidSignatureComponentError} if r or s is zero
 * @throws {InvalidSignatureRangeError} if r >= curve order
 * @throws {MalleableSignatureError} if s > N/2 (malleable signature)
 */
export function validateWasm(auth: AuthorizationType): void {
	try {
		loader.authorizationValidate({
			chainId: auth.chainId,
			address: auth.address,
			nonce: auth.nonce,
			yParity: auth.yParity,
			r: bytesToBigInt(auth.r),
			s: bytesToBigInt(auth.s),
		});
	} catch (e) {
		// Convert WASM error to typed error
		const msg = e instanceof Error ? e.message : String(e);
		if (msg.includes("chain") || msg.includes("Chain")) {
			throw new InvalidChainIdError(auth.chainId);
		}
		if (msg.includes("address") || msg.includes("Address")) {
			throw new InvalidAddressError(auth.address);
		}
		if (msg.includes("yParity") || msg.includes("parity")) {
			throw new InvalidYParityError(auth.yParity);
		}
		if (msg.includes("malleable") || msg.includes("Malleable")) {
			const sBigInt = bytesToBigInt(auth.s);
			throw new MalleableSignatureError(sBigInt, 0n);
		}
		if (msg.includes("signature") || msg.includes("Signature")) {
			const rBigInt = bytesToBigInt(auth.r);
			const sBigInt = bytesToBigInt(auth.s);
			if (rBigInt === 0n) {
				throw new InvalidSignatureComponentError("r", rBigInt);
			}
			if (sBigInt === 0n) {
				throw new InvalidSignatureComponentError("s", sBigInt);
			}
			throw new InvalidSignatureRangeError(rBigInt, 0n);
		}
		// Re-throw unknown errors
		throw e;
	}
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
