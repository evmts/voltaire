/**
 * @fileoverview Effect Schema for Ethereum JSON-RPC filter identifiers.
 * @module FilterId/FilterIdSchema
 * @since 0.0.1
 *
 * @description
 * Filter IDs are unique identifiers returned by eth_newFilter, eth_newBlockFilter,
 * and eth_newPendingTransactionFilter. They are used to poll for new results
 * with eth_getFilterChanges and to uninstall filters with eth_uninstallFilter.
 */

import { FilterId } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing an Ethereum JSON-RPC filter identifier.
 *
 * @description
 * Filter IDs are hex-encoded identifiers used for tracking:
 * - Event log filters (eth_newFilter)
 * - Block filters (eth_newBlockFilter)
 * - Pending transaction filters (eth_newPendingTransactionFilter)
 *
 * @example
 * ```typescript
 * import { FilterId } from 'voltaire-effect/primitives'
 *
 * // Filter ID returned from eth_newFilter
 * const filterId: FilterIdType = FilterId.from('0x1')
 * ```
 *
 * @see {@link Schema} for validation
 * @since 0.0.1
 */
export type FilterIdType = ReturnType<typeof FilterId.from>;

/**
 * Internal schema declaration for FilterId validation.
 * @internal
 */
const FilterIdTypeSchema = S.declare<FilterIdType>(
	(u): u is FilterIdType => {
		if (typeof u !== "string") return false;
		try {
			FilterId.from(u);
			return true;
		} catch {
			return false;
		}
	},
	{ identifier: "FilterId" },
);

/**
 * Effect Schema for validating and transforming filter IDs.
 *
 * @description
 * Validates that the input is a valid hex-encoded filter identifier.
 * Filter IDs are typically small hex values returned by the JSON-RPC API.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/FilterId'
 *
 * const parse = S.decodeSync(Schema)
 *
 * // Parse filter ID from JSON-RPC response
 * const filterId = parse('0x1')
 * const filterId2 = parse('0xabc')
 *
 * // Use in filter polling
 * // await provider.send('eth_getFilterChanges', [filterId])
 * ```
 *
 * @throws {ParseError} When input is not a valid hex string
 * @see {@link from} for Effect-based creation
 * @since 0.0.1
 */
export const Schema: S.Schema<FilterIdType, string> = S.transformOrFail(
	S.String,
	FilterIdTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(FilterId.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (f) => ParseResult.succeed(f as string),
	},
).annotations({ identifier: "FilterIdSchema" });
