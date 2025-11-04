import type { BrandedRlp } from "./BrandedRlp.js";
import { encode } from "./encode.js";

/**
 * Create bytes Data from Uint8Array
 */
export function fromBytes(bytes: Uint8Array): BrandedRlp & { type: "bytes" } {
	return { type: "bytes", value: bytes };
}

/**
 * Create list Data from array
 */
export function fromList(items: BrandedRlp[]): BrandedRlp & { type: "list" } {
	return { type: "list", value: items };
}

/**
 * Encode Data to RLP bytes
 */
export function encodeData(data: BrandedRlp): Uint8Array {
	return encode(data);
}

/**
 * Convert Data to bytes value (if type is bytes)
 */
export function toBytes(data: BrandedRlp): Uint8Array | undefined {
	return data.type === "bytes" ? data.value : undefined;
}

/**
 * Convert Data to list value (if type is list)
 */
export function toList(data: BrandedRlp): BrandedRlp[] | undefined {
	return data.type === "list" ? data.value : undefined;
}
