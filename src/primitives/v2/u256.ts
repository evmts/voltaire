const u256Symbol = Symbol("U256");

/**
 * 256-bit unsigned integer type
 * Using bigint as the underlying representation for optimal JS performance
 */
export type U256 = bigint & { __brand: typeof u256Symbol };

/**
 * Maximum U256 value: 2^256 - 1
 */
export const MAX_U256: U256 = ((1n << 256n) - 1n) as U256;

/**
 * Zero value
 */
export const ZERO: U256 = 0n as U256;

/**
 * One value
 */
export const ONE: U256 = 1n as U256;

/**
 * Factory function to create a U256 from bigint or string
 *
 * @param value bigint or decimal/hex string
 * @returns U256 value
 * @throws Error if value is out of range or invalid
 */
export function U256(value: bigint | string): U256 {
	let bigintValue: bigint;

	if (typeof value === "string") {
		if (value.startsWith("0x") || value.startsWith("0X")) {
			bigintValue = BigInt(value);
		} else {
			bigintValue = BigInt(value);
		}
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new Error(`U256 value cannot be negative: ${bigintValue}`);
	}

	if (bigintValue > MAX_U256) {
		throw new Error(`U256 value exceeds maximum: ${bigintValue}`);
	}

	return bigintValue as U256;
}

/**
 * Namespace for U256 methods
 */
export namespace U256 {
	/**
	 * Create U256 from hex string
	 *
	 * @param hex Hex string with or without 0x prefix
	 * @returns U256 value
	 * @throws Error if hex is invalid or value out of range
	 */
	export function fromHex(hex: string): U256 {
		const normalized = hex.startsWith("0x") ? hex : `0x${hex}`;
		const value = BigInt(normalized);

		if (value < 0n) {
			throw new Error(`U256 value cannot be negative: ${value}`);
		}

		if (value > MAX_U256) {
			throw new Error(`U256 value exceeds maximum: ${value}`);
		}

		return value as U256;
	}

	/**
	 * Create U256 from bigint
	 *
	 * @param value bigint value
	 * @returns U256 value
	 * @throws Error if value out of range
	 */
	export function fromBigInt(value: bigint): U256 {
		if (value < 0n) {
			throw new Error(`U256 value cannot be negative: ${value}`);
		}

		if (value > MAX_U256) {
			throw new Error(`U256 value exceeds maximum: ${value}`);
		}

		return value as U256;
	}

	/**
	 * Create U256 from bytes (big-endian)
	 *
	 * @param bytes Uint8Array of up to 32 bytes
	 * @returns U256 value
	 * @throws Error if bytes length exceeds 32
	 */
	export function fromBytes(bytes: Uint8Array): U256 {
		if (bytes.length > 32) {
			throw new Error(`U256 bytes cannot exceed 32 bytes, got ${bytes.length}`);
		}

		let value = 0n;
		for (let i = 0; i < bytes.length; i++) {
			value = (value << 8n) | BigInt(bytes[i]);
		}

		return value as U256;
	}

	/**
	 * Convert U256 to hex string
	 *
	 * @param value U256 value
	 * @returns Hex string with 0x prefix
	 */
	export function toHex(value: U256): string {
		const hex = value.toString(16);
		return `0x${hex.padStart(64, "0")}`;
	}

	/**
	 * Convert U256 to bigint
	 *
	 * @param value U256 value
	 * @returns bigint value
	 */
	export function toBigInt(value: U256): bigint {
		return value as bigint;
	}

	/**
	 * Convert U256 to bytes (big-endian, 32 bytes)
	 *
	 * @param value U256 value
	 * @returns 32-byte Uint8Array
	 */
	export function toBytes(value: U256): Uint8Array {
		const bytes = new Uint8Array(32);
		let val = value as bigint;

		for (let i = 31; i >= 0; i--) {
			bytes[i] = Number(val & 0xffn);
			val = val >> 8n;
		}

		return bytes;
	}

	/**
	 * Add two U256 values
	 *
	 * @param a First operand
	 * @param b Second operand
	 * @returns Sum (a + b) mod 2^256
	 */
	export function add(a: U256, b: U256): U256 {
		// Wrapping addition: (a + b) mod 2^256
		const sum = (a as bigint) + (b as bigint);
		return (sum & MAX_U256) as U256;
	}

	/**
	 * Subtract two U256 values
	 *
	 * @param a First operand
	 * @param b Second operand
	 * @returns Difference (a - b) mod 2^256
	 */
	export function sub(a: U256, b: U256): U256 {
		// Wrapping subtraction: if a < b, wraps around
		const diff = (a as bigint) - (b as bigint);
		if (diff < 0n) {
			return ((MAX_U256 as bigint) + 1n + diff) as U256;
		}
		return diff as U256;
	}

	/**
	 * Multiply two U256 values
	 *
	 * @param a First operand
	 * @param b Second operand
	 * @returns Product (a * b) mod 2^256
	 */
	export function mul(a: U256, b: U256): U256 {
		// Wrapping multiplication: (a * b) mod 2^256
		const product = (a as bigint) * (b as bigint);
		return (product & MAX_U256) as U256;
	}

	/**
	 * Divide two U256 values
	 *
	 * @param a Dividend
	 * @param b Divisor
	 * @returns Quotient (a / b), floor division
	 * @throws Error if divisor is zero
	 */
	export function div(a: U256, b: U256): U256 {
		if (b === 0n) {
			throw new Error("Division by zero");
		}
		return ((a as bigint) / (b as bigint)) as U256;
	}

	/**
	 * Modulo operation on two U256 values
	 *
	 * @param a Dividend
	 * @param b Divisor
	 * @returns Remainder (a % b)
	 * @throws Error if divisor is zero
	 */
	export function mod(a: U256, b: U256): U256 {
		if (b === 0n) {
			throw new Error("Modulo by zero");
		}
		return ((a as bigint) % (b as bigint)) as U256;
	}
}
