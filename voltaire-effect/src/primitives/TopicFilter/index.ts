/**
 * @fileoverview TopicFilter module for filtering Ethereum event logs by indexed parameters.
 * @module TopicFilter
 * @since 0.0.1
 *
 * @description
 * Topic filters allow matching events based on their indexed parameters (topics).
 * Each event can have up to 4 topics:
 * - Topic 0: Event signature hash (keccak256 of event signature like "Transfer(address,address,uint256)")
 * - Topic 1-3: Indexed event parameters
 *
 * Filter semantics:
 * - Specific value: Must match exactly
 * - Array of values: Must match ANY value (OR condition)
 * - null/undefined: Matches any value (wildcard)
 *
 * This module provides:
 * - Type-safe topic filter types
 * - Effect Schema for validation
 * - Effect-based creation with error handling
 *
 * @example
 * ```typescript
 * import * as TopicFilter from 'voltaire-effect/primitives/TopicFilter'
 * import * as Effect from 'effect/Effect'
 * import * as S from 'effect/Schema'
 *
 * // Create filter for Transfer events from specific sender
 * const filter = await Effect.runPromise(TopicFilter.from([
 *   transferEventSignature,  // Topic 0: event signature
 *   senderAddress,           // Topic 1: from address
 *   null                     // Topic 2: any to address
 * ]))
 *
 * // Using Schema for validation
 * const parsed = S.decodeSync(TopicFilter.TopicFilterSchema)([
 *   eventSig,
 *   null,
 *   [recipient1, recipient2]  // Match either recipient
 * ])
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const filter = yield* TopicFilter.from([eventSig, senderTopic, null])
 *   // Use filter with eth_getLogs
 * })
 * ```
 *
 * @see {@link TopicFilterSchema} for Effect Schema integration
 * @see {@link from} for Effect-based creation
 * @see {@link TopicFilterError} for error handling
 */
export { TopicFilterSchema } from './TopicFilterSchema.js'
export { from, TopicFilterError } from './from.js'
