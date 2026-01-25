/**
 * @fileoverview Checks equality of two Signatures.
 * @module Signature/equals
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Checks if two Signatures are equal.
 *
 * @param a - First signature
 * @param b - Second signature
 * @returns True if signatures are equal
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const isEqual = Signature.equals(sig1, sig2)
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: SignatureType, b: SignatureType): boolean =>
	Signature.equals(a, b);
