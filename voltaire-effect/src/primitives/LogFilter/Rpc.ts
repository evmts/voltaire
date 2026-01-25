/**
 * @fileoverview Effect Schema for Ethereum log filter parameters.
 * @module LogFilter/LogFilterSchema
 * @since 0.0.1
 *
 * @description
 * Log filters are used with eth_getLogs and eth_newFilter to query event logs.
 * They specify criteria for matching logs including block range, contract addresses,
 * and topic filters for indexed event parameters.
 */

import type { BlockTag, LogFilterType } from "@tevm/voltaire/LogFilter";
import * as LogFilter from "@tevm/voltaire/LogFilter";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";
import { Hex as HashSchema } from "../Hash/index.js";

/**
 * Internal schema declaration for LogFilter type validation.
 * @internal
 */
const LogFilterTypeSchema = S.declare<LogFilterType>(
	(u): u is LogFilterType => {
		if (typeof u !== "object" || u === null) return false;
		const filter = u as Record<string, unknown>;
		if ("address" in filter && filter.address !== undefined) {
			if (Array.isArray(filter.address)) {
				if (
					!filter.address.every(
						(a) => a instanceof Uint8Array && a.length === 20,
					)
				) {
					return false;
				}
			} else if (
				!(
					filter.address instanceof Uint8Array &&
					(filter.address as Uint8Array).length === 20
				)
			) {
				return false;
			}
		}
		return true;
	},
	{ identifier: "LogFilter" },
);

/**
 * Schema for block tags used in log filter queries.
 *
 * @description
 * Block tags are string identifiers for special block positions:
 * - 'earliest': Genesis block (block 0)
 * - 'latest': Most recent mined block
 * - 'pending': Pending block (not yet mined)
 *
 * @since 0.0.1
 */
const BlockTagSchema = S.Union(
	S.Literal("earliest"),
	S.Literal("latest"),
	S.Literal("pending"),
);

/**
 * Schema for block identifiers (block number or tag).
 *
 * @description
 * Block identifiers can be:
 * - bigint: Specific block number
 * - string: Block tag ('earliest', 'latest', 'pending')
 *
 * @since 0.0.1
 */
const BlockIdentifierSchema = S.Union(S.BigIntFromSelf, BlockTagSchema);

/**
 * Schema for topic filter entries (single topic, array of topics, or null).
 *
 * @description
 * Topic entries can be:
 * - 32-byte hash: Match this specific topic
 * - Array of hashes: Match ANY of these topics (OR condition)
 * - null: Match any value (wildcard)
 *
 * @since 0.0.1
 */
const TopicEntrySchema = S.Union(HashSchema, S.Array(HashSchema), S.Null);

/**
 * Schema for the topics array in a log filter.
 *
 * @description
 * Topics array with up to 4 entries for filtering indexed event parameters.
 *
 * @since 0.0.1
 */
const TopicFilterSchema = S.Array(TopicEntrySchema);

/**
 * Internal schema structure for log filter parameters.
 * @internal
 */
const LogFilterSchemaInternal = S.Struct({
	fromBlock: S.optional(BlockIdentifierSchema),
	toBlock: S.optional(BlockIdentifierSchema),
	address: S.optional(S.Union(AddressSchema, S.Array(AddressSchema))),
	topics: S.optional(TopicFilterSchema),
	blockhash: S.optional(HashSchema),
});

/**
 * Effect Schema for validating and parsing Ethereum log filter parameters.
 *
 * @description
 * Log filters are used with eth_getLogs and eth_newFilter to query event logs.
 * Filter parameters include:
 * - fromBlock: Starting block (number or tag)
 * - toBlock: Ending block (number or tag)
 * - address: Contract address(es) to filter
 * - topics: Topic filters for indexed parameters
 * - blockhash: Filter by specific block hash (mutually exclusive with fromBlock/toBlock)
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { LogFilterSchema } from 'voltaire-effect/primitives/LogFilter'
 *
 * const parse = S.decodeSync(LogFilterSchema)
 *
 * // Create a filter for Transfer events from a specific address
 * const filter = parse({
 *   fromBlock: 'latest',
 *   address: '0x1234567890123456789012345678901234567890',
 *   topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
 * })
 *
 * // Filter by block range
 * const rangeFilter = parse({
 *   fromBlock: 1000000n,
 *   toBlock: 1000100n
 * })
 *
 * // Filter multiple addresses
 * const multiAddress = parse({
 *   address: [
 *     '0x1111111111111111111111111111111111111111',
 *     '0x2222222222222222222222222222222222222222'
 *   ]
 * })
 *
 * // Filter by block hash
 * const blockFilter = parse({
 *   blockhash: '0x1234...abcd'
 * })
 * ```
 *
 * @throws {ParseError} When filter parameters are invalid
 * @see {@link LogFilterType} for the output type
 * @since 0.0.1
 */
export const Rpc = S.transform(LogFilterSchemaInternal, LogFilterTypeSchema, {
	strict: true,
	decode: (d) => LogFilter.from(d as Parameters<typeof LogFilter.from>[0]),
	encode: (e) => e as unknown as S.Schema.Type<typeof LogFilterSchemaInternal>,
}).annotations({ identifier: "LogFilter.Rpc" });

export { Rpc as LogFilterSchema };
export { Rpc as Schema };
export { LogFilterTypeSchema };

/**
 * The LogFilter type representing validated log filter parameters.
 *
 * @description
 * Contains validated filter criteria for querying event logs:
 * - Block range (fromBlock, toBlock) or specific blockhash
 * - Contract address(es)
 * - Topic filters for indexed parameters
 *
 * @see {@link LogFilterSchema} for creating instances
 * @since 0.0.1
 */
export type { LogFilterType };

/**
 * Block tag type for log filter queries.
 *
 * @description
 * Special block identifiers:
 * - 'earliest': Genesis block (block 0)
 * - 'latest': Most recent mined block
 * - 'pending': Pending block (not yet mined)
 *
 * @since 0.0.1
 */
export type { BlockTag };
