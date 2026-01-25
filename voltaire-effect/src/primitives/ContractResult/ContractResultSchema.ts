import { ContractResult } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a contract call result (success or failure).
 * @since 0.0.1
 */
export type ContractResultType = ContractResult.ContractResultType;

/**
 * Type representing a successful contract call result.
 * @since 0.0.1
 */
export type SuccessResult = ContractResult.SuccessResult;

/**
 * Type representing a failed contract call result with revert reason.
 * @since 0.0.1
 */
export type FailureResult = ContractResult.FailureResult;

const ContractResultTypeSchema = S.declare<ContractResultType>(
	(u): u is ContractResultType =>
		u !== null &&
		typeof u === "object" &&
		"success" in u &&
		typeof (u as any).success === "boolean",
	{ identifier: "ContractResult" },
);

/**
 * Input type for creating a ContractResult.
 * @since 0.0.1
 */
export type ContractResultInput = {
	readonly isSuccess: boolean;
	readonly data: string | Uint8Array;
};

/**
 * Effect Schema for validating contract call results.
 * Handles both success and failure cases.
 *
 * @example
 * ```typescript
 * import * as ContractResult from 'voltaire-effect/ContractResult'
 * import * as Schema from 'effect/Schema'
 *
 * const result = Schema.decodeSync(ContractResult.ContractResultSchema)({
 *   isSuccess: true,
 *   data: '0x...'
 * })
 * ```
 * @since 0.0.1
 */
export const ContractResultSchema: S.Schema<
	ContractResultType,
	ContractResultInput,
	never
> = S.transformOrFail(
	S.Struct({
		isSuccess: S.Boolean,
		data: S.Union(S.String, S.Uint8ArrayFromSelf),
	}),
	ContractResultTypeSchema,
	{
		strict: true,
		decode: (input, _options, ast) => {
			try {
				return ParseResult.succeed(
					ContractResult.from(input.isSuccess, input.data),
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, input, (e as Error).message),
				);
			}
		},
		encode: (result) => {
			if (result.success) {
				return ParseResult.succeed({
					isSuccess: true,
					data: (result as SuccessResult).data as Uint8Array,
				});
			} else {
				const reason = (result as FailureResult).revertReason;
				return ParseResult.succeed({
					isSuccess: false,
					data:
						typeof reason === "string"
							? reason
							: (reason as unknown as Uint8Array),
				});
			}
		},
	},
).annotations({ identifier: "ContractResultSchema" });
