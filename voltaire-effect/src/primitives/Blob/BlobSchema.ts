/**
 * @fileoverview Blob Schema definitions for EIP-4844.
 *
 * EIP-4844 introduces "blobs" - large data structures (128KB each) that can be
 * attached to transactions for data availability. Blobs are used for Layer 2
 * rollup data and are significantly cheaper than calldata.
 *
 * Each blob is exactly 131,072 bytes (128KB) and contains 4,096 field elements
 * of 32 bytes each.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4844
 * @module BlobSchema
 * @since 0.0.1
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/** @internal */
type BrandedBlob = BlobNamespace.BrandedBlob;

/** @internal */
const BlobTypeSchema = S.declare<BrandedBlob>(
	(u): u is BrandedBlob => {
		if (!(u instanceof Uint8Array)) return false;
		return BlobNamespace.isValid(u);
	},
	{ identifier: "Blob" },
);

/**
 * Effect Schema for validating EIP-4844 blobs.
 *
 * Validates that input is exactly 131,072 bytes (128KB). This is the fixed
 * size for all EIP-4844 blobs.
 *
 * @description
 * A blob must be exactly SIZE bytes (131,072). The schema accepts:
 * - Uint8Array of exactly 131,072 bytes
 * - Array of numbers (0-255) of exactly 131,072 elements
 *
 * Use `Blob.fromData()` if you have smaller data that needs to be padded.
 *
 * @example
 * ```typescript
 * import { BlobSchema } from 'voltaire-effect/primitives/Blob'
 * import * as Schema from 'effect/Schema'
 *
 * // Validate an existing blob
 * const blob = Schema.decodeSync(BlobSchema)(blobBytes)
 * ```
 *
 * @throws ParseError - When input is not exactly 131,072 bytes
 * @see from - For creating blobs from exact-size data
 * @see fromData - For creating blobs from arbitrary data (with padding)
 * @since 0.0.1
 */
export const BlobSchema: S.Schema<BrandedBlob, Uint8Array | readonly number[]> =
	S.transformOrFail(
		S.Union(S.Uint8ArrayFromSelf, S.Array(S.Number)),
		BlobTypeSchema,
		{
			strict: true,
			decode: (bytes, _options, ast) => {
				try {
					const arr =
						bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
					// Validate size - Blob.from() pads small data instead of throwing
					if (!BlobNamespace.isValid(arr)) {
						return ParseResult.fail(
							new ParseResult.Type(
								ast,
								bytes,
								`Invalid blob size: expected 131072 bytes, got ${arr.length}`,
							),
						);
					}
					return ParseResult.succeed(BlobNamespace.from(arr));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, bytes, (e as Error).message),
					);
				}
			},
			encode: (b) => ParseResult.succeed(b as Uint8Array),
		},
	).annotations({ identifier: "BlobSchema" });
