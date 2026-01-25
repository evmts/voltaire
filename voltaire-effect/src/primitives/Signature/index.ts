/**
 * @fileoverview Effect-based module for working with cryptographic signatures.
 *
 * This module provides type-safe, Effect-wrapped operations for creating,
 * validating, and working with cryptographic signatures. Supports multiple
 * signature algorithms commonly used in Ethereum and blockchain contexts.
 *
 * Supported algorithms:
 * - **secp256k1**: ECDSA signatures (Ethereum transactions, message signing)
 * - **p256**: NIST P-256 / secp256r1 (WebAuthn, passkeys)
 * - **ed25519**: EdDSA signatures (high-performance, deterministic)
 *
 * @module Signature
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as Effect from 'effect/Effect'
 *
 * // Create signature from hex string
 * const sig = await Effect.runPromise(
 *   Signature.fromHex('0x...')
 * )
 *
 * // Create from r, s, v components
 * const sig2 = await Effect.runPromise(
 *   Signature.from({
 *     r: new Uint8Array(32),
 *     s: new Uint8Array(32),
 *     v: 27,
 *     algorithm: 'secp256k1'
 *   })
 * )
 *
 * // Use Effect Schema for validation
 * import * as S from 'effect/Schema'
 * const validated = S.decodeSync(Signature.SignatureSchema)('0x...')
 * ```
 *
 * @see {@link from} - Create Signature from components
 * @see {@link fromHex} - Create Signature from hex string
 * @see {@link fromBytes} - Create Signature from raw bytes
 * @see {@link SignatureSchema} - Effect Schema for validation
 */
export { SignatureSchema, SignatureFromBytesSchema } from './SignatureSchema.js'
export { from, fromHex, fromBytes } from './from.js'
