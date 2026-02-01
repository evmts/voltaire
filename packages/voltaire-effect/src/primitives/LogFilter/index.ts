/**
 * @module LogFilter
 * @description Effect Schemas for Ethereum log filter parameters.
 *
 * Log filters are used with eth_getLogs and eth_newFilter to query event logs.
 * They specify criteria for matching logs including block range and addresses.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `LogFilter.Rpc` | filter object | LogFilterType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as LogFilter from 'voltaire-effect/primitives/LogFilter'
 * import * as S from 'effect/Schema'
 *
 * // Create a filter for events from a specific address
 * const filter = S.decodeSync(LogFilter.Rpc)({
 *   fromBlock: 'latest',
 *   address: '0x1234567890123456789012345678901234567890'
 * })
 * ```
 *
 * @since 0.1.0
 */
export {
	type BlockTag,
	LogFilterSchema,
	type LogFilterType,
	LogFilterTypeSchema,
	Rpc,
	Schema,
} from "./Rpc.js";
