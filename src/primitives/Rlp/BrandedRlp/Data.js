import { encode } from "./encode.js";

/**
 * Create bytes Data from Uint8Array
 *
 * @param {Uint8Array} bytes
 * @returns {import('./BrandedRlp.js').BrandedRlp & { type: "bytes" }}
 */
export function fromBytes(bytes) {
	return { type: "bytes", value: bytes };
}

/**
 * Create list Data from array
 *
 * @param {import('./BrandedRlp.js').BrandedRlp[]} items
 * @returns {import('./BrandedRlp.js').BrandedRlp & { type: "list" }}
 */
export function fromList(items) {
	return { type: "list", value: items };
}

/**
 * Encode Data to RLP bytes
 *
 * @param {import('./BrandedRlp.js').BrandedRlp} data
 * @returns {Uint8Array}
 */
export function encodeData(data) {
	return encode(data);
}

/**
 * Convert Data to bytes value (if type is bytes)
 *
 * @param {import('./BrandedRlp.js').BrandedRlp} data
 * @returns {Uint8Array | undefined}
 */
export function toBytes(data) {
	return data.type === "bytes" ? data.value : undefined;
}

/**
 * Convert Data to list value (if type is list)
 *
 * @param {import('./BrandedRlp.js').BrandedRlp} data
 * @returns {import('./BrandedRlp.js').BrandedRlp[] | undefined}
 */
export function toList(data) {
	return data.type === "list" ? data.value : undefined;
}
