/**
 * @fileoverview Secp256k1 elliptic curve cryptography module for Effect.
 *
 * @description
 * This module provides the secp256k1 elliptic curve cryptographic operations
 * wrapped in Effect for type-safe, composable digital signature workflows.
 *
 * Secp256k1 is the standard Ethereum curve used for:
 * - Transaction signing and verification
 * - Message signing (personal_sign, EIP-712)
 * - Public key recovery from signatures
 * - Account/address derivation
 *
 * The module exports:
 * - {@link sign} - Sign a message hash with a private key
 * - {@link recover} - Recover public key from signature
 * - {@link verify} - Verify signature against public key
 * - {@link Secp256k1Service} - Effect service for dependency injection
 * - {@link Secp256k1Live} - Production implementation
 * - {@link Secp256k1Test} - Test implementation with mock values
 *
 * @example Signing a message
 * ```typescript
 * import { sign, Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const signature = await Effect.runPromise(sign(messageHash, privateKey))
 * ```
 *
 * @example Full sign-verify workflow using service
 * ```typescript
 * import { Secp256k1Service, Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const secp = yield* Secp256k1Service
 *   const sig = yield* secp.sign(messageHash, privateKey)
 *   const pubKey = yield* secp.recover(sig, messageHash)
 *   return yield* secp.verify(sig, messageHash, pubKey)
 * }).pipe(Effect.provide(Secp256k1Live))
 * ```
 *
 * @module Secp256k1
 * @since 0.0.1
 */

export { recover } from "./recover.js";
export { Secp256k1Live } from "./Secp256k1Live.js";
export {
	Secp256k1Service,
	type Secp256k1ServiceShape,
	type SignOptions,
} from "./Secp256k1Service.js";
export { Secp256k1Test } from "./Secp256k1Test.js";
export { sign } from "./sign.js";
export { verify } from "./verify.js";
