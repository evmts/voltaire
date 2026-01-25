/**
 * @fileoverview Schema for CallData encoded as hex string.
 * @module CallData/Hex
 * @since 0.1.0
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing EVM call data.
 * @since 0.1.0
 */
export type CallDataType = HexType & { readonly __tag: "CallData" };

/**
 * Internal schema declaration for CallDataType validation.
 * @internal
 */
const CallDataTypeSchema = S.declare<CallDataType>(
	(u): u is CallDataType => {
		if (typeof u !== "string") return false;
		try {
			VoltaireHex(u);
			return true;
		} catch {
			return false;
		}
	},
	{ identifier: "CallData" },
);

/**
 * Schema for CallData encoded as a hex string.
 *
 * @description
 * Transforms hex strings to CallDataType and vice versa.
 * Call data is the input data sent with a transaction to a smart contract.
 *
 * @example Decoding
 * ```typescript
 * import * as CallData from 'voltaire-effect/primitives/CallData'
 * import * as S from 'effect/Schema'
 *
 * const data = S.decodeSync(CallData.Hex)('0xa9059cbb...')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(CallData.Hex)(data)
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<CallDataType, string> = S.transformOrFail(
	S.String,
	CallDataTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(VoltaireHex(s) as CallDataType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (data, _options, _ast) => {
			return ParseResult.succeed(data as string);
		},
	},
).annotations({ identifier: "CallData.Hex" });
