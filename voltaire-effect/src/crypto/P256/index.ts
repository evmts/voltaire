/**
 * @fileoverview P-256 (secp256r1/NIST P-256) cryptographic module for Effect.
 *
 * @description
 * Provides P-256 (secp256r1) ECDSA signatures for WebAuthn, TLS, and
 * hardware security module compatibility. P-256 is the NIST-recommended
 * elliptic curve with broad industry support.
 *
 * Key features:
 * - NIST P-256 (secp256r1) ECDSA signatures
 * - WebAuthn/FIDO2 passkey compatibility
 * - TLS/SSL certificate support
 * - Hardware Security Module (HSM) compatibility
 * - EIP-7212 Ethereum secp256r1 precompile support
 *
 * @example
 * ```typescript
 * import { sign, verify, P256Live } from 'voltaire-effect/crypto/P256'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const signature = yield* sign(messageHash, privateKey)
 *   const isValid = yield* verify(signature, messageHash, publicKey)
 *   return isValid
 * })
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @module P256
 * @since 0.0.1
 */
export { sign } from './sign.js'
export { verify } from './verify.js'
export { P256Service, type P256ServiceShape } from './P256Service.js'
export { P256Live } from './P256Live.js'
