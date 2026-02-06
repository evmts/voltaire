/**
 * @fileoverview Gets R component from Signature.
 * @module Signature/getR
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Gets the R component of a signature as a 32-byte Uint8Array.
 *
 * @param signature - The SignatureType to extract R from
 * @returns 32-byte Uint8Array containing the R value
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const r = Signature.getR(sig)
 * ```
 *
 * @since 0.0.1
 */
export const getR = (signature: SignatureType): Uint8Array =>
	Signature.getR(signature);
