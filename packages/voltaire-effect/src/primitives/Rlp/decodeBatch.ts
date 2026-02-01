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
 * Decodes multiple RLP-encoded items.
 *
 * @param data - Array of RLP-encoded data
 * @returns Effect that succeeds with array of decoded results or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeBatch, encode } from 'voltaire-effect/primitives/Rlp'
 *
 * const items = [
 *   Effect.runSync(encode([new Uint8Array([1, 2])])),
 *   Effect.runSync(encode([new Uint8Array([3, 4])]))
 * ]
 * const decoded = Effect.runSync(decodeBatch(items))
 * ```
 *
 * @since 0.0.1
 */
export const decodeBatch = (
	data: Uint8Array[],
): Effect.Effect<unknown[][], RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.decodeBatch(data),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("RLP batch decoding failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
