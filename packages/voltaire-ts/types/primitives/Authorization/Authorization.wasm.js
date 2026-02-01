/**
 * WASM bindings for authorization primitive (EIP-7702)
 * Provides lightweight bindings to Zig implementation via WASM
 */
import * as loader from "../../wasm-loader/loader.js";
import { InvalidAddressError, InvalidChainIdError, InvalidSignatureComponentError, InvalidSignatureRangeError, InvalidYParityError, MalleableSignatureError, } from "./errors.js";
// Helper to convert Uint8Array to bigint
function bytesToBigInt(bytes) {
    let result = 0n;
    for (const byte of bytes) {
        result = (result << 8n) | BigInt(byte);
    }
    return result;
}
function mapAuthorizationError(auth, message) {
    const lower = message.toLowerCase();
    if (lower.includes("chain")) {
        return new InvalidChainIdError(auth.chainId);
    }
    if (lower.includes("address")) {
        return new InvalidAddressError(auth.address);
    }
    if (lower.includes("yparity") || lower.includes("parity")) {
        return new InvalidYParityError(auth.yParity);
    }
    if (lower.includes("malleable")) {
        const sBigInt = bytesToBigInt(auth.s);
        return new MalleableSignatureError(sBigInt, 0n);
    }
    if (lower.includes("signature")) {
        const rBigInt = bytesToBigInt(auth.r);
        const sBigInt = bytesToBigInt(auth.s);
        if (rBigInt === 0n) {
            return new InvalidSignatureComponentError("r", rBigInt);
        }
        if (sBigInt === 0n) {
            return new InvalidSignatureComponentError("s", sBigInt);
        }
        return new InvalidSignatureRangeError(rBigInt, 0n);
    }
    return null;
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
export function validateWasm(auth) {
    try {
        loader.authorizationValidate({
            chainId: auth.chainId,
            address: auth.address,
            nonce: auth.nonce,
            yParity: auth.yParity,
            r: bytesToBigInt(auth.r),
            s: bytesToBigInt(auth.s),
        });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const mapped = mapAuthorizationError(auth, msg);
        if (mapped) {
            throw mapped;
        }
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
export function signingHashWasm(chainId, address, nonce) {
    return loader.authorizationSigningHash(chainId, address, nonce);
}
/**
 * Recover authority (signer) from authorization
 * @param auth - Authorization to recover from
 * @returns Recovered authority address
 */
export function authorityWasm(auth) {
    return loader.authorizationAuthority({
        chainId: auth.chainId,
        address: auth.address,
        nonce: auth.nonce,
        yParity: auth.yParity,
        r: bytesToBigInt(auth.r),
        s: bytesToBigInt(auth.s),
    });
}
/**
 * Calculate gas cost for authorization list
 * @param authCount - Number of authorizations
 * @param emptyAccounts - Number of empty accounts
 * @returns Gas cost as bigint
 */
export function gasCostWasm(authCount, emptyAccounts) {
    return loader.authorizationGasCost(authCount, emptyAccounts);
}
