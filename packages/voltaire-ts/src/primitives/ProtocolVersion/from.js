import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create ProtocolVersion from string
 *
 * @param {string} value - Protocol version string (e.g., "eth/67", "snap/1")
 * @returns {import('./ProtocolVersionType.js').ProtocolVersionType} Branded protocol version
 * @throws {InvalidFormatError} If value is not a valid protocol version format
 *
 * @example
 * ```javascript
 * import * as ProtocolVersion from './primitives/ProtocolVersion/index.js';
 * const eth67 = ProtocolVersion.from("eth/67");
 * const snap1 = ProtocolVersion.from("snap/1");
 * ```
 */
export function from(value) {
	if (typeof value !== "string") {
		throw new InvalidFormatError(
			`Protocol version must be a string, got ${typeof value}`,
			{
				value,
				expected: "String in format 'protocol/version'",
				code: -32602,
				docsPath: "/primitives/protocol-version/from#error-handling",
			},
		);
	}

	// Validate format: protocol/version
	const parts = value.split("/");
	if (parts.length !== 2) {
		throw new InvalidFormatError(
			`Protocol version must be in format 'protocol/version', got ${value}`,
			{
				value,
				expected: "String in format 'protocol/version' (e.g., 'eth/67')",
				code: -32602,
				docsPath: "/primitives/protocol-version/from#error-handling",
			},
		);
	}

	const [protocol, version] = parts;
	if (!protocol || !version) {
		throw new InvalidFormatError(
			`Protocol version components cannot be empty, got ${value}`,
			{
				value,
				expected: "Non-empty protocol and version (e.g., 'eth/67')",
				code: -32602,
				docsPath: "/primitives/protocol-version/from#error-handling",
			},
		);
	}

	return /** @type {import('./ProtocolVersionType.js').ProtocolVersionType} */ (
		value
	);
}
