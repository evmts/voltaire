/**
 * @fileoverview BLS12-381 signature aggregation function for Effect-based applications.
 * @module Bls12381/aggregate
 * @since 0.0.1
 */

import type { SignatureError } from "@tevm/voltaire/Bls12381";
import * as Bls12381 from "@tevm/voltaire/Bls12381";
import * as Effect from "effect/Effect";

/**
 * Aggregates multiple BLS12-381 signatures into a single signature.
 *
 * @description
 * Combines multiple BLS signatures into a single compact signature that can
 * prove all original signers signed their respective messages. This is the
 * killer feature of BLS signatures - n signatures become 1 signature.
 *
 * Use cases:
 * - Ethereum 2.0: Aggregate thousands of validator signatures per slot
 * - Multi-sig wallets: Combine signatures from multiple parties
 * - Rollups: Batch many transaction signatures
 *
 * The aggregated signature is the same size (96 bytes) regardless of how
 * many signatures were combined.
 *
 * @param signatures - Array of 96-byte BLS signatures to aggregate
 * @returns Effect containing the aggregated 96-byte signature
 *
 * @example
 * ```typescript
 * import { aggregate, sign, verify } from 'voltaire-effect/crypto/Bls12381'
 * import * as Effect from 'effect/Effect'
 *
 * // Aggregate multiple signatures
 * const aggregatedSig = await Effect.runPromise(aggregate([sig1, sig2, sig3]))
 * console.log(aggregatedSig.length) // 96 (same as single signature)
 *
 * // Complete aggregation workflow
 * const aggregateValidatorSigs = Effect.gen(function* () {
 *   // Sign messages from multiple validators
 *   const sig1 = yield* sign(attestation1, validatorKey1)
 *   const sig2 = yield* sign(attestation2, validatorKey2)
 *   const sig3 = yield* sign(attestation3, validatorKey3)
 *
 *   // Aggregate into single signature
 *   const aggregated = yield* aggregate([sig1, sig2, sig3])
 *
 *   // Single signature proves all 3 validators signed
 *   return aggregated
 * })
 * ```
 *
 * @throws SignatureError - When any signature is malformed or aggregation fails
 * @see {@link sign} - Create signatures to aggregate
 * @see {@link verify} - Verify aggregated signatures
 * @see {@link Bls12381Service} - Full service interface
 * @since 0.0.1
 */
export const aggregate = (
	signatures: Uint8Array[],
): Effect.Effect<Uint8Array, SignatureError> =>
	Effect.try({
		try: () => Bls12381.aggregate(signatures),
		catch: (e) => e as SignatureError,
	});
