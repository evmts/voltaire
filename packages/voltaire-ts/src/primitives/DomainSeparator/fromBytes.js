import { InvalidDomainSeparatorLengthError } from "./errors.js";

/**
 * Create DomainSeparator from bytes
 *
 * @param {Uint8Array} bytes - 32-byte array
 * @returns {import('./DomainSeparatorType.js').DomainSeparatorType} DomainSeparator
 * @throws {InvalidDomainSeparatorLengthError} If bytes length is not 32
 * @example
 * ```javascript
 * const sep = DomainSeparator.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== 32) {
		throw new InvalidDomainSeparatorLengthError(
			`DomainSeparator must be 32 bytes, got ${bytes.length}`,
			{ value: bytes, expected: "32 bytes" },
		);
	}
	return /** @type {import('./DomainSeparatorType.js').DomainSeparatorType} */ (
		bytes
	);
}
