import { Epoch } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a beacon chain epoch number.
 * @since 0.0.1
 */
export type EpochType = ReturnType<typeof Epoch.from>;

const EpochTypeSchema = S.declare<EpochType>(
	(u): u is EpochType => typeof u === "bigint",
	{ identifier: "Epoch" },
);

/**
 * Effect Schema for validating beacon chain epoch numbers.
 * Accepts bigint, number, or string and returns branded EpochType.
 *
 * @example
 * ```typescript
 * import * as Epoch from 'voltaire-effect/Epoch'
 * import * as Schema from 'effect/Schema'
 *
 * const epoch = Schema.decodeSync(Epoch.EpochSchema)(123456n)
 * ```
 * @since 0.0.1
 */
export const EpochSchema: S.Schema<EpochType, bigint | number | string> =
	S.transformOrFail(
		S.Union(S.BigIntFromSelf, S.Number, S.String),
		EpochTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(Epoch.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (epoch) => ParseResult.succeed(epoch as bigint),
		},
	).annotations({ identifier: "EpochSchema" });
