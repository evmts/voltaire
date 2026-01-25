import { ForkId } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Represents an Ethereum network fork identifier (EIP-2124).
 * Contains a 4-byte hash of prior forks and next expected fork block.
 * @since 0.0.1
 */
export type ForkIdType = ReturnType<typeof ForkId.from>;

/**
 * Input type for creating a ForkId.
 * @since 0.0.1
 */
export type ForkIdInput = {
	hash: Uint8Array;
	next: bigint | number;
};

const ForkIdTypeSchema = S.declare<ForkIdType>(
	(u): u is ForkIdType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as Record<string, unknown>;
		return (
			obj.hash instanceof Uint8Array &&
			(typeof obj.next === "bigint" || typeof obj.next === "number")
		);
	},
	{ identifier: "ForkId" },
);

/**
 * Effect Schema for validating and transforming ForkId values.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/ForkId'
 *
 * const forkId = S.decodeSync(Schema)({
 *   hash: new Uint8Array([0xfc, 0x64, 0xec, 0x04]),
 *   next: 1150000n
 * })
 * ```
 * @since 0.0.1
 */
export const Schema: S.Schema<ForkIdType, ForkIdInput> = S.transformOrFail(
	S.Struct({
		hash: S.Uint8ArrayFromSelf,
		next: S.Union(S.BigIntFromSelf, S.Number),
	}),
	ForkIdTypeSchema,
	{
		strict: true,
		decode: (input, _options, ast) => {
			try {
				return ParseResult.succeed(ForkId.from(input));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, input, (e as Error).message),
				);
			}
		},
		encode: (f) => ParseResult.succeed({ hash: f.hash, next: f.next }),
	},
).annotations({ identifier: "ForkIdSchema" });
