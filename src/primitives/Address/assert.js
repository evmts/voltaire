import {
	InvalidAddressError,
	InvalidChecksumError,
	InvalidValueError,
} from "./errors.js";
import { isValid } from "./isValid.js";

/**
 * Assert that value is a valid address, optionally with strict checksum validation
 *
 * @param {string | Uint8Array} value - Value to validate
 * @param {{ strict?: boolean, keccak256?: (data: Uint8Array) => Uint8Array }} [options] - Options
 * @returns {import('./AddressType.js').AddressType} The validated address as bytes
 * @throws {InvalidAddressError} If address format is invalid
 * @throws {InvalidChecksumError} If strict mode and checksum is invalid
 *
 * @example
 * ```typescript
 * // Basic validation (format only)
 * Address.assert("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 *
 * // Strict validation (requires valid checksum for mixed-case)
 * Address.assert("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", {
 *   strict: true,
 *   keccak256: hash
 * });
 *
 * // All lowercase/uppercase passes strict mode
 * Address.assert("0x742d35cc6634c0532925a3b844bc9e7595f251e3", { strict: true });
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex validation logic
export function assert(value, options = {}) {
	const { strict = false, keccak256 } = options;

	// Basic format validation
	if (!isValid(value)) {
		throw new InvalidAddressError(`Invalid address format: ${value}`, {
			value,
		});
	}

	// If strict mode and value is a string with mixed case, validate checksum
	if (strict && typeof value === "string") {
		const hex = value.startsWith("0x") ? value.slice(2) : value;

		// Check if it has mixed case (if all lower or all upper, skip checksum check)
		const hasLower = /[a-f]/.test(hex);
		const hasUpper = /[A-F]/.test(hex);

		if (hasLower && hasUpper) {
			// Mixed case - must validate checksum
			if (!keccak256) {
				throw new InvalidValueError(
					"keccak256 required for strict checksum validation of mixed-case addresses",
					{
						value,
						expected: "keccak256 hash function in options",
						code: "MISSING_KECCAK256",
					},
				);
			}

			// Compute expected checksum
			const lowerHex = hex.toLowerCase();
			const hashHex = Array.from(keccak256(new TextEncoder().encode(lowerHex)))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			let expectedChecksum = "0x";
			for (let i = 0; i < 40; i++) {
				const char = /** @type {string} */ (lowerHex[i]);
				if (/[a-f]/.test(char)) {
					// Use 4th bit of hash nibble to determine case
					const hashNibble = Number.parseInt(
						/** @type {string} */ (hashHex[i]),
						16,
					);
					expectedChecksum += hashNibble >= 8 ? char.toUpperCase() : char;
				} else {
					expectedChecksum += char;
				}
			}

			const inputChecksum = value.startsWith("0x") ? value : `0x${value}`;
			if (inputChecksum !== expectedChecksum) {
				throw new InvalidChecksumError(
					`Invalid checksum: expected ${expectedChecksum}, got ${inputChecksum}`,
					{ value, expected: expectedChecksum },
				);
			}
		}
	}

	// Convert to bytes
	if (value instanceof Uint8Array) {
		return /** @type {import('./AddressType.js').AddressType} */ (value);
	}

	// Parse hex string
	const hex = value.startsWith("0x") ? value.slice(2) : value;
	const bytes = new Uint8Array(20);
	for (let i = 0; i < 20; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return /** @type {import('./AddressType.js').AddressType} */ (bytes);
}

/**
 * Factory: Create assert function with keccak256 injected
 *
 * @param {{ keccak256: (data: Uint8Array) => Uint8Array }} deps - Crypto dependencies
 * @returns {(value: string | Uint8Array, options?: { strict?: boolean }) => import('./AddressType.js').AddressType}
 */
export function Assert({ keccak256 }) {
	return (value, options = {}) => assert(value, { ...options, keccak256 });
}
