/**
 * @module TopicFilter
 * @description Effect Schemas for Ethereum event topic filters.
 *
 * Topic filters are used with eth_getLogs to filter events by indexed parameters.
 * Each position in the filter array corresponds to an indexed parameter (topic).
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `TopicFilter.Rpc` | any[] | TopicFilterType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as TopicFilter from 'voltaire-effect/primitives/TopicFilter'
 * import * as S from 'effect/Schema'
 *
 * const filter = S.decodeSync(TopicFilter.Rpc)([
 *   transferEventSignature,  // Topic 0: event signature
 *   senderAddress,           // Topic 1: from address
 *   null                     // Topic 2: any to address
 * ])
 * ```
 *
 * @since 0.1.0
 */
export { Rpc, TopicFilterSchema } from "./Rpc.js";
