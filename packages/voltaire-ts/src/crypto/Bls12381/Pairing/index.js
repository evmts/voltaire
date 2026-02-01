/**
 * BLS12-381 Pairing Operations
 *
 * Optimal Ate pairing implementation for BLS12-381.
 * e: G1 x G2 -> GT
 *
 * NOTE: Full pairing implementation requires Fp6, Fp12 tower extensions
 * and Miller loop computation. For production use, the native blst
 * library should be used via the Zig FFI bindings.
 *
 * This module provides the interface and simplified implementations
 * for testing and educational purposes.
 *
 * @see https://hackmd.io/@benjaminion/bls12-381 for pairing details
 * @since 0.0.0
 */

import { PairingError } from "../errors.js";
import * as G1 from "../G1/index.js";
import * as G2 from "../G2/index.js";

/**
 * Pairing check: verify that product of pairings equals identity
 * e(P1, Q1) * e(P2, Q2) * ... * e(Pn, Qn) = 1
 *
 * This is the core operation used in BLS signature verification.
 *
 * @param {Array<[import('../G1PointType.js').G1PointType, import('../G2PointType.js').G2PointType]>} pairs - Array of (G1, G2) point pairs
 * @returns {boolean} True if pairing product equals identity
 * @throws {PairingError} If any point is invalid
 */
export function pairingCheck(pairs) {
	// Validate all points
	for (const [p1, p2] of pairs) {
		if (!G1.isOnCurve(p1)) {
			throw new PairingError("G1 point not on curve");
		}
		if (!G2.isOnCurve(p2)) {
			throw new PairingError("G2 point not on curve");
		}
	}

	// Empty pairing check returns true (identity)
	if (pairs.length === 0) {
		return true;
	}

	// For full implementation, we would:
	// 1. Compute Miller loop for each pair
	// 2. Multiply the results in Fp12
	// 3. Apply final exponentiation
	// 4. Check if result equals 1 in GT

	// This is a placeholder that indicates pairing check is not implemented in pure JS
	// For production, use native blst bindings
	throw new PairingError(
		"Full pairing not implemented in pure JS. Use native blst bindings for production.",
	);
}

/**
 * Compute single pairing e(P, Q)
 *
 * @param {import('../G1PointType.js').G1PointType} p - G1 point
 * @param {import('../G2PointType.js').G2PointType} q - G2 point
 * @returns {never} Throws - not implemented in pure JS
 * @throws {PairingError}
 */
export function pair(p, q) {
	if (!G1.isOnCurve(p)) {
		throw new PairingError("G1 point not on curve");
	}
	if (!G2.isOnCurve(q)) {
		throw new PairingError("G2 point not on curve");
	}

	// Full pairing requires:
	// 1. Miller loop computation
	// 2. Final exponentiation

	throw new PairingError(
		"Full pairing not implemented in pure JS. Use native blst bindings for production.",
	);
}

/**
 * Verify BLS signature using pairing check
 * Verifies: e(signature, G2_generator) = e(H(message), publicKey)
 * Equivalent to: e(signature, G2_gen) * e(-H(msg), pubKey) = 1
 *
 * @param {import('../G1PointType.js').G1PointType} signature - Signature (G1 point)
 * @param {import('../G2PointType.js').G2PointType} publicKey - Public key (G2 point)
 * @param {import('../G1PointType.js').G1PointType} messagePoint - Hashed message (G1 point)
 * @returns {boolean} True if signature is valid
 * @throws {PairingError}
 */
export function verifySignature(signature, publicKey, messagePoint) {
	const g2Gen = G2.generator();
	const negMessage = G1.negate(messagePoint);

	return pairingCheck([
		[signature, g2Gen],
		[negMessage, publicKey],
	]);
}

/**
 * Verify aggregate BLS signature (same message)
 * All signers signed the same message.
 *
 * @param {import('../G1PointType.js').G1PointType} aggregatedSignature - Aggregated signature (G1 point)
 * @param {import('../G2PointType.js').G2PointType} aggregatedPublicKey - Aggregated public key (G2 point)
 * @param {import('../G1PointType.js').G1PointType} messagePoint - Hashed message (G1 point)
 * @returns {boolean} True if aggregate signature is valid
 * @throws {PairingError}
 */
export function verifyAggregateSignature(
	aggregatedSignature,
	aggregatedPublicKey,
	messagePoint,
) {
	return verifySignature(
		aggregatedSignature,
		aggregatedPublicKey,
		messagePoint,
	);
}

/**
 * Batch verify multiple BLS signatures on different messages
 *
 * @param {Array<{signature: import('../G1PointType.js').G1PointType, publicKey: import('../G2PointType.js').G2PointType, messagePoint: import('../G1PointType.js').G1PointType}>} items - Array of signature verification items
 * @returns {boolean} True if all signatures are valid
 * @throws {PairingError}
 */
export function batchVerify(items) {
	if (items.length === 0) return true;

	const g2Gen = G2.generator();

	// Aggregate all signatures
	let aggSig = G1.infinity();
	for (const item of items) {
		aggSig = G1.add(aggSig, item.signature);
	}

	// Build pairing check: e(aggSig, G2) * prod(e(-H(msg_i), pk_i)) = 1
	/** @type {Array<[import('../G1PointType.js').G1PointType, import('../G2PointType.js').G2PointType]>} */
	const pairs = [[aggSig, g2Gen]];

	for (const item of items) {
		pairs.push([G1.negate(item.messagePoint), item.publicKey]);
	}

	return pairingCheck(pairs);
}
