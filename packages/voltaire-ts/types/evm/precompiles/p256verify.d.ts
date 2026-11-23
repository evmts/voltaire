/**
 * EIP-7951 P256VERIFY precompile (0x0000000000000000000000000000000000000100, Osaka+)
 *
 * ECDSA signature verification over secp256r1 (NIST P-256) against a raw
 * 32-byte digest. Mirrors `ethereum/execution-specs`
 * `osaka/vm/precompiled_contracts/p256verify.py`.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7951
 */
import { P256VERIFY_GAS } from "../../primitives/GasConstants/Precompile.js";
import type { PrecompileResult } from "./precompiles.js";
export { P256VERIFY_GAS };
/** Precompile address (0x0100, EIP-7951) */
export declare const P256VERIFY_ADDRESS = "0x0000000000000000000000000000000000000100";
/** Exact input length: h(32) || r(32) || s(32) || qx(32) || qy(32) */
export declare const P256VERIFY_INPUT_LENGTH = 160;
/**
 * Verify a 160-byte EIP-7951 P256VERIFY payload (`h || r || s || qx || qy`).
 *
 * Deliberately implements the exact EIP-7951 verification equations rather
 * than delegating to a generic ECDSA wrapper:
 * - High-s signatures (`n/2 < s < n`) are accepted (no malleability check).
 * - `h` is used as a raw 32-byte big-endian integer (never re-hashed) and
 *   `h ≡ 0 (mod n)` is valid.
 * - `R.x` is reduced modulo `n` before comparing with `r` (`R.x == r + n` valid).
 * - Point at infinity `(0, 0)`, coordinates `>= p`, and off-curve points are rejected.
 *
 * @param input - Strictly 160 bytes: `h(32) || r(32) || s(32) || qx(32) || qy(32)`
 * @returns `true` if and only if every encoding check and ECDSA equation pass
 */
export declare function verifyP256(input: Uint8Array): boolean;
/**
 * P256VERIFY precompile (0x0100, EIP-7951, Osaka+).
 *
 * - Charges 6900 gas before any input checks.
 * - `gasLimit < 6900n` is an Out-of-Gas exceptional halt consuming `gasLimit`.
 * - Any invalid length, invalid scalar/point encoding, or invalid signature
 *   returns empty output with `success: true` and `gasUsed: 6900n` (never reverts).
 * - A valid signature returns 32 bytes encoding big-endian `1` (`0x00..01`).
 *
 * @param input - `h(32) || r(32) || s(32) || qx(32) || qy(32)` (strictly 160 bytes)
 * @param gasLimit - Gas forwarded to the precompile
 * @returns Precompile execution result
 */
export declare function p256Verify(input: Uint8Array, gasLimit: bigint): PrecompileResult;
/** Lowercase alias for {@link p256Verify}. */
export declare const p256verify: typeof p256Verify;
//# sourceMappingURL=p256verify.d.ts.map