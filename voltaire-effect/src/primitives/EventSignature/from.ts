import { EventSignature } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { EventSignatureType, EventSignatureLike } from './EventSignatureSchema.js'

/**
 * Error thrown when event signature operations fail.
 * @since 0.0.1
 */
export class EventSignatureError extends Error {
  readonly _tag = 'EventSignatureError'
  constructor(message: string) {
    super(message)
    this.name = 'EventSignatureError'
  }
}

/**
 * Creates an EventSignature from various input types.
 *
 * @param value - Hex string, bytes, or event signature string
 * @returns Effect yielding EventSignatureType or failing with EventSignatureError
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/EventSignature'
 * import { Effect } from 'effect'
 *
 * const program = EventSignature.from('Transfer(address,address,uint256)')
 * const sig = Effect.runSync(program)
 * ```
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
 * @param hex - 32-byte hex string with 0x prefix
 * @returns Effect yielding EventSignatureType
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
 * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns Effect yielding EventSignatureType (keccak256 of signature)
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
 * @param sig - The event signature
 * @returns Effect yielding hex string
 * @since 0.0.1
 */
export const toHex = (sig: EventSignatureType): Effect.Effect<string, never> =>
  Effect.succeed(EventSignature.toHex(sig))

/**
 * Compares two event signatures for equality.
 *
 * @param a - First event signature
 * @param b - Second event signature
 * @returns Effect yielding true if equal
 * @since 0.0.1
 */
export const equals = (a: EventSignatureType, b: EventSignatureType): Effect.Effect<boolean, never> =>
  Effect.succeed(EventSignature.equals(a, b))
