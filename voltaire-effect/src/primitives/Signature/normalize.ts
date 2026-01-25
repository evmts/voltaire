/**
 * @fileoverview Normalizes ECDSA signature to canonical form.
 * @module Signature/normalize
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Normalizes an ECDSA signature to canonical form (s = n - s if s > n/2).
 *
 * @param signature - The SignatureType to normalize
 * @returns Normalized signature
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const normalized = Signature.normalize(sig)
 * ```
 *
 * @since 0.0.1
 */
export const normalize = (signature: SignatureType): SignatureType =>
	Signature.normalize(signature);
