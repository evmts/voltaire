/**
 * @fileoverview Converts Signature to hex string.
 * @module Signature/toHex
 * @since 0.0.1
 */
import { Signature, type SignatureType } from '@tevm/voltaire/Signature'

/**
 * Converts a Signature to hex string.
 *
 * @param signature - The SignatureType to convert
 * @param includeV - Include v byte for secp256k1 (default: true)
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const hex = Signature.toHex(sig)
 * // "0x..." (130 chars with v, 128 chars without)
 *
 * const hexNoV = Signature.toHex(sig, false)
 * // "0x..." (128 chars)
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (signature: SignatureType, includeV = true): string =>
  Signature.toHex(signature, includeV)
