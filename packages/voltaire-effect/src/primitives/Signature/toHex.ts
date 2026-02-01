/**
 * @fileoverview Converts Signature to hex string.
 * @module Signature/toHex
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Converts a Signature to a hex string with 0x prefix.
 *
 * @param signature - The SignatureType to convert
 * @returns Hex string (130 chars for secp256k1 with v, 128 chars otherwise)
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const hex = Signature.toHex(sig) // "0x..."
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (signature: SignatureType): string =>
	Signature.toHex(signature);
