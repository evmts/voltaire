/**
 * @fileoverview Effect Schema for Ethereum event topic filters.
 * @module TopicFilter/TopicFilterSchema
 * @since 0.0.1
 *
 * @description
 * Topic filters are used with eth_getLogs to filter events by their indexed parameters.
 * Each position in the filter array corresponds to an indexed parameter (topic) in the event.
 * Topic 0 is always the event signature hash, and topics 1-3 are indexed parameters.
 */

import { TopicFilter } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * A single topic entry that can be a 32-byte topic hash, an array of topic hashes (OR condition), or null (wildcard).
 *
 * @description
 * - Uint8Array: Match this specific 32-byte topic
 * - Uint8Array[]: Match ANY of these topics (OR condition)
 * - null: Match any value (wildcard)
 *
 * @example
 * ```typescript
 * // Match specific topic
 * const specific: TopicEntry = transferEventSignature
 *
 * // Match any of these topics (OR)
 * const anyOf: TopicEntry = [topic1, topic2, topic3]
 *
 * // Match any value (wildcard)
 * const any: TopicEntry = null
 * ```
 *
 * @since 0.0.1
 */
type TopicEntry = Uint8Array | readonly Uint8Array[] | null;

/**
 * Topic filter type representing up to 4 indexed event parameters.
 *
 * @description
 * Each position corresponds to an indexed parameter in the event signature:
 * - Position 0: Event signature hash (keccak256 of event signature)
 * - Position 1: First indexed parameter
 * - Position 2: Second indexed parameter
 * - Position 3: Third indexed parameter
 *
 * @example
 * ```typescript
 * // Filter for Transfer events from a specific sender
 * const filter: TopicFilterType = [
 *   transferEventSignature,  // Topic 0: event signature
 *   senderAddress,           // Topic 1: from address (padded to 32 bytes)
 *   null                     // Topic 2: any to address
 * ]
 * ```
 *
 * @since 0.0.1
 */
type TopicFilterType = readonly [
	TopicEntry?,
	TopicEntry?,
	TopicEntry?,
	TopicEntry?,
];

/**
 * Internal schema declaration for TopicFilter type validation.
 * @internal
 */
const TopicFilterTypeSchema = S.declare<TopicFilterType>(
	(u): u is TopicFilterType => Array.isArray(u) && u.length <= 4,
	{ identifier: "TopicFilter" },
);

/**
 * Effect Schema for validating and transforming topic filters for event log filtering.
 *
 * @description
 * Topic filters are used with eth_getLogs to filter events by their indexed parameters.
 * Each position in the array corresponds to an indexed parameter, with null acting as a wildcard.
 *
 * Filter semantics:
 * - Specific value: Must match exactly
 * - Array of values: Must match ANY value in the array (OR)
 * - null: Matches any value (wildcard)
 * - Omitted: Same as null (matches any)
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { TopicFilterSchema } from 'voltaire-effect/primitives/TopicFilter'
 *
 * const parse = Schema.decodeSync(TopicFilterSchema)
 *
 * // Filter for Transfer events with specific sender
 * const filter = parse([
 *   transferEventSignature,  // Topic 0: event signature
 *   senderAddress,           // Topic 1: from address
 *   null                     // Topic 2: any to address
 * ])
 *
 * // Filter for any Transfer or Approval event
 * const multiEvent = parse([
 *   [transferSig, approvalSig]  // Topic 0: either event
 * ])
 *
 * // Filter for transfers to specific recipients
 * const toRecipients = parse([
 *   transferEventSignature,
 *   null,                       // Any sender
 *   [recipient1, recipient2]    // Any of these recipients
 * ])
 * ```
 *
 * @throws {ParseError} When filter array is invalid or topics are malformed
 * @see {@link from} for Effect-based creation
 * @since 0.0.1
 */
export const Rpc: S.Schema<TopicFilterType, readonly any[]> = S.transformOrFail(
	S.Array(S.Any),
	TopicFilterTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(
					TopicFilter.from(value as any) as TopicFilterType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (filter) => ParseResult.succeed([...filter]),
	},
).annotations({ identifier: "TopicFilter.Rpc" });

export { Rpc as TopicFilterSchema };
