import { ReturnData } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing data returned from EVM execution.
 * @since 0.0.1
 */
export type ReturnDataType = ReturnData.ReturnDataType;

const ReturnDataTypeSchema = S.declare<ReturnDataType>(
	(u): u is ReturnDataType => u instanceof Uint8Array,
	{ identifier: "ReturnData" },
);

/**
 * Effect Schema for validating and transforming return data.
 *
 * Transforms hex strings or byte arrays into validated ReturnDataType.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/ReturnData'
 *
 * const data = S.decodeSync(Schema)('0xabcd1234')
 * // or
 * const data2 = S.decodeSync(Schema)(new Uint8Array([0xab, 0xcd]))
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<ReturnDataType, string | Uint8Array> =
	S.transformOrFail(
		S.Union(S.String, S.Uint8ArrayFromSelf),
		ReturnDataTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(ReturnData.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (rd) => ParseResult.succeed(ReturnData.toHex(rd)),
		},
	).annotations({ identifier: "ReturnDataSchema" });
