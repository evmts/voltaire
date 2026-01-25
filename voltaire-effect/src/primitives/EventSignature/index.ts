/**
 * @fileoverview EventSignature module for working with EVM event topics.
 * @module EventSignature
 * @since 0.0.1
 *
 * @description
 * Event signatures are 32-byte keccak256 hashes of event definitions.
 * They appear as topic 0 in event logs and are used to identify event types
 * when filtering logs with eth_getLogs.
 *
 * Common event signatures:
 * - Transfer(address,address,uint256): 0xddf252ad...
 * - Approval(address,address,uint256): 0x8c5be1e5...
 *
 * This module provides:
 * - Type-safe branded EventSignatureType
 * - Effect Schema for validation
 * - Functions for creating, converting, and comparing signatures
 *
 * @example
 * ```typescript
 * import * as EventSignature from 'voltaire-effect/primitives/EventSignature'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create from event definition
 *   const sig = yield* EventSignature.fromSignature('Transfer(address,address,uint256)')
 *
 *   // Convert to hex for use in filters
 *   const hex = yield* EventSignature.toHex(sig)
 *   console.log(hex)  // '0xddf252ad...'
 *
 *   // Compare signatures
 *   const other = yield* EventSignature.fromHex('0xddf252ad...')
 *   const equal = yield* EventSignature.equals(sig, other)
 *   console.log(equal)  // true
 * })
 *
 * // Use in log filter
 * const filter = {
 *   topics: [transferSignatureHex, null, null]  // Filter for Transfer events
 * }
 * ```
 *
 * @see {@link EventSignatureSchema} for Effect Schema integration
 * @see {@link from} for Effect-based creation
 * @see {@link EventSignatureError} for error handling
 */
export { EventSignatureSchema, type EventSignatureType, type EventSignatureLike } from './EventSignatureSchema.js'
export {
  from,
  fromHex,
  fromSignature,
  toHex,
  equals,
  EventSignatureError
} from './from.js'
