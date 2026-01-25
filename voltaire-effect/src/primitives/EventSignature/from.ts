/**
 * @fileoverview Effect-based functions for creating and manipulating event signatures.
 * @module EventSignature/from
 * @since 0.0.1
 *
 * @description
 * Provides Effect-wrapped operations for creating and comparing event signatures.
 * Event signatures are 32-byte keccak256 hashes used as topic 0 in event logs.
 */

import { EventSignature } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { EventSignatureType, EventSignatureLike } from './EventSignatureSchema.js'

/**
 * Error thrown when event signature operations fail.
 *
 * @description
 * This error occurs when attempting to create an event signature from invalid input,
 * such as a malformed event definition or invalid hex string.
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const result = EventSignature.from('invalid event')
 * Effect.runSync(Effect.either(result))
 * // Left(EventSignatureError { message: 'Invalid event signature' })
 * ```
 *
 * @see {@link from} for the function that throws this error
 * @since 0.0.1
 */
export class EventSignatureError extends Error {
  /** Discriminant tag for Effect error handling */
  readonly _tag = 'EventSignatureError'

  /**
   * Creates a new EventSignatureError.
   * @param message - Description of what went wrong
   */
  constructor(message: string) {
    super(message)
    this.name = 'EventSignatureError'
  }
}

/**
 * Creates an EventSignature from various input types.
 *
 * @description
 * Accepts event definition strings, hex-encoded topics, or raw bytes.
 * For event definition strings, computes keccak256 hash automatically.
 *
 * @param value - Hex string, bytes, or event signature string
 * @returns Effect yielding EventSignatureType or failing with EventSignatureError
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import { Effect } from 'effect'
 *
 * // From event definition
 * const program = EventSignature.from('Transfer(address,address,uint256)')
 * const sig = Effect.runSync(program)
 * // Result: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 *
 * // From hex string
 * const fromHex = EventSignature.from('0xddf252ad...')
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const sig = yield* EventSignature.from('Approval(address,address,uint256)')
 *   const hex = yield* EventSignature.toHex(sig)
 *   return hex
 * })
 * ```
 *
 * @throws {EventSignatureError} When input is invalid
 * @see {@link fromSignature} for explicit signature parsing
 * @see {@link fromHex} for hex parsing
 * @since 0.0.1
 */
export const from = (value: EventSignatureLike): Effect.Effect<EventSignatureType, EventSignatureError> =>
  Effect.try({
    try: () => EventSignature.from(value),
    catch: (e) => new EventSignatureError((e as Error).message)
  })

/**
 * Creates an EventSignature from hex string.
 *
 * @description
 * Parses a 32-byte hex string (with 0x prefix) into an event signature.
 *
 * @param hex - 32-byte hex string with 0x prefix
 * @returns Effect yielding EventSignatureType or failing with EventSignatureError
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import * as Effect from 'effect/Effect'
 *
 * // Transfer event topic
 * const sig = Effect.runSync(
 *   EventSignature.fromHex('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
 * )
 * ```
 *
 * @throws {EventSignatureError} When hex is invalid or wrong length
 * @see {@link from} for general-purpose creation
 * @see {@link toHex} for reverse operation
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<EventSignatureType, EventSignatureError> =>
  Effect.try({
    try: () => EventSignature.fromHex(hex),
    catch: (e) => new EventSignatureError((e as Error).message)
  })

/**
 * Creates an EventSignature from event signature string.
 *
 * @description
 * Takes an event signature string and computes its keccak256 hash.
 * The signature should be in canonical form: EventName(type1,type2,...)
 *
 * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns Effect yielding EventSignatureType (keccak256 of signature)
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import * as Effect from 'effect/Effect'
 *
 * // Common ERC20 events
 * const transfer = Effect.runSync(
 *   EventSignature.fromSignature('Transfer(address,address,uint256)')
 * )
 * const approval = Effect.runSync(
 *   EventSignature.fromSignature('Approval(address,address,uint256)')
 * )
 *
 * // ERC721 Transfer
 * const nftTransfer = Effect.runSync(
 *   EventSignature.fromSignature('Transfer(address,address,uint256)')
 * )
 * ```
 *
 * @throws {EventSignatureError} When signature is malformed
 * @see {@link from} for general-purpose creation
 * @since 0.0.1
 */
export const fromSignature = (signature: string): Effect.Effect<EventSignatureType, EventSignatureError> =>
  Effect.try({
    try: () => EventSignature.fromSignature(signature),
    catch: (e) => new EventSignatureError((e as Error).message)
  })

/**
 * Converts an EventSignature to hex string.
 *
 * @description
 * Returns the 32-byte event signature as a hex string with 0x prefix.
 * This is a pure function that never fails.
 *
 * @param sig - The event signature to convert
 * @returns Effect yielding hex string (always succeeds)
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const sig = yield* EventSignature.from('Transfer(address,address,uint256)')
 *   const hex = yield* EventSignature.toHex(sig)
 *   console.log(hex)  // '0xddf252ad...'
 *   return hex
 * })
 * ```
 *
 * @see {@link fromHex} for reverse operation
 * @since 0.0.1
 */
export const toHex = (sig: EventSignatureType): Effect.Effect<string, never> =>
  Effect.succeed(EventSignature.toHex(sig))

/**
 * Compares two event signatures for equality.
 *
 * @description
 * Performs a byte-by-byte comparison of two event signatures.
 * This is a pure function that never fails.
 *
 * @param a - First event signature
 * @param b - Second event signature
 * @returns Effect yielding true if equal, false otherwise
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const a = yield* EventSignature.fromSignature('Transfer(address,address,uint256)')
 *   const b = yield* EventSignature.fromHex('0xddf252ad...')
 *   const areEqual = yield* EventSignature.equals(a, b)
 *   return areEqual  // true
 * })
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: EventSignatureType, b: EventSignatureType): Effect.Effect<boolean, never> =>
  Effect.succeed(EventSignature.equals(a, b))
