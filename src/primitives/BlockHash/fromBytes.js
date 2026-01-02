import { InvalidBlockHashLengthError } from "./errors.js";

/**
 * Create BlockHash from bytes
 *
 * @param {Uint8Array} bytes
 * @returns {import('./BlockHashType.js').BlockHashType}
 * @throws {InvalidBlockHashLengthError}
 */
export function fromBytes(bytes) {
	if (bytes.length !== 32) {
		throw new InvalidBlockHashLengthError(
			`BlockHash must be 32 bytes, got ${bytes.length}`,
			{
				value: bytes,
				expected: "32 bytes",
				context: { actualLength: bytes.length },
			},
		);
	}
	return /** @type {import('./BlockHashType.js').BlockHashType} */ (
		new Uint8Array(bytes)
	);
}
