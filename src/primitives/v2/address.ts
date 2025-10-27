/**
 * Ethereum Address V2 API
 * Branded Uint8Array with namespaced methods
 */

import { keccak256 } from "../../crypto/keccak.ts";

const addressSymbol = Symbol("Address");
export const ADDRESS_SIZE = 20;

export type Address = Uint8Array & { readonly __brand: typeof addressSymbol };

// Helper: strict hex parsing (requires 0x prefix)
function fromHexStrict(hex: string): Uint8Array {
	if (!hex.startsWith("0x") || hex.length !== 42)
		throw new Error("InvalidHexFormat");
	const bytes = new Uint8Array(20);
	for (let i = 0; i < 20; i++) {
		const byte = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
		if (Number.isNaN(byte)) throw new Error("InvalidHexString");
		bytes[i] = byte;
	}
	return bytes;
}

// Helper: bytes to hex
function bytesToHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// Brand raw bytes as Address
function brand(bytes: Uint8Array): Address {
	if (bytes.length !== ADDRESS_SIZE) throw new Error("InvalidAddressLength");
	return bytes as Address;
}

// Type guard
export function isAddress(value: unknown): value is Address {
	return (
		value instanceof Uint8Array &&
		value.length === ADDRESS_SIZE &&
		"__brand" in value
	);
}

// Factory: Address(value) or new Address(value)
export const Address = Object.assign(
	function Address(value: string): Address {
		return Address.fromHex(value);
	},
	{
		// --- Conversions ---

		fromHex(hex: string): Address {
			return brand(fromHexStrict(hex));
		},

		fromBytes(bytes: Uint8Array): Address {
			if (bytes.length !== ADDRESS_SIZE) throw new Error("InvalidAddressLength");
			return brand(new Uint8Array(bytes));
		},

		fromU256(value: bigint): Address {
			const bytes = new Uint8Array(20);
			let v = value & ((1n << 160n) - 1n);
			for (let i = 19; i >= 0; i--) {
				bytes[i] = Number(v & 0xffn);
				v >>= 8n;
			}
			return brand(bytes);
		},

		toHex(addr: Address): string {
			return bytesToHex(addr);
		},

		toChecksumHex(addr: Address): string {
			const lower = bytesToHex(addr).slice(2);
			const hash = keccak256(new TextEncoder().encode(lower)).slice(2);
			let result = "0x";
			for (let i = 0; i < 40; i++) {
				const ch = lower[i];
				if (ch >= "a" && ch <= "f") {
					const hv = Number.parseInt(hash[i], 16);
					result += hv >= 8 ? ch.toUpperCase() : ch;
				} else {
					result += ch;
				}
			}
			return result;
		},

		toU256(addr: Address): bigint {
			throw new Error("NotImplemented");
		},

		// --- Checks ---

		isZero(addr: Address): boolean {
			return addr.every((b) => b === 0);
		},

		equals(a: Address, b: Address): boolean {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false;
			}
			return true;
		},

		isValid(str: string): boolean {
			if (!str.startsWith("0x")) return str.length === 40 && /^[0-9a-fA-F]{40}$/.test(str);
			return str.length === 42 && /^0x[0-9a-fA-F]{40}$/.test(str);
		},

		isValidChecksum(str: string): boolean {
			if (!Address.isValid(str)) return false;
			try {
				const addr = Address.fromHex(str.startsWith("0x") ? str : `0x${str}`);
				const checksummed = Address.toChecksumHex(addr);
				return checksummed === (str.startsWith("0x") ? str : `0x${str}`);
			} catch {
				return false;
			}
		},

		// --- Special addresses ---

		zero(): Address {
			return brand(new Uint8Array(20));
		},

		// --- Stubs (not implemented) ---

		fromPublicKey(_x: bigint, _y: bigint): Address {
			throw new Error("NotImplemented");
		},

		calculateCreateAddress(_creator: Address, _nonce: bigint): Address {
			throw new Error("NotImplemented");
		},

		calculateCreate2Address(
			_creator: Address,
			_salt: bigint,
			_initCode: Uint8Array,
		): Address {
			throw new Error("NotImplemented");
		},
	},
) as AddressConstructor;

interface AddressConstructor {
	(value: string): Address;
	new (value: string): Address;
	fromHex(hex: string): Address;
	fromBytes(bytes: Uint8Array): Address;
	fromU256(value: bigint): Address;
	toHex(addr: Address): string;
	toChecksumHex(addr: Address): string;
	toU256(addr: Address): bigint;
	isZero(addr: Address): boolean;
	equals(a: Address, b: Address): boolean;
	isValid(str: string): boolean;
	isValidChecksum(str: string): boolean;
	zero(): Address;
	fromPublicKey(x: bigint, y: bigint): Address;
	calculateCreateAddress(creator: Address, nonce: bigint): Address;
	calculateCreate2Address(
		creator: Address,
		salt: bigint,
		initCode: Uint8Array,
	): Address;
}

export { addressSymbol };
