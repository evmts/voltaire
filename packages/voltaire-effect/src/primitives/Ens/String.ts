import { Ens } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a validated ENS name.
 * @since 0.0.1
 */
export type EnsType = ReturnType<typeof Ens.from>;

const EnsTypeSchema = S.declare<EnsType>(
	(u): u is EnsType => typeof u === "string",
	{ identifier: "Ens" },
);

/**
 * Effect Schema for validating ENS names.
 * Validates and normalizes Ethereum Name Service names.
 *
 * @example
 * ```typescript
 * import * as Ens from 'voltaire-effect/Ens'
 * import * as Schema from 'effect/Schema'
 *
 * const name = Schema.decodeSync(Ens.EnsSchema)('vitalik.eth')
 * ```
 * @since 0.0.1
 */
export const EnsSchema: S.Schema<EnsType, string> = S.transformOrFail(
	S.String,
	EnsTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Ens.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (ens) => ParseResult.succeed(Ens.toString(ens)),
	},
).annotations({ identifier: "EnsSchema" });
