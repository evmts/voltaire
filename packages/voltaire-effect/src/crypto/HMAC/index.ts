/**
 * @fileoverview HMAC (Hash-based Message Authentication Code) module for Effect.
 *
 * @description
 * Provides keyed hash authentication for data integrity and authenticity.
 * HMAC combines a secret key with a hash function to create authentication
 * codes that can be verified only by parties with the same key.
 *
 * Key features:
 * - HMAC-SHA256 (32-byte output)
 * - HMAC-SHA512 (64-byte output)
 * - Used in JWTs, API authentication, key derivation
 * - Constant-time verification resistant to timing attacks
 *
 * @example
 * ```typescript
 * import { hmacSha256, hmacSha512, HMACLive } from 'voltaire-effect/crypto/HMAC'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = new TextEncoder().encode('secret')
 *   const message = new TextEncoder().encode('data')
 *   const mac = yield* hmacSha256(key, message)
 *   return mac
 * }).pipe(Effect.provide(HMACLive))
 *
 * const result = await Effect.runPromise(program)
 * ```
 *
 * @module HMAC
 * @since 0.0.1
 */
export {
	HMACLive,
	HMACService,
	type HMACServiceShape,
	HMACTest,
} from "./HMACService.js";
export { hmacSha256, hmacSha512 } from "./operations.js";
