/**
 * @fileoverview Creates Signature from secp256k1 components.
 * @module Signature/fromSecp256k1
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Creates a secp256k1 Signature from r, s, and v components.
 *
 * @param r - 32-byte R component
 * @param s - 32-byte S component
 * @param v - Recovery value (27, 28, or chainId-derived)
 * @returns SignatureType with secp256k1 algorithm
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const sig = Signature.fromSecp256k1(r, s, 27)
 * ```
 *
 * @since 0.0.1
 */
export const fromSecp256k1 = (
	r: Uint8Array,
	s: Uint8Array,
	v: number,
): SignatureType => Signature.fromSecp256k1(r, s, v);
