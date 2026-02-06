/**
 * @fileoverview Creates Signature from P-256 components.
 * @module Signature/fromP256
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Creates a P-256 Signature from r and s components.
 *
 * @param r - 32-byte R component
 * @param s - 32-byte S component
 * @returns SignatureType with p256 algorithm
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const sig = Signature.fromP256(r, s)
 * ```
 *
 * @since 0.0.1
 */
export const fromP256 = (r: Uint8Array, s: Uint8Array): SignatureType =>
	Signature.fromP256(r, s);
