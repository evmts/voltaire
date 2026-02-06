import { InvalidBlockHashLengthError } from "./errors.js";

/** @constant {number} */
const SIZE = 32;

/**
 * Create BlockHash from bytes. Returns a copy of the input.
 *
 * @param {Uint8Array} bytes - Input bytes (must be 32 bytes)
 * @returns {import('./BlockHashType.js').BlockHashType} BlockHash copy
 * @throws {InvalidBlockHashLengthError} If bytes length is not 32
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new InvalidBlockHashLengthError(
			`BlockHash must be 32 bytes, got ${bytes.length}`,
			{
				value: bytes,
				expected: "32 bytes",
				context: { actualLength: bytes.length },
			},
		);
	}
	const result = new Uint8Array(SIZE);
	result.set(bytes);
	return /** @type {import('./BlockHashType.js').BlockHashType} */ (result);
}
