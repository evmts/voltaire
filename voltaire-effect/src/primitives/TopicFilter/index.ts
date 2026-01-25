/**
 * TopicFilter module for filtering Ethereum event logs by indexed parameters.
 * 
 * Topic filters allow matching events based on their indexed parameters (topics).
 * Each event can have up to 4 topics, where topic 0 is the event signature hash.
 * 
 * @example
 * ```typescript
 * import * as TopicFilter from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const filter = await Effect.runPromise(TopicFilter.from([
 *   eventSignature,
 *   senderAddress,
 *   null  // any recipient
 * ]))
 * ```
 * 
 * @module TopicFilter
 * @since 0.0.1
 */
export { TopicFilterSchema } from './TopicFilterSchema.js'
export { from, TopicFilterError } from './from.js'
