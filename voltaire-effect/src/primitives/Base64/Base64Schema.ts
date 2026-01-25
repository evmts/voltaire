import {
	type BrandedBase64,
	type BrandedBase64Url,
	Base64 as VoltaireBase64,
} from "@tevm/voltaire/Base64";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const Base64TypeSchema = S.declare<BrandedBase64>(
	(u): u is BrandedBase64 => {
		if (typeof u !== "string") return false;
		return VoltaireBase64.isValid(u);
	},
	{ identifier: "BrandedBase64" },
);

const Base64UrlTypeSchema = S.declare<BrandedBase64Url>(
	(u): u is BrandedBase64Url => {
		if (typeof u !== "string") return false;
		return VoltaireBase64.isValidUrlSafe(u);
	},
	{ identifier: "BrandedBase64Url" },
);

/**
 * Effect Schema for validating and parsing standard Base64 strings.
 * Accepts string or Uint8Array, decodes to BrandedBase64.
 *
 * @example
 * ```typescript
 * import { Schema } from 'voltaire-effect/primitives/Base64'
 * import * as S from 'effect/Schema'
 *
 * const base64 = S.decodeSync(Schema)('SGVsbG8gV29ybGQ=')
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<BrandedBase64, string | Uint8Array> =
	S.transformOrFail(S.Union(S.String, S.Uint8ArrayFromSelf), Base64TypeSchema, {
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(
					VoltaireBase64.from(s as string | Uint8Array),
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (b) => ParseResult.succeed(b),
	}).annotations({ identifier: "Base64Schema" });

/**
 * Effect Schema for validating and parsing URL-safe Base64 strings.
 * Accepts string or Uint8Array, decodes to BrandedBase64Url.
 * Uses - and _ instead of + and /, safe for URLs without encoding.
 *
 * @example
 * ```typescript
 * import { UrlSchema } from 'voltaire-effect/primitives/Base64'
 * import * as S from 'effect/Schema'
 *
 * const base64url = S.decodeSync(UrlSchema)('SGVsbG8tV29ybGQ_')
 * ```
 *
 * @since 0.0.1
 */
export const UrlSchema: S.Schema<BrandedBase64Url, string | Uint8Array> =
	S.transformOrFail(
		S.Union(S.String, S.Uint8ArrayFromSelf),
		Base64UrlTypeSchema,
		{
			strict: true,
			decode: (s, _options, ast) => {
				try {
					return ParseResult.succeed(
						VoltaireBase64.fromUrlSafe(s as string | Uint8Array),
					);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, s, (e as Error).message),
					);
				}
			},
			encode: (b) => ParseResult.succeed(b),
		},
	).annotations({ identifier: "Base64UrlSchema" });
