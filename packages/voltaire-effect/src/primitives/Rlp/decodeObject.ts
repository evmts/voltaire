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
 * Decodes RLP-encoded bytes to an object with known keys.
 *
 * @param data - RLP-encoded data
 * @returns Effect that succeeds with decoded object or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeObject, encodeObject } from 'voltaire-effect/primitives/Rlp'
 *
 * const encoded = Effect.runSync(encodeObject({
 *   name: new Uint8Array([65, 66]),
 *   age: new Uint8Array([25])
 * }))
 * const decoded = Effect.runSync(decodeObject(encoded))
 * ```
 *
 * @since 0.0.1
 */
export const decodeObject = (
	data: Uint8Array,
): Effect.Effect<Record<string, unknown>, RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.decodeObject(data),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("RLP object decoding failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
