/**
 * Minimal JavaScript Address implementation for bundle size testing
 */

const SIZE = 20;
const HEX_SIZE = 42;

class InvalidHexFormatError extends Error {
	constructor() {
		super("Invalid hex format");
	}
}

class InvalidHexStringError extends Error {
	constructor() {
		super("Invalid hex string");
	}
}

export function fromHex(hex: string): Uint8Array {
	if (!hex.startsWith("0x") || hex.length !== HEX_SIZE) {
		throw new InvalidHexFormatError();
	}
	const hexPart = hex.slice(2);
	if (!/^[0-9a-fA-F]{40}$/.test(hexPart)) {
		throw new InvalidHexStringError();
	}
	const bytes = new Uint8Array(SIZE);
	for (let i = 0; i < SIZE; i++) {
		const byte = Number.parseInt(hexPart.slice(i * 2, i * 2 + 2), 16);
		bytes[i] = byte;
	}
	return bytes;
}

export function toHex(address: Uint8Array): string {
	return `0x${Array.from(address, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function isValid(hex: string): boolean {
	if (hex.length === 42) {
		if (!hex.startsWith("0x")) return false;
		return /^0x[0-9a-fA-F]{40}$/.test(hex);
	} else if (hex.length === 40) {
		return /^[0-9a-fA-F]{40}$/.test(hex);
	}
	return false;
}

export function equals(addr1: Uint8Array, addr2: Uint8Array): boolean {
	if (addr1.length !== SIZE || addr2.length !== SIZE) return false;
	for (let i = 0; i < SIZE; i++) {
		if (addr1[i] !== addr2[i]) return false;
	}
	return true;
}

export function isZero(address: Uint8Array): boolean {
	for (let i = 0; i < SIZE; i++) {
		if (address[i] !== 0) return false;
	}
	return true;
}

export const ZERO = new Uint8Array(SIZE);
