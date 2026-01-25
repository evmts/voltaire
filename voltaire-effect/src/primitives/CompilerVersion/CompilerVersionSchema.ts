import { CompilerVersion } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a Solidity compiler version string.
 * @since 0.0.1
 */
export type CompilerVersionType = CompilerVersion.CompilerVersionType;

const CompilerVersionTypeSchema = S.declare<CompilerVersionType>(
	(u): u is CompilerVersionType => typeof u === "string",
	{ identifier: "CompilerVersion" },
);

/**
 * Effect Schema for validating Solidity compiler version strings.
 * Supports semver format with optional commit hash and prerelease.
 *
 * @example
 * ```typescript
 * import * as CompilerVersion from 'voltaire-effect/CompilerVersion'
 * import * as Schema from 'effect/Schema'
 *
 * const version = Schema.decodeSync(CompilerVersion.CompilerVersionSchema)('0.8.20')
 * ```
 * @since 0.0.1
 */
export const CompilerVersionSchema: S.Schema<CompilerVersionType, string> =
	S.transformOrFail(S.String, CompilerVersionTypeSchema, {
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(CompilerVersion.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (version) => ParseResult.succeed(version as string),
	}).annotations({ identifier: "CompilerVersionSchema" });
