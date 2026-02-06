/**
 * @fileoverview Converts Signature to DER format.
 * @module Signature/toDER
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Converts a Signature to DER-encoded bytes.
 *
 * @param signature - The SignatureType to convert
 * @returns DER-encoded signature bytes
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const der = Signature.toDER(sig)
 * ```
 *
 * @since 0.0.1
 */
export const toDER = (signature: SignatureType): Uint8Array =>
	Signature.toDER(signature);
