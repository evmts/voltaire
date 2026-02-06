import { Hardfork } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Represents an Ethereum hardfork name.
 * Used to determine EVM behavior and available opcodes.
 * @since 0.0.1
 */
export type HardforkType = NonNullable<ReturnType<typeof Hardfork.fromString>>;

const HardforkTypeSchema = S.declare<HardforkType>(
	(u): u is HardforkType => {
		if (typeof u !== "string") return false;
		return Hardfork.isValidName(u);
	},
	{ identifier: "Hardfork" },
);

/**
 * Effect Schema for validating hardfork names.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { HardforkSchema } from 'voltaire-effect/primitives/Hardfork'
 *
 * const fork = S.decodeSync(HardforkSchema)('london')
 * ```
 * @since 0.0.1
 */
export const HardforkSchema: S.Schema<HardforkType, string> = S.transformOrFail(
	S.String,
	HardforkTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			const result = Hardfork.fromString(s);
			if (result === undefined) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, `Invalid hardfork name: ${s}`),
				);
			}
			return ParseResult.succeed(result);
		},
		encode: (h) => ParseResult.succeed(Hardfork.toString(h)),
	},
).annotations({ identifier: "HardforkSchema" });
