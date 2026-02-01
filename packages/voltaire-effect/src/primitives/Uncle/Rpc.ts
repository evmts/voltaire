import { Uncle } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing an uncle (ommer) block header.
 * @since 0.0.1
 */
export type UncleType = ReturnType<typeof Uncle.from>;

type UncleInput = Parameters<typeof Uncle.from>[0];

/**
 * Internal schema declaration for Uncle type validation.
 * @since 0.0.1
 */
const UncleTypeSchema = S.declare<UncleType>(
	(u): u is UncleType => {
		if (typeof u !== "object" || u === null) return false;
		return "parentHash" in u && "beneficiary" in u && "number" in u;
	},
	{ identifier: "Uncle" },
);

/**
 * Effect Schema for validating and transforming uncle (ommer) block data.
 *
 * Uncles were valid blocks that lost the canonical chain race but
 * are still included to reward miners/validators.
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<UncleType, UncleInput> = S.transformOrFail(
	S.Any,
	UncleTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(Uncle.from(value as UncleInput));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (i) => ParseResult.succeed(i as UncleInput),
	},
).annotations({ identifier: "UncleSchema" });
