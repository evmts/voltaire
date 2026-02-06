import { SourceMap } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a parsed Solidity source map.
 * Contains the raw string and parsed entries for bytecode-to-source mapping.
 *
 * @since 0.0.1
 */
export type SourceMapType = SourceMap.SourceMap;

/**
 * Type representing a single source map entry.
 * Maps a bytecode range to its source code location.
 *
 * @since 0.0.1
 */
export type SourceMapEntry = SourceMap.SourceMapEntry;

/**
 * Effect Schema for validating source map entries.
 * Each entry contains start offset, length, file index, and jump type.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SourceMapEntrySchema } from 'voltaire-effect/primitives/SourceMap'
 *
 * const validate = S.is(SourceMapEntrySchema)
 * const isValid = validate({ start: 0, length: 10, fileIndex: 0, jump: '-' })
 * ```
 *
 * @since 0.0.1
 */
export const SourceMapEntrySchema = S.Struct({
	start: S.Number,
	length: S.Number,
	fileIndex: S.Number,
	jump: S.Union(S.Literal("i"), S.Literal("o"), S.Literal("-")),
	modifierDepth: S.optional(S.Number),
}).annotations({ identifier: "SourceMapEntry" });

/**
 * Effect Schema for validating source map structure.
 * Contains the raw string and array of parsed entries.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SourceMapTypeSchema } from 'voltaire-effect/primitives/SourceMap'
 *
 * const validate = S.is(SourceMapTypeSchema)
 * ```
 *
 * @since 0.0.1
 */
export const SourceMapTypeSchema = S.Struct({
	raw: S.String,
	entries: S.Array(SourceMapEntrySchema),
}).annotations({ identifier: "SourceMap" });

/**
 * Effect Schema for parsing Solidity source maps from raw strings.
 * Transforms the semicolon-separated format into structured entries.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/SourceMap'
 *
 * const parse = S.decodeSync(Schema)
 * const sourceMap = parse('0:10:0:-;10:5:0:i')
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<SourceMapType, string> = S.transformOrFail(
	S.String,
	SourceMapTypeSchema as S.Schema<SourceMapType, SourceMapType>,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(SourceMap.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (sm) => ParseResult.succeed(SourceMap.toString(sm)),
	},
).annotations({ identifier: "SourceMapSchema" });
