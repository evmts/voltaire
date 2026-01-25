/**
 * @fileoverview Type guard for SignatureType (alias for is).
 * @module Signature/isSignature
 * @since 0.0.1
 */
import { Signature, type SignatureType } from '@tevm/voltaire/Signature'

/**
 * Checks if a value is a SignatureType (alias for is).
 *
 * @param value - Value to check
 * @returns True if value is a SignatureType
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * if (Signature.isSignature(value)) {
 *   console.log(value.algorithm)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const isSignature = (value: unknown): value is SignatureType =>
  Signature.isSignature(value)
