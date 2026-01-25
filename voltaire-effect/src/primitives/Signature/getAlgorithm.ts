/**
 * @fileoverview Gets algorithm from Signature.
 * @module Signature/getAlgorithm
 * @since 0.0.1
 */
import {
	Signature,
	type SignatureAlgorithm,
	type SignatureType,
} from "@tevm/voltaire/Signature";

/**
 * Gets the algorithm of a Signature.
 *
 * @param signature - The SignatureType to get algorithm from
 * @returns The signature algorithm
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const algorithm = Signature.getAlgorithm(sig)
 * // "secp256k1" | "p256" | "ed25519"
 * ```
 *
 * @since 0.0.1
 */
export const getAlgorithm = (signature: SignatureType): SignatureAlgorithm =>
	Signature.getAlgorithm(signature);
