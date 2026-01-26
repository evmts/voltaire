import {
	type RlpDecodingError,
	RlpDecodingError as RlpDecodingErrorClass,
	Rlp as VoltaireRlp,
} from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

const isRlpDecodingError = (e: unknown): e is RlpDecodingError =>
	e instanceof RlpDecodingErrorClass ||
	(e !== null && typeof e === "object" && "name" in e && e.name === "RlpDecodingError");

/**
 * RLP-decodes bytes to an array.
 *
 * @param data - RLP-encoded data
 * @returns Effect that succeeds with decoded array or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeArray, encodeArray } from 'voltaire-effect/primitives/Rlp'
 *
 * const encoded = Effect.runSync(encodeArray([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4])
 * ]))
 *
 * const arr = Effect.runSync(decodeArray(encoded))
 * // => [Uint8Array([1, 2]), Uint8Array([3, 4])]
 * ```
 *
 * @since 0.0.1
 */
export const decodeArray = (
	data: Uint8Array,
): Effect.Effect<unknown[], RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.decodeArray(data),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("RLP array decoding failed", { cause: e instanceof Error ? e : undefined }),
	});
