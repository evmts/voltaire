/**
 * @fileoverview BundleHash Schema definitions for ERC-4337 account abstraction.
 *
 * A BundleHash is a 32-byte identifier for a Bundle of UserOperations.
 * It is used to track and reference bundles that have been submitted.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @module BundleHashSchema
 * @since 0.0.1
 */
import { Bytes32, type Bytes32Type } from "@tevm/voltaire/Bytes";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing a Bundle hash (32 bytes).
 * @since 0.0.1
 */
export type BundleHashType = Bytes32Type & { readonly __tag: "BundleHash" };

const BundleHashTypeSchema = S.declare<BundleHashType>(
	(u): u is BundleHashType => {
		if (!(u instanceof Uint8Array)) return false;
		return u.length === 32;
	},
	{ identifier: "BundleHash" },
);

/**
 * Effect Schema for validating Bundle hashes.
 *
 * Accepts hex strings, Uint8Array, bigint, or number and returns
 * a branded 32-byte BundleHashType.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { BundleHashSchema } from 'voltaire-effect/primitives/BundleHash'
 *
 * const hash = Schema.decodeSync(BundleHashSchema)('0x...')
 * ```
 *
 * @since 0.0.1
 */
export const BundleHashSchema: S.Schema<
	BundleHashType,
	string | Uint8Array | bigint | number
> = S.transformOrFail(
	S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
	BundleHashTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(
					Bytes32.Bytes32(
						s as string | Uint8Array | bigint | number,
					) as BundleHashType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (b) => ParseResult.succeed(b),
	},
).annotations({ identifier: "BundleHashSchema" });
