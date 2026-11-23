/**
 * EIP-7951 P256VERIFY precompile (0x0000000000000000000000000000000000000100, Osaka+)
 *
 * ECDSA signature verification over secp256r1 (NIST P-256) against a raw
 * 32-byte digest. Mirrors `ethereum/execution-specs`
 * `osaka/vm/precompiled_contracts/p256verify.py`.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7951
 */

import { p256 } from "@noble/curves/nist.js";
import { P256VERIFY_GAS } from "../../primitives/GasConstants/Precompile.js";
import type { PrecompileResult } from "./precompiles.js";

export { P256VERIFY_GAS };

/** Precompile address (0x0100, EIP-7951) */
export const P256VERIFY_ADDRESS = "0x0000000000000000000000000000000000000100";

/** Exact input length: h(32) || r(32) || s(32) || qx(32) || qy(32) */
export const P256VERIFY_INPUT_LENGTH = 160;

/** secp256r1 base field prime modulus p */
const P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
/** secp256r1 curve coefficient a = p - 3 */
const A = 0xffffffff00000001000000000000000000000000fffffffffffffffffffffffcn;
/** secp256r1 curve coefficient b */
const B = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;
/** secp256r1 subgroup order n */
const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

function readUint256(input: Uint8Array, offset: number): bigint {
	let result = 0n;
	for (let i = offset; i < offset + 32; i++) {
		result = (result << 8n) | BigInt(input[i] ?? 0);
	}
	return result;
}

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
export function verifyP256(input: Uint8Array): boolean {
	if (input.length !== P256VERIFY_INPUT_LENGTH) return false;

	const h = readUint256(input, 0);
	const r = readUint256(input, 32);
	const s = readUint256(input, 64);
	const qx = readUint256(input, 96);
	const qy = readUint256(input, 128);

	// Signature scalar bounds: 0 < r < n and 0 < s < n (no low-s restriction).
	if (r === 0n || r >= N || s === 0n || s >= N) return false;

	// Public key field bounds: 0 <= qx < p and 0 <= qy < p.
	if (qx >= P || qy >= P) return false;

	// Reject point at infinity encoding (0, 0).
	if (qx === 0n && qy === 0n) return false;

	// Public key must satisfy secp256r1 curve equation: y^2 = x^3 + a*x + b (mod p).
	if ((qy * qy - (qx * qx * qx + A * qx + B)) % P !== 0n) return false;

	const { Point } = p256;
	const sInv = Point.Fn.inv(s);
	const u1 = Point.Fn.create(h * sInv);
	const u2 = Point.Fn.create(r * sInv);

	// R = u1*G + u2*Q. multiplyUnsafe permits u1 == 0n (when h ≡ 0 mod n).
	const q = Point.fromAffine({ x: qx, y: qy });
	const point = Point.BASE.multiplyUnsafe(u1).add(q.multiplyUnsafe(u2));
	if (point.is0()) return false;

	// Accept iff R.x mod n == r.
	return point.toAffine().x % N === r;
}

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
export function p256Verify(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	if (gasLimit < P256VERIFY_GAS) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gasLimit,
			error: "Out of gas",
		};
	}

	let valid = false;
	if (input.length === P256VERIFY_INPUT_LENGTH) {
		try {
			valid = verifyP256(input);
		} catch {
			// Verification failure must never revert the precompile.
			valid = false;
		}
	}

	if (!valid) {
		return {
			success: true,
			output: new Uint8Array(0),
			gasUsed: P256VERIFY_GAS,
		};
	}

	const output = new Uint8Array(32);
	output[31] = 1;
	return {
		success: true,
		output,
		gasUsed: P256VERIFY_GAS,
	};
}

/** Lowercase alias for {@link p256Verify}. */
export const p256verify = p256Verify;
