/**
 * @fileoverview Standalone HMAC operations for Effect-based applications.
 * @module HMAC/operations
 * @since 0.0.1
 */

import type { HMACType } from "@tevm/voltaire/HMAC";
import * as Effect from "effect/Effect";
import { HMACService } from "./HMACService.js";

/**
 * Computes HMAC-SHA256 for message authentication.
 *
 * @description
 * Produces a 32-byte keyed authentication code using SHA-256. HMAC-SHA256
 * is widely used in authentication protocols including:
 *
 * - AWS Signature Version 4
 * - JWT HS256 signatures
 * - OAuth 1.0 signatures
 * - Webhook verification
 *
 * @param key - The secret key (any length, recommended 32+ bytes)
 * @param message - The message to authenticate
 * @returns Effect containing the 32-byte HMAC, requiring HMACService
 *
 * @example
 * ```typescript
 * import { hmacSha256, HMACLive } from 'voltaire-effect/crypto/HMAC'
 * import * as Effect from 'effect/Effect'
 *
 * // Compute HMAC-SHA256
 * const key = new TextEncoder().encode('secret-key')
 * const message = new TextEncoder().encode('Hello, HMAC!')
 *
 * const mac = await Effect.runPromise(
 *   hmacSha256(key, message).pipe(Effect.provide(HMACLive))
 * )
 * console.log(mac.length) // 32
 *
 * // Verify a webhook signature
 * const verifyWebhook = Effect.gen(function* () {
 *   const expected = yield* hmacSha256(webhookSecret, payload)
 *   return constantTimeEqual(expected, providedSignature)
 * }).pipe(Effect.provide(HMACLive))
 * ```
 *
 * @throws Never - This operation is infallible
 * @see {@link hmacSha512} - For stronger security (64-byte output)
 * @see {@link HMACService} - Full service interface
 * @since 0.0.1
 */
export const hmacSha256 = (
	key: Uint8Array,
	message: Uint8Array,
): Effect.Effect<HMACType, never, HMACService> =>
	Effect.gen(function* () {
		const hmac = yield* HMACService;
		return yield* hmac.sha256(key, message);
	});

/**
 * Computes HMAC-SHA512 for message authentication.
 *
 * @description
 * Produces a 64-byte keyed authentication code using SHA-512. HMAC-SHA512
 * provides stronger security than HMAC-SHA256 and is used in:
 *
 * - BIP-32 HD wallet key derivation
 * - JWT HS512 signatures
 * - High-security authentication systems
 *
 * @param key - The secret key (any length, recommended 64+ bytes)
 * @param message - The message to authenticate
 * @returns Effect containing the 64-byte HMAC, requiring HMACService
 *
 * @example
 * ```typescript
 * import { hmacSha512, HMACLive } from 'voltaire-effect/crypto/HMAC'
 * import * as Effect from 'effect/Effect'
 *
 * // Compute HMAC-SHA512
 * const key = new TextEncoder().encode('master-secret')
 * const message = new TextEncoder().encode('Bitcoin seed')
 *
 * const mac = await Effect.runPromise(
 *   hmacSha512(key, message).pipe(Effect.provide(HMACLive))
 * )
 * console.log(mac.length) // 64
 *
 * // BIP-32 style key derivation
 * const deriveKey = Effect.gen(function* () {
 *   const I = yield* hmacSha512(chainCode, data)
 *   const IL = I.slice(0, 32)  // Private key
 *   const IR = I.slice(32)     // Chain code
 *   return { privateKey: IL, chainCode: IR }
 * }).pipe(Effect.provide(HMACLive))
 * ```
 *
 * @throws Never - This operation is infallible
 * @see {@link hmacSha256} - For 32-byte output
 * @see {@link HMACService} - Full service interface
 * @since 0.0.1
 */
export const hmacSha512 = (
	key: Uint8Array,
	message: Uint8Array,
): Effect.Effect<HMACType, never, HMACService> =>
	Effect.gen(function* () {
		const hmac = yield* HMACService;
		return yield* hmac.sha512(key, message);
	});
