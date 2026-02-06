import { Slot } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing a beacon chain slot number.
 * Slots are 12-second time periods in Ethereum's consensus layer.
 *
 * @since 0.0.1
 */
export type SlotType = Slot.SlotType;

const SlotTypeSchema = S.declare<SlotType>(
	(u): u is SlotType => typeof u === "bigint" && u >= 0n,
	{ identifier: "Slot" },
);

/**
 * Effect Schema for validating and parsing beacon chain slot numbers.
 * Accepts numbers, bigints, or string representations.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/Slot'
 *
 * const parse = S.decodeSync(Schema)
 * const slot = parse(12345)
 * const slotFromString = parse('12345')
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<SlotType, number | bigint | string> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf, S.String),
		SlotTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(Slot.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (s) => ParseResult.succeed(Slot.toBigInt(s)),
		},
	).annotations({ identifier: "SlotSchema" });
