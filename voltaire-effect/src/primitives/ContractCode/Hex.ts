/**
 * @fileoverview Schema for ContractCode encoded as hex string.
 * @module ContractCode/Hex
 * @since 0.1.0
 */

import {
	type ContractCodeType,
	from as voltaireFrom,
	toHex as voltaireToHex,
} from "@tevm/voltaire/ContractCode";
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
 * Schema for ContractCode encoded as a hex string.
 *
 * @description
 * Transforms hex strings to ContractCodeType and vice versa.
 * Contract code is compiled bytecode ready for deployment or execution.
 *
 * @example Decoding
 * ```typescript
 * import * as ContractCode from 'voltaire-effect/primitives/ContractCode'
 * import * as S from 'effect/Schema'
 *
 * const code = S.decodeSync(ContractCode.Hex)('0x608060405234801561001057600080fd5b50...')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(ContractCode.Hex)(code)
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<ContractCodeType, string> = S.transformOrFail(
	S.String,
	ContractCodeTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(voltaireFrom(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (code, _options, _ast) => {
			return ParseResult.succeed(voltaireToHex(code));
		},
	},
).annotations({ identifier: "ContractCode.Hex" });
