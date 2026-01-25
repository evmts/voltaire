/**
 * @fileoverview Effect Schema definitions for Ether denomination values.
 * Provides type-safe schemas for parsing and validating Ether amounts.
 * @module Denomination/EtherSchema
 * @since 0.0.1
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing Ether (10^18 Wei).
 *
 * @description
 * Ether is the primary currency of Ethereum, used for transaction fees and
 * value transfers. This type represents whole Ether units (not Wei).
 * - 1 Ether = 10^18 Wei
 * - 1 Ether = 10^9 Gwei
 *
 * @example
 * ```typescript
 * import type { EtherType } from 'voltaire-effect/primitives/Denomination'
 *
 * const amount: EtherType = 10n as EtherType // 10 ETH
 * ```
 *
 * @since 0.0.1
 */
export type EtherType = bigint & { readonly __tag: "Ether" };

/**
 * Internal schema declaration for validating EtherType instances.
 * Ensures the value is a non-negative bigint.
 *
 * @internal
 */
const EtherTypeSchema = S.declare<EtherType>(
	(u): u is EtherType => typeof u === "bigint" && u >= 0n,
	{ identifier: "Ether" },
);

/**
 * Effect Schema for validating Ether values.
 *
 * @description
 * Transforms bigint, number, or string inputs into branded EtherType values.
 * Ether is the human-readable unit commonly used in wallets and UIs.
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/primitives/Denomination'
 * import * as Schema from 'effect/Schema'
 *
 * // Parse 1 ETH
 * const eth = Schema.decodeSync(Denomination.EtherSchema)(1n)
 *
 * // From string
 * const fromStr = Schema.decodeSync(Denomination.EtherSchema)('10')
 *
 * // Encode back
 * const encoded = Schema.encodeSync(Denomination.EtherSchema)(eth)
 * ```
 *
 * @throws ParseResult.Type - When the input is negative or cannot be converted
 * @see {@link WeiSchema} for base unit values
 * @see {@link GweiSchema} for gas price units
 * @since 0.0.1
 */
export const EtherSchema: S.Schema<EtherType, bigint | number | string> =
	S.transformOrFail(
		S.Union(S.BigIntFromSelf, S.Number, S.String),
		EtherTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(Uint.from(value) as unknown as EtherType);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (ether) => ParseResult.succeed(ether),
		},
	).annotations({ identifier: "EtherSchema" });
