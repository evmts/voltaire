/**
 * @fileoverview Gets V component from Signature.
 * @module Signature/getV
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Gets the V (recovery) component of a signature.
 *
 * @param signature - The SignatureType to extract V from
 * @returns Recovery value (27, 28, or chainId-derived) or undefined if not present
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const v = Signature.getV(sig) // 27, 28, or undefined
 * ```
 *
 * @since 0.0.1
 */
export const getV = (signature: SignatureType): number | undefined =>
	Signature.getV(signature);
