/**
 * @fileoverview Converts Signature to raw bytes.
 * @module Signature/toBytes
 * @since 0.0.1
 */
import { Signature, type SignatureType } from '@tevm/voltaire/Signature'

/**
 * Converts a Signature to raw bytes (without metadata).
 *
 * @param signature - The SignatureType to convert
 * @returns Raw signature bytes (r + s for ECDSA, 64 bytes for Ed25519)
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const bytes = Signature.toBytes(sig)
 * ```
 *
 * @since 0.0.1
 */
export const toBytes = (signature: SignatureType): Uint8Array =>
  Signature.toBytes(signature)
