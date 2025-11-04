import type { BrandedBlob } from "./BrandedBlob.js";
import { fromData } from "./fromData.js";
import { isValid } from "./isValid.js";

/**
 * Create blob from Uint8Array (either raw blob data or data to encode)
 *
 * @param value - Uint8Array (either 131072 bytes blob or data to encode)
 * @returns Blob
 *
 * @example
 * ```typescript
 * const blob1 = Blob.from(new Uint8Array(131072)); // Raw blob
 * const blob2 = Blob.from(new TextEncoder().encode("Hello")); // Encoded data
 * ```
 */
export function from(value: Uint8Array): BrandedBlob {
	if (isValid(value)) {
		return value;
	}
	return fromData(value);
}
