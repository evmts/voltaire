/**
 * @fileoverview Converts Signature to compact format (EIP-2098).
 * @module Signature/toCompact
 * @since 0.0.1
 */
import { Signature, type SignatureType } from '@tevm/voltaire/Signature'

/**
 * Converts a Signature to compact format (EIP-2098).
 *
 * The yParity is encoded in bit 255 of s.
 *
 * @param signature - The SignatureType to convert
 * @returns Compact signature (64 bytes with yParity in bit 255 of s)
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const compact = Signature.toCompact(sig)
 * ```
 *
 * @since 0.0.1
 */
export const toCompact = (signature: SignatureType): Uint8Array =>
  Signature.toCompact(signature)
