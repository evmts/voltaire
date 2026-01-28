import {
	type RlpDecodingError,
	RlpDecodingError as RlpDecodingErrorClass,
	Rlp as VoltaireRlp,
} from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

const isRlpDecodingError = (e: unknown): e is RlpDecodingError =>
	e instanceof RlpDecodingErrorClass ||
	(e !== null &&
		typeof e === "object" &&
		"name" in e &&
		e.name === "RlpDecodingError");

/**
 * Decodes RLP-encoded bytes and returns the value directly.
 *
 * This is a convenience wrapper around decode() that returns just the decoded value
 * without the metadata wrapper.
 *
 * @param bytes - RLP-encoded data
 * @returns Effect that succeeds with decoded value or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeValue } from 'voltaire-effect/primitives/Rlp'
 *
 * // Decode bytes - returns Uint8Array directly
 * const value = Effect.runSync(decodeValue(new Uint8Array([0x83, 1, 2, 3])))
 * // => Uint8Array([1, 2, 3])
 *
 * // Decode list - returns nested arrays
 * const items = Effect.runSync(decodeValue(new Uint8Array([0xc3, 0x01, 0x02, 0x03])))
 * // => [Uint8Array([1]), Uint8Array([2]), Uint8Array([3])]
 * ```
 *
 * @since 0.0.1
 */
export const decodeValue = (
	bytes: Uint8Array,
): Effect.Effect<Uint8Array | unknown[], RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.decodeValue(bytes),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("RLP value decoding failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
