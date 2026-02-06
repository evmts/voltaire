import {
	type BrandedRlp,
	type RlpEncodingError,
	RlpEncodingError as RlpEncodingErrorClass,
	Rlp as VoltaireRlp,
} from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

type Encodable = Uint8Array | BrandedRlp | Encodable[];

const isRlpEncodingError = (e: unknown): e is RlpEncodingError =>
	e instanceof RlpEncodingErrorClass ||
	(e !== null &&
		typeof e === "object" &&
		"name" in e &&
		e.name === "RlpEncodingError");

/**
 * Gets the total byte length of RLP-encoded data without actually encoding.
 *
 * @param data - Data to measure
 * @returns Effect that succeeds with length in bytes after RLP encoding or fails with RlpEncodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getEncodedLength } from 'voltaire-effect/primitives/Rlp'
 *
 * const bytes = new Uint8Array([1, 2, 3])
 * const length = Effect.runSync(getEncodedLength(bytes))
 * // => 4 (0x83 prefix + 3 bytes)
 * ```
 *
 * @since 0.0.1
 */
export const getEncodedLength = (
	data: Encodable,
): Effect.Effect<number, RlpEncodingError> =>
	Effect.try({
		try: () => VoltaireRlp.getEncodedLength(data),
		catch: (e) =>
			isRlpEncodingError(e)
				? e
				: new RlpEncodingErrorClass("getEncodedLength failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
