/**
 * Encoding utilities
 * Base58, Base64, UTF-8 with error handling
 */

/**
 * Encode bytes to Base58
 */
export function encodeBase58(data: Uint8Array): string {
	throw new Error("not implemented");
}

/**
 * Decode Base58 to bytes
 */
export function decodeBase58(text: string): Uint8Array {
	throw new Error("not implemented");
}

/**
 * Encode bytes to Base64
 */
export function encodeBase64(data: Uint8Array): string {
	throw new Error("not implemented");
}

/**
 * Decode Base64 to bytes
 */
export function decodeBase64(text: string): Uint8Array {
	throw new Error("not implemented");
}

/**
 * UTF-8 error handling strategies
 */
export const Utf8ErrorFuncs = {
	error: (reason: string) => {
		throw new Error(reason);
	},
	ignore: () => {
		/* ignore */
	},
	replace: () => "\ufffd",
};

/**
 * Convert bytes to UTF-8 string with error handling
 */
export function toUtf8String(
	bytes: Uint8Array,
	onError?: (reason: string) => void | string,
): string {
	throw new Error("not implemented");
}

/**
 * Convert string to UTF-8 bytes
 */
export function toUtf8Bytes(text: string): Uint8Array {
	throw new Error("not implemented");
}

/**
 * Extract UTF-8 code points
 */
export function toUtf8CodePoints(
	bytes: Uint8Array,
	onError?: (reason: string) => void | number,
): number[] {
	throw new Error("not implemented");
}
