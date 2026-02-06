import { EncodedData } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing ABI-encoded data as a hex string.
 * @since 0.0.1
 */
export type EncodedDataType = ReturnType<typeof EncodedData.from>;

const EncodedDataTypeSchema = S.declare<EncodedDataType>(
	(u): u is EncodedDataType =>
		typeof u === "string" && (u as string).startsWith("0x"),
	{ identifier: "EncodedData" },
);

/**
 * Effect Schema for validating ABI-encoded data.
 * Accepts hex strings or Uint8Array and returns branded EncodedDataType.
 *
 * @example
 * ```typescript
 * import * as EncodedData from 'voltaire-effect/EncodedData'
 * import * as Schema from 'effect/Schema'
 *
 * const data = Schema.decodeSync(EncodedData.EncodedDataSchema)('0xa9059cbb...')
 * ```
 * @since 0.0.1
 */
export const EncodedDataSchema: S.Schema<EncodedDataType, string | Uint8Array> =
	S.transformOrFail(
		S.Union(S.String, S.Uint8ArrayFromSelf),
		EncodedDataTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(EncodedData.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (data) => ParseResult.succeed(data as string),
		},
	).annotations({ identifier: "EncodedDataSchema" });

/**
 * Effect Schema for creating encoded data from bytes only.
 * @since 0.0.1
 */
export const EncodedDataFromBytesSchema: S.Schema<EncodedDataType, Uint8Array> =
	S.transformOrFail(S.Uint8ArrayFromSelf, EncodedDataTypeSchema, {
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(EncodedData.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (data) => ParseResult.succeed(EncodedData.toBytes(data)),
	}).annotations({ identifier: "EncodedDataFromBytesSchema" });
