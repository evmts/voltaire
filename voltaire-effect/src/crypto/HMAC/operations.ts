import type { HMACType } from '@tevm/voltaire/HMAC'
import * as Effect from 'effect/Effect'
import { HMACService } from './HMACService.js'

/**
 * Computes HMAC-SHA256 for message authentication.
 *
 * @param key - The secret key
 * @param message - The message to authenticate
 * @returns Effect containing the 32-byte HMAC, requiring HMACService
 * @since 0.0.1
 */
export const hmacSha256 = (key: Uint8Array, message: Uint8Array): Effect.Effect<HMACType, never, HMACService> =>
  Effect.gen(function* () {
    const hmac = yield* HMACService
    return yield* hmac.sha256(key, message)
  })

/**
 * Computes HMAC-SHA512 for message authentication.
 *
 * @param key - The secret key
 * @param message - The message to authenticate
 * @returns Effect containing the 64-byte HMAC, requiring HMACService
 * @since 0.0.1
 */
export const hmacSha512 = (key: Uint8Array, message: Uint8Array): Effect.Effect<HMACType, never, HMACService> =>
  Effect.gen(function* () {
    const hmac = yield* HMACService
    return yield* hmac.sha512(key, message)
  })
