/**
 * @fileoverview Creates Signature values from various input formats with Effect error handling.
 *
 * @module Signature/from
 * @since 0.0.1
 */
import { Signature, type SignatureType, InvalidSignatureFormatError, InvalidSignatureLengthError } from '@tevm/voltaire/Signature'
import * as Effect from 'effect/Effect'

/**
 * Creates a Signature from various input formats.
 *
 * @description Flexibly constructs a SignatureType from multiple input formats:
 * - Raw bytes (Uint8Array of 64 or 65 bytes)
 * - r/s/v components for secp256k1 or p256 signatures
 * - Raw signature bytes for ed25519
 *
 * @param {Uint8Array | { r: Uint8Array; s: Uint8Array; v?: number; algorithm?: 'secp256k1' | 'p256' } | { signature: Uint8Array; algorithm: 'ed25519' }} value - The signature input in one of the supported formats
 * @returns {Effect.Effect<SignatureType, InvalidSignatureFormatError | InvalidSignatureLengthError>} Effect containing the SignatureType on success, or an error if the input is invalid
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * // From r, s, v components (secp256k1)
 * const sig1 = await Effect.runPromise(Signature.from({
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32),
 *   v: 27,
 *   algorithm: 'secp256k1'
 * }))
 *
 * // From p256 components (WebAuthn)
 * const sig2 = await Effect.runPromise(Signature.from({
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32),
 *   algorithm: 'p256'
 * }))
 *
 * // From ed25519 bytes
 * const sig3 = await Effect.runPromise(Signature.from({
 *   signature: new Uint8Array(64),
 *   algorithm: 'ed25519'
 * }))
 * ```
 *
 * @throws {InvalidSignatureFormatError} When the input format is not recognized
 * @throws {InvalidSignatureLengthError} When r, s, or signature bytes have invalid length
 *
 * @see {@link fromHex} - Create from hex string
 * @see {@link fromBytes} - Create from raw bytes
 *
 * @since 0.0.1
 */
export const from = (
  value: Uint8Array | { r: Uint8Array; s: Uint8Array; v?: number; algorithm?: 'secp256k1' | 'p256' } | { signature: Uint8Array; algorithm: 'ed25519' }
): Effect.Effect<SignatureType, InvalidSignatureFormatError | InvalidSignatureLengthError> =>
  Effect.try({
    try: () => Signature.from(value as Parameters<typeof Signature.from>[0]),
    catch: (e) => e as InvalidSignatureFormatError | InvalidSignatureLengthError
  })

/**
 * Creates a Signature from a hex string.
 *
 * @description Parses a hex-encoded signature string and creates a SignatureType.
 * The algorithm is detected based on the signature length:
 * - 65 bytes (132 chars with 0x): secp256k1 with recovery byte
 * - 64 bytes (130 chars with 0x): secp256k1/p256 without recovery or ed25519
 *
 * @param {string} hex - The hex-encoded signature (must be 0x-prefixed)
 * @returns {Effect.Effect<SignatureType, InvalidSignatureFormatError | InvalidSignatureLengthError>} Effect containing the SignatureType on success, or an error if parsing fails
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse a secp256k1 signature with recovery byte
 * const sig = await Effect.runPromise(
 *   Signature.fromHex('0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b')
 * )
 *
 * // Handle potential errors
 * const result = await Effect.runPromise(
 *   Effect.either(Signature.fromHex(userInput))
 * )
 * ```
 *
 * @throws {InvalidSignatureFormatError} When hex string is malformed
 * @throws {InvalidSignatureLengthError} When decoded bytes have invalid length
 *
 * @see {@link from} - Create from components
 * @see {@link fromBytes} - Create from raw bytes
 * @see {@link SignatureSchema} - Schema-based validation alternative
 *
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<SignatureType, InvalidSignatureFormatError | InvalidSignatureLengthError> =>
  Effect.try({
    try: () => Signature.fromHex(hex),
    catch: (e) => e as InvalidSignatureFormatError | InvalidSignatureLengthError
  })

/**
 * Creates a Signature from raw bytes.
 *
 * @description Parses raw signature bytes and creates a SignatureType.
 * Supports 64-byte (r+s) and 65-byte (r+s+v) signature formats.
 * Algorithm detection is based on the byte length and format.
 *
 * @param {Uint8Array} bytes - The raw signature bytes (64 or 65 bytes)
 * @returns {Effect.Effect<SignatureType, InvalidSignatureFormatError | InvalidSignatureLengthError>} Effect containing the SignatureType on success, or an error if parsing fails
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse a 65-byte secp256k1 signature
 * const sig = await Effect.runPromise(
 *   Signature.fromBytes(rawSignatureBytes)
 * )
 *
 * // Chain with other operations
 * const hex = await Effect.runPromise(
 *   Signature.fromBytes(bytes).pipe(
 *     Effect.map(Signature.toHex)
 *   )
 * )
 * ```
 *
 * @throws {InvalidSignatureFormatError} When bytes format is not recognized
 * @throws {InvalidSignatureLengthError} When bytes length is not 64 or 65
 *
 * @see {@link from} - Create from components
 * @see {@link fromHex} - Create from hex string
 * @see {@link SignatureFromBytesSchema} - Schema-based validation alternative
 *
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<SignatureType, InvalidSignatureFormatError | InvalidSignatureLengthError> =>
  Effect.try({
    try: () => Signature.fromBytes(bytes),
    catch: (e) => e as InvalidSignatureFormatError | InvalidSignatureLengthError
  })
