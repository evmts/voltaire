import { Opcode } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing an EVM opcode value (0x00-0xFF).
 * @since 0.0.1
 */
type OpcodeType = ReturnType<typeof Opcode>;

const OpcodeTypeSchema = S.declare<OpcodeType>(
	(u): u is OpcodeType => typeof u === "number" && u >= 0x00 && u <= 0xff,
	{ identifier: "Opcode" },
);

/**
 * Effect Schema for validating and transforming EVM opcodes.
 *
 * Transforms a number (0x00-0xFF) into a validated Opcode type.
 * Used for schema-based validation of EVM instruction opcodes.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { OpcodeSchema } from 'voltaire-effect/primitives/Opcode'
 *
 * // Decode a number to Opcode
 * const opcode = S.decodeSync(OpcodeSchema)(0x01) // ADD opcode
 *
 * // Validate opcode range
 * const invalid = S.decodeSync(OpcodeSchema)(0x100) // throws - out of range
 * ```
 *
 * @since 0.0.1
 */
export const OpcodeSchema: S.Schema<OpcodeType, number> = S.transformOrFail(
	S.Number,
	OpcodeTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				if (n < 0x00 || n > 0xff) {
					throw new Error(`Opcode must be between 0x00 and 0xFF, got ${n}`);
				}
				return ParseResult.succeed(Opcode(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (opcode) => ParseResult.succeed(opcode as number),
	},
).annotations({ identifier: "OpcodeSchema" });
