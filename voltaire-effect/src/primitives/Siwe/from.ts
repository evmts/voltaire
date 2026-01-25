import { Siwe, BrandedSiwe, Address } from '@tevm/voltaire'
import type { SiweMessageType, ValidationResult } from './SiweSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when SIWE message creation or parsing fails.
 *
 * @example
 * ```typescript
 * import { Siwe } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(Siwe.parse('invalid')).catch(e => {
 *   if (e._tag === 'SiweError') {
 *     console.error('SIWE error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class SiweError {
  readonly _tag = 'SiweError'
  constructor(readonly message: string) {}
}

/**
 * Parameters for creating a new SIWE message.
 *
 * @since 0.0.1
 */
export type CreateParams = {
  domain: string
  address: string | Uint8Array
  uri: string
  chainId: number
  statement?: string
  expirationTime?: string
  notBefore?: string
  requestId?: string
  resources?: string[]
  nonce?: string
  issuedAt?: string
}

/**
 * Creates a new SIWE (Sign-In with Ethereum) message.
 *
 * @param {CreateParams} params - The message parameters
 * @returns {Effect.Effect<SiweMessageType, SiweError>} Effect containing the SIWE message or an error
 *
 * @example
 * ```typescript
 * import { Siwe } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const message = yield* Siwe.create({
 *     domain: 'example.com',
 *     address: '0x1234567890123456789012345678901234567890',
 *     uri: 'https://example.com',
 *     chainId: 1,
 *     statement: 'Sign in to Example'
 *   })
 *   return message
 * })
 * ```
 *
 * @since 0.0.1
 */
export const create = (params: CreateParams): Effect.Effect<SiweMessageType, SiweError> =>
  Effect.try({
    try: () => {
      const addr = typeof params.address === 'string' ? Address(params.address) : params.address
      return Siwe.create({
        ...params,
        address: addr as Parameters<typeof Siwe.create>[0]['address']
      })
    },
    catch: (e) => new SiweError((e as Error).message)
  })

/**
 * Parses a SIWE message from its string representation.
 *
 * @param {string} text - The formatted SIWE message string
 * @returns {Effect.Effect<SiweMessageType, SiweError>} Effect containing the parsed message or an error
 *
 * @example
 * ```typescript
 * import { Siwe } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const siweText = `example.com wants you to sign in with your Ethereum account:
 * 0x1234567890123456789012345678901234567890
 * ...`
 *
 * const message = Siwe.parse(siweText)
 * ```
 *
 * @since 0.0.1
 */
export const parse = (text: string): Effect.Effect<SiweMessageType, SiweError> =>
  Effect.try({
    try: () => Siwe.parse(text),
    catch: (e) => new SiweError((e as Error).message)
  })

/**
 * Formats a SIWE message into its string representation.
 *
 * @param {SiweMessageType} message - The SIWE message to format
 * @returns {string} The formatted message string
 *
 * @example
 * ```typescript
 * import { Siwe } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const message = yield* Siwe.create({ ... })
 *   const text = Siwe.format(message)
 *   console.log(text)
 * })
 * ```
 *
 * @since 0.0.1
 */
export const format = (message: SiweMessageType): string => Siwe.format(message)

/**
 * Validates a SIWE message for expiration, not-before time, and other constraints.
 *
 * @param {SiweMessageType} message - The SIWE message to validate
 * @param {Object} [options] - Validation options
 * @param {Date} [options.now] - The current time for validation (defaults to now)
 * @returns {ValidationResult} The validation result
 *
 * @example
 * ```typescript
 * import { Siwe } from 'voltaire-effect/primitives'
 *
 * const result = Siwe.validate(message)
 * if (result.success) {
 *   console.log('Message is valid')
 * } else {
 *   console.error('Validation failed:', result.error)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const validate = (message: SiweMessageType, options?: { now?: Date }): ValidationResult =>
  Siwe.validate(message, options)

/**
 * Generates a cryptographically secure random nonce for SIWE messages.
 *
 * @param {number} [length] - The length of the nonce (defaults to 16)
 * @returns {string} The generated nonce
 *
 * @example
 * ```typescript
 * import { Siwe } from 'voltaire-effect/primitives'
 *
 * const nonce = Siwe.generateNonce()
 * console.log(nonce) // e.g., 'a1b2c3d4e5f6g7h8'
 * ```
 *
 * @since 0.0.1
 */
export const generateNonce = (length?: number): string => Siwe.generateNonce(length)
