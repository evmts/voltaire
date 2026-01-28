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
 * Gets the total length of an RLP item (prefix + payload).
 *
 * @param data - RLP-encoded data
 * @returns Effect that succeeds with total length in bytes or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getLength } from 'voltaire-effect/primitives/Rlp'
 *
 * const encoded = new Uint8Array([0x83, 1, 2, 3])
 * const length = Effect.runSync(getLength(encoded))
 * // => 4 (1 byte prefix + 3 bytes payload)
 * ```
 *
 * @since 0.0.1
 */
export const getLength = (
	data: Uint8Array,
): Effect.Effect<number, RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.getLength(data),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("getLength failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
