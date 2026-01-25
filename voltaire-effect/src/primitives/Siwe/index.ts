/**
 * @module Siwe
 *
 * Effect-based module for Sign-In with Ethereum (SIWE) message handling.
 * Implements EIP-4361 for authenticating users with their Ethereum accounts.
 *
 * @example
 * ```typescript
 * import { Siwe } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const message = yield* Siwe.create({
 *     domain: 'example.com',
 *     address: '0x...',
 *     uri: 'https://example.com',
 *     chainId: 1
 *   })
 *   const text = Siwe.format(message)
 *   return text
 * })
 * ```
 *
 * @since 0.0.1
 */
export { Schema, SiweMessageSchema, type SiweMessageType, type ValidationResult } from './SiweSchema.js'
export { create, parse, format, validate, generateNonce, SiweError, type CreateParams } from './from.js'
