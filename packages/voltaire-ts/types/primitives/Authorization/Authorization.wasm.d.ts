/**
 * WASM bindings for authorization primitive (EIP-7702)
 * Provides lightweight bindings to Zig implementation via WASM
 */
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { AuthorizationType } from "./AuthorizationType.js";
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
export declare function validateWasm(auth: AuthorizationType): void;
/**
 * Calculate signing hash for authorization
 * @param chainId - Chain ID
 * @param address - Target address
 * @param nonce - Nonce
 * @returns Signing hash
 */
export declare function signingHashWasm(chainId: bigint, address: BrandedAddress, nonce: bigint): HashType;
/**
 * Recover authority (signer) from authorization
 * @param auth - Authorization to recover from
 * @returns Recovered authority address
 */
export declare function authorityWasm(auth: AuthorizationType): BrandedAddress;
/**
 * Calculate gas cost for authorization list
 * @param authCount - Number of authorizations
 * @param emptyAccounts - Number of empty accounts
 * @returns Gas cost as bigint
 */
export declare function gasCostWasm(authCount: number, emptyAccounts: number): bigint;
//# sourceMappingURL=Authorization.wasm.d.ts.map