import { WithdrawalIndex } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a withdrawal's sequential index.
 * @since 0.0.1
 */
export type WithdrawalIndexType = ReturnType<typeof WithdrawalIndex.from>;

/**
 * Internal schema declaration for WithdrawalIndex type validation.
 * @since 0.0.1
 */
const WithdrawalIndexTypeSchema = S.declare<WithdrawalIndexType>(
	(u): u is WithdrawalIndexType => {
		if (typeof u !== "bigint") return false;
		return u >= 0n && u <= WithdrawalIndex.UINT64_MAX;
	},
	{ identifier: "WithdrawalIndex" },
);

/**
 * Effect Schema for validating and transforming withdrawal indices.
 *
 * Withdrawal indices are 64-bit unsigned integers assigned sequentially.
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<WithdrawalIndexType, number | bigint | string> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf, S.String),
		WithdrawalIndexTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(WithdrawalIndex.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (i) => ParseResult.succeed(i as bigint),
		},
	).annotations({ identifier: "WithdrawalIndexSchema" });
