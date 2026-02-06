/**
 * @fileoverview Converts Signature to tuple format.
 * @module Signature/toTuple
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Tuple signature format: [yParity, r, s].
 */
export type SignatureTuple = readonly [number, Uint8Array, Uint8Array];

/**
 * Converts a Signature to tuple format [yParity, r, s].
 *
 * @param signature - The SignatureType to convert
 * @returns Tuple of [yParity (0 or 1), r (32 bytes), s (32 bytes)]
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const [yParity, r, s] = Signature.toTuple(sig)
 * ```
 *
 * @since 0.0.1
 */
export const toTuple = (signature: SignatureType): SignatureTuple =>
	Signature.toTuple(signature);
