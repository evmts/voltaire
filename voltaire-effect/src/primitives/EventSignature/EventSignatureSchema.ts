/**
 * @fileoverview Effect Schema for EVM event signatures (topic 0).
 * @module EventSignature/EventSignatureSchema
 * @since 0.0.1
 *
 * @description
 * Event signatures are 32-byte keccak256 hashes of event definitions.
 * They appear as topic 0 in event logs and are used to identify event types.
 */

import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { EventSignature } from '@tevm/voltaire'

/**
 * Type representing a 32-byte event topic (keccak256 of event signature).
 *
 * @description
 * An event signature is the keccak256 hash of the event definition.
 * For example, the Transfer event "Transfer(address,address,uint256)" hashes to
 * 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
 *
 * @example
 * ```typescript
 * import { EventSignature } from 'voltaire-effect/primitives'
 *
 * // Transfer event signature
 * const sig: EventSignatureType = EventSignature.from('Transfer(address,address,uint256)')
 * // Result: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 * ```
 *
 * @see {@link EventSignatureSchema} for validation
 * @see {@link from} for creating instances
 * @since 0.0.1
 */
export type EventSignatureType = ReturnType<typeof EventSignature.from>

/**
 * Input types accepted for creating an EventSignature.
 *
 * @description
 * Accepts:
 * - string: Event signature string like "Transfer(address,address,uint256)"
 * - string: Hex-encoded 32-byte topic
 * - Uint8Array: Raw 32-byte array
 *
 * @see {@link from} for usage
 * @since 0.0.1
 */
export type EventSignatureLike = Parameters<typeof EventSignature.from>[0]

/**
 * Internal schema for EventSignature validation.
 * @internal
 */
const EventSignatureTypeSchema = S.declare<EventSignatureType>(
  (u): u is EventSignatureType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'EventSignature' }
)

/**
 * Effect Schema for validating event topic selectors.
 *
 * @description
 * Accepts hex strings or Uint8Array and returns branded EventSignatureType.
 * This schema validates that the input represents a valid 32-byte event topic.
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import * as Schema from 'effect/Schema'
 *
 * const parse = Schema.decodeSync(EventSignature.EventSignatureSchema)
 *
 * // Parse from event definition string
 * const sig = parse('Transfer(address,address,uint256)')
 *
 * // Parse from hex string
 * const fromHex = parse('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
 *
 * // Parse from Uint8Array
 * const fromBytes = parse(new Uint8Array(32))
 * ```
 *
 * @throws {ParseError} When input is not a valid 32-byte topic
 * @see {@link from} for Effect-based creation
 * @since 0.0.1
 */
export const EventSignatureSchema: S.Schema<EventSignatureType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  EventSignatureTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(EventSignature.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (sig) => ParseResult.succeed(EventSignature.toHex(sig))
  }
).annotations({ identifier: 'EventSignatureSchema' })
