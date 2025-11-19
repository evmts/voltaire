import { fromBytes } from "./fromBytes.js";
import { InvalidBlockHashFormatError } from "./errors.js";

/**
 * Create BlockHash from hex string
 *
 * @param {string} hex
 * @returns {import('./BlockHashType.js').BlockHashType}
 * @throws {InvalidBlockHashFormatError}
 */
export function fromHex(hex) {
	const normalized = hex.toLowerCase().replace(/^0x/, "");
	if (normalized.length !== 64) {
		throw new InvalidBlockHashFormatError(
			`BlockHash hex must be 64 characters (32 bytes), got ${normalized.length}`,
			{
				value: hex,
				expected: "64 hex characters",
			},
		);
	}
	if (!/^[0-9a-f]{64}$/.test(normalized)) {
		throw new InvalidBlockHashFormatError(
			"BlockHash hex contains invalid characters",
			{
				value: hex,
				expected: "hex string with 0-9, a-f",
			},
		);
	}
	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return fromBytes(bytes);
}
