import { ProtocolVersion } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing an Ethereum protocol version identifier.
 * @since 0.0.1
 */
export type ProtocolVersionType = ProtocolVersion.ProtocolVersionType;

const ProtocolVersionTypeSchema = S.declare<ProtocolVersionType>(
	(u): u is ProtocolVersionType => {
		if (typeof u !== "string") return false;
		try {
			ProtocolVersion.from(u);
			return true;
		} catch {
			return false;
		}
	},
	{ identifier: "ProtocolVersion" },
);

/**
 * Effect Schema for validating and transforming protocol version strings.
 *
 * Validates Ethereum protocol version identifiers like 'eth/66', 'eth/67', etc.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/ProtocolVersion'
 *
 * const version = S.decodeSync(Schema)('eth/67')
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<ProtocolVersionType, string> = S.transformOrFail(
	S.String,
	ProtocolVersionTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(ProtocolVersion.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (pv) => ParseResult.succeed(pv as string),
	},
).annotations({ identifier: "ProtocolVersionSchema" });
