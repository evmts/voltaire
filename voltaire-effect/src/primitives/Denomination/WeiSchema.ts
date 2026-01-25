/**
 * @fileoverview Effect Schema definitions for Wei denomination values.
 * Provides type-safe schemas for parsing and validating Wei amounts.
 * @module Denomination/WeiSchema
 * @since 0.0.1
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing Wei (smallest Ether unit, 10^-18 ETH).
 *
 * @description
 * Wei is the smallest denomination of Ether. All Ethereum values are
 * ultimately represented in Wei for precise arithmetic operations.
 * - 1 Ether = 10^18 Wei
 * - 1 Gwei = 10^9 Wei
 *
 * @example
 * ```typescript
 * import type { WeiType } from 'voltaire-effect/primitives/Denomination'
 *
 * const oneEth: WeiType = 1000000000000000000n as WeiType
 * ```
 *
 * @since 0.0.1
 */
export type WeiType = bigint & { readonly __tag: "Wei" };

/**
 * Internal schema declaration for validating WeiType instances.
 * Ensures the value is a non-negative bigint.
 *
 * @internal
 */
const WeiTypeSchema = S.declare<WeiType>(
	(u): u is WeiType => typeof u === "bigint" && u >= 0n,
	{ identifier: "Wei" },
);

/**
 * Effect Schema for validating Wei values.
 *
 * @description
 * Transforms bigint, number, or string inputs into branded WeiType values.
 * Wei is the base unit for all Ethereum value calculations.
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Schema from 'effect/Schema'
 *
 * // Parse 1 ETH in Wei
 * const wei = Schema.decodeSync(Denomination.WeiSchema)(1000000000000000000n)
 *
 * // From string
 * const fromStr = Schema.decodeSync(Denomination.WeiSchema)('1000000')
 *
 * // Encode back
 * const encoded = Schema.encodeSync(Denomination.WeiSchema)(wei)
 * ```
 *
 * @throws ParseResult.Type - When the input is negative or cannot be converted
 * @see {@link GweiSchema} for gas price units
 * @see {@link EtherSchema} for human-readable amounts
 * @since 0.0.1
 */
export const WeiSchema: S.Schema<WeiType, bigint | number | string> =
	S.transformOrFail(
		S.Union(S.BigIntFromSelf, S.Number, S.String),
		WeiTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(Uint.from(value) as unknown as WeiType);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (wei) => ParseResult.succeed(wei),
		},
	).annotations({ identifier: "WeiSchema" });
