/**
 * @fileoverview Gets S component from Signature.
 * @module Signature/getS
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Gets the S component of a signature as a 32-byte Uint8Array.
 *
 * @param signature - The SignatureType to extract S from
 * @returns 32-byte Uint8Array containing the S value
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const s = Signature.getS(sig)
 * ```
 *
 * @since 0.0.1
 */
export const getS = (signature: SignatureType): Uint8Array =>
	Signature.getS(signature);
