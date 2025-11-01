import type { Data } from "./Rlp.js";
import { encode } from "./encode.js";

/**
 * Create bytes Data from Uint8Array (this: pattern)
 */
export function fromBytes(this: Uint8Array): Data & { type: "bytes" } {
	return { type: "bytes", value: this };
}

/**
 * Create list Data from array (this: pattern)
 */
export function fromList(this: Data[]): Data & { type: "list" } {
	return { type: "list", value: this };
}

/**
 * Encode Data to RLP bytes (this: pattern)
 */
export function encodeData(this: Data): Uint8Array {
	return encode.call(this);
}

/**
 * Convert Data to bytes value (if type is bytes) (this: pattern)
 */
export function toBytes(this: Data): Uint8Array | undefined {
	return this.type === "bytes" ? this.value : undefined;
}

/**
 * Convert Data to list value (if type is list) (this: pattern)
 */
export function toList(this: Data): Data[] | undefined {
	return this.type === "list" ? this.value : undefined;
}
