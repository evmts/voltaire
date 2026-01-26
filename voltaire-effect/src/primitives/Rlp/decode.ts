import {
	type BrandedRlp,
	type RlpDecodingError,
	RlpDecodingError as RlpDecodingErrorClass,
	Rlp as VoltaireRlp,
} from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

/**
 * Result of RLP decoding with remaining bytes.
 * @since 0.0.1
 */
export interface Decoded {
	/** Decoded RLP data */
	data: BrandedRlp;
	/** Remaining bytes after decoding */
	remainder: Uint8Array;
}

const isRlpDecodingError = (e: unknown): e is RlpDecodingError =>
	e instanceof RlpDecodingErrorClass ||
	(e !== null && typeof e === "object" && "name" in e && e.name === "RlpDecodingError");

/**
 * RLP-decodes bytes using Effect for error handling.
 *
 * @param bytes - RLP-encoded bytes to decode
 * @param stream - If true, returns remainder bytes for stream processing
 * @returns Effect that succeeds with decoded data or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decode } from 'voltaire-effect/primitives/Rlp'
 *
 * const result = decode(rlpBytes)
 * const { data, remainder } = Effect.runSync(result)
 * ```
 *
 * @since 0.0.1
 */
export const decode = (
	bytes: Uint8Array,
	stream?: boolean,
): Effect.Effect<Decoded, RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.decode(bytes, stream),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("RLP decoding failed", { cause: e instanceof Error ? e : undefined }),
	});
