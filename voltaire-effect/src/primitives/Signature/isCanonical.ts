/**
 * @fileoverview Checks if ECDSA signature has canonical s-value.
 * @module Signature/isCanonical
 * @since 0.0.1
 */
import { Signature, type SignatureType } from '@tevm/voltaire/Signature'

/**
 * Checks if an ECDSA signature has canonical s-value (s <= n/2).
 *
 * A canonical signature prevents signature malleability.
 *
 * @param signature - The SignatureType to check
 * @returns True if signature is canonical or Ed25519
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * if (!Signature.isCanonical(sig)) {
 *   sig = Signature.normalize(sig)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const isCanonical = (signature: SignatureType): boolean =>
  Signature.isCanonical(signature)
