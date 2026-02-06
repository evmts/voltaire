import { TransactionUrl } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing an EIP-681 transaction URL.
 * @since 0.0.1
 */
export type TransactionUrlType = ReturnType<typeof TransactionUrl.from>;

/**
 * Internal schema declaration for TransactionUrl type validation.
 * @since 0.0.1
 */
const TransactionUrlTypeSchema = S.declare<TransactionUrlType>(
	(u): u is TransactionUrlType => {
		if (typeof u !== "string") return false;
		return u.startsWith("ethereum:");
	},
	{ identifier: "TransactionUrl" },
);

/**
 * Effect Schema for validating and transforming EIP-681 transaction URLs.
 *
 * Transaction URLs encode transaction parameters in a URI format for QR codes and links.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as TransactionUrlSchema } from './TransactionUrlSchema.js'
 *
 * const url = Schema.decodeSync(TransactionUrlSchema)('ethereum:0x123...?value=1e18')
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<TransactionUrlType, string> = S.transformOrFail(
	S.String,
	TransactionUrlTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(TransactionUrl.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (i) => ParseResult.succeed(i as string),
	},
).annotations({ identifier: "TransactionUrlSchema" });
