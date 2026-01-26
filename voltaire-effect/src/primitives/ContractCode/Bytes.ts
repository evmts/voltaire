/**
 * @fileoverview Schema for ContractCode encoded as Uint8Array.
 * @module ContractCode/Bytes
 * @since 0.1.0
 */

import { ContractCode } from "@tevm/voltaire";

type ContractCodeType = ReturnType<typeof ContractCode.from>;
const voltaireFrom = ContractCode.from;

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Internal schema declaration for ContractCodeType validation.
 * @internal
 */
const ContractCodeTypeSchema = S.declare<ContractCodeType>(
	(u): u is ContractCodeType => u instanceof Uint8Array,
	{ identifier: "ContractCode" },
);

/**
 * Schema for ContractCode encoded as Uint8Array.
 *
 * @description
 * Transforms Uint8Array to ContractCodeType and vice versa.
 *
 * @example Decoding
 * ```typescript
 * import * as ContractCode from 'voltaire-effect/primitives/ContractCode'
 * import * as S from 'effect/Schema'
 *
 * const code = S.decodeSync(ContractCode.Bytes)(new Uint8Array([0x60, 0x80]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(ContractCode.Bytes)(code)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<ContractCodeType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	ContractCodeTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(voltaireFrom(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (code, _options, _ast) => {
			return ParseResult.succeed(code as Uint8Array);
		},
	},
).annotations({ identifier: "ContractCode.Bytes" });
