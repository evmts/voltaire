/**
 * @fileoverview Type guard for SignatureType.
 * @module Signature/is
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * Checks if a value is a SignatureType.
 *
 * @param value - Value to check
 * @returns True if value is a SignatureType
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * if (Signature.is(value)) {
 *   console.log(value.algorithm)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const is = (value: unknown): value is SignatureType =>
	Signature.is(value);
