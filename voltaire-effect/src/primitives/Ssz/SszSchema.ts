import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing SSZ (Simple Serialize) encoded data.
 * SSZ is the serialization format used by Ethereum's consensus layer.
 *
 * @example
 * ```typescript
 * import { Ssz } from 'voltaire-effect/primitives'
 *
 * const data: SszType = sszEncodedBytes
 * ```
 *
 * @since 0.0.1
 */
export type SszType = Uint8Array & { readonly __tag: "Ssz" };

const SszTypeSchema = S.declare<SszType>(
	(u): u is SszType => u instanceof Uint8Array,
	{ identifier: "SszType" },
);

/**
 * Effect Schema for validating SSZ (Simple Serialize) encoded data.
 * Wraps Uint8Array with a branded type for type safety.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/Ssz'
 *
 * const parse = S.decodeSync(Schema)
 * const sszData = parse(new Uint8Array([1, 2, 3]))
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<SszType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	SszTypeSchema,
	{
		strict: true,
		decode: (s, _options, _ast) => {
			return ParseResult.succeed(s as SszType);
		},
		encode: (s) => ParseResult.succeed(s as Uint8Array),
	},
).annotations({ identifier: "SszSchema" });
