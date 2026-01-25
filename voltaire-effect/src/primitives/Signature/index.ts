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

// Schemas
export { SignatureSchema, SignatureFromBytesSchema } from './SignatureSchema.js'

// Constructors (fallible)
export { from, fromHex, fromBytes } from './from.js'
export { fromCompact } from './fromCompact.js'
export { fromDER } from './fromDER.js'
export { fromRpc } from './fromRpc.js'
export { fromTuple } from './fromTuple.js'
export { fromSecp256k1 } from './fromSecp256k1.js'
export { fromP256 } from './fromP256.js'
export { fromEd25519 } from './fromEd25519.js'

// Converters (infallible)
export { toBytes } from './toBytes.js'
export { toCompact } from './toCompact.js'
export { toHex } from './toHex.js'

// Converters (fallible)
export { toDER } from './toDER.js'
export { toRpc } from './toRpc.js'
export { toTuple } from './toTuple.js'

// Accessors (fallible)
export { getR } from './getR.js'
export { getS } from './getS.js'
export { getV } from './getV.js'

// Accessors (infallible)
export { getAlgorithm } from './getAlgorithm.js'

// Utilities (infallible)
export { equals } from './equals.js'
export { is } from './is.js'
export { isSignature } from './isSignature.js'
export { isCanonical } from './isCanonical.js'
export { normalize } from './normalize.js'

// Verification (fallible)
export { verify } from './verify.js'
