/**
 * @fileoverview Production layer for Secp256k1Service.
 * Provides the real secp256k1 cryptographic implementation.
 *
 * @module Secp256k1/Secp256k1Live
 * @since 0.0.1
 */

import * as Secp256k1 from "@tevm/voltaire/Secp256k1";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { mapToSecp256k1Error } from "./errors.js";
import { Secp256k1Service } from "./Secp256k1Service.js";

/**
 * Production layer for Secp256k1Service using native secp256k1 implementation.
 *
 * @description
 * Provides the real secp256k1 ECDSA implementation from the voltaire library.
 * Use this layer in production applications for cryptographically secure
 * signing, verification, and public key recovery.
 *
 * The underlying implementation uses optimized native code (Zig/Rust) for
 * high-performance elliptic curve operations.
 *
 * @example Providing the live layer
 * ```typescript
 * import { Secp256k1Service, Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const secp = yield* Secp256k1Service
 *   return yield* secp.sign(messageHash, privateKey)
 * })
 *
 * const signature = await Effect.runPromise(program.pipe(Effect.provide(Secp256k1Live)))
 * ```
 *
 * @example Merging with other crypto layers
 * ```typescript
 * import { Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import { KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 * import { SHA256Live } from 'voltaire-effect/crypto/SHA256'
 * import * as Layer from 'effect/Layer'
 *
 * const CryptoLive = Layer.mergeAll(Secp256k1Live, KeccakLive, SHA256Live)
 *
 * const program = mySigningProgram.pipe(Effect.provide(CryptoLive))
 * ```
 *
 * @example Using in a larger application layer
 * ```typescript
 * import { Secp256k1Live } from 'voltaire-effect/crypto/Secp256k1'
 * import * as Layer from 'effect/Layer'
 *
 * const AppLive = Layer.mergeAll(
 *   Secp256k1Live,
 *   DatabaseLive,
 *   LoggerLive
 * )
 * ```
 *
 * @see {@link Secp256k1Service} - The service tag
 * @see {@link Secp256k1Test} - Test implementation for unit tests
 * @since 0.0.1
 */
export const Secp256k1Live = Layer.succeed(Secp256k1Service, {
	sign: (messageHash, privateKey, options) =>
		Effect.try({
			try: () => Secp256k1.sign(messageHash, privateKey as any, options),
			catch: (e) => mapToSecp256k1Error(e, "sign"),
		}),
	recover: (signature, messageHash) =>
		Effect.try({
			try: () => Secp256k1.recoverPublicKey(signature, messageHash),
			catch: (e) => mapToSecp256k1Error(e, "recover"),
		}),
	verify: (signature, messageHash, publicKey) =>
		Effect.try({
			try: () => Secp256k1.verify(signature, messageHash, publicKey),
			catch: (e) => mapToSecp256k1Error(e, "verify"),
		}),
});
