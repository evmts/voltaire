import { DecodedData } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing decoded ABI data with values and their types.
 * @since 0.0.1
 */
export type DecodedDataType<T = unknown> = DecodedData.DecodedDataType<T>;

const DecodedDataTypeSchema = S.declare<DecodedDataType>(
	(u): u is DecodedDataType =>
		u !== null &&
		typeof u === "object" &&
		"values" in u &&
		"types" in u &&
		Array.isArray((u as any).types),
	{ identifier: "DecodedData" },
);

/**
 * Input type for creating DecodedData.
 * @since 0.0.1
 */
export type DecodedDataInput<T = unknown> = {
	readonly values: T;
	readonly types: readonly string[];
};

/**
 * Effect Schema for validating decoded ABI data.
 * Wraps values with their ABI type information.
 *
 * @example
 * ```typescript
 * import * as DecodedData from 'voltaire-effect/DecodedData'
 * import * as Schema from 'effect/Schema'
 *
 * const decoded = Schema.decodeSync(DecodedData.DecodedDataSchema)({
 *   values: [100n, '0x...'],
 *   types: ['uint256', 'address']
 * })
 * ```
 * @since 0.0.1
 */
export const DecodedDataSchema: S.Schema<DecodedDataType, DecodedDataInput> =
	S.transformOrFail(
		S.Struct({
			values: S.Unknown,
			types: S.Array(S.String),
		}),
		DecodedDataTypeSchema,
		{
			strict: true,
			decode: (input, _options, ast) => {
				try {
					return ParseResult.succeed(
						DecodedData.from(input.values, input.types),
					);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, input, (e as Error).message),
					);
				}
			},
			encode: (data) =>
				ParseResult.succeed({
					values: data.values,
					types: data.types,
				}),
		},
	).annotations({ identifier: "DecodedDataSchema" });
