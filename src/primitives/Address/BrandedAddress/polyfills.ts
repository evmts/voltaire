/**
 * Polyfills for Uint8Array methods that may not be available in all environments
 */

/**
 * Convert Uint8Array to hex string with 0x prefix
 */
export function toHexPolyfill(this: Uint8Array): string {
	let hex = "0x";
	for (let i = 0; i < this.length; i++) {
		hex += this[i]?.toString(16).padStart(2, "0");
	}
	return hex;
}

/**
 * Set Uint8Array from hex string (with or without 0x prefix)
 */
export function setFromHexPolyfill(this: Uint8Array, hex: string): void {
	const str = hex.startsWith("0x") ? hex.slice(2) : hex;

	if (str.length % 2 !== 0) {
		throw new Error("Invalid hex string length");
	}

	if (str.length / 2 > this.length) {
		throw new Error("Buffer too small");
	}

	for (let i = 0; i < str.length; i += 2) {
		const byte = Number.parseInt(str.slice(i, i + 2), 16);
		if (Number.isNaN(byte)) {
			throw new Error("Invalid hex character");
		}
		this[i / 2] = byte;
	}
}

/**
 * Convert Uint8Array to base64 string
 */
export function toBase64Polyfill(this: Uint8Array): string {
	if (typeof Buffer !== "undefined") {
		return Buffer.from(this).toString("base64");
	}
	// Browser fallback
	let binary = "";
	for (let i = 0; i < this.length; i++) {
		binary += String.fromCharCode(this[i]!);
	}
	return btoa(binary);
}

/**
 * Set Uint8Array from base64 string
 */
export function setFromBase64Polyfill(this: Uint8Array, b64: string): void {
	// Validate base64 string
	if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) {
		throw new Error("Invalid base64 string");
	}

	let decoded: Uint8Array;

	try {
		if (typeof Buffer !== "undefined") {
			decoded = Buffer.from(b64, "base64");
		} else {
			// Browser fallback
			const binary = atob(b64);
			decoded = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				decoded[i] = binary.charCodeAt(i);
			}
		}
	} catch (e) {
		throw new Error("Invalid base64 string");
	}

	if (decoded.length > this.length) {
		throw new Error("Buffer too small");
	}

	this.set(decoded);
}
