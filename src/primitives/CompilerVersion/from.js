/**
 * Create CompilerVersion from string
 *
 * @param {string} value - Version string (e.g., "v0.8.20+commit.a1b2c3d4")
 * @returns {import('./CompilerVersionType.js').CompilerVersionType} CompilerVersion
 * @throws {Error} If version format is invalid
 *
 * @example
 * ```typescript
 * const version = CompilerVersion.from("v0.8.20+commit.a1b2c3d4");
 * const version2 = CompilerVersion.from("0.8.20"); // Also valid
 * ```
 */
export function from(value) {
	if (typeof value !== "string") {
		throw new Error(`CompilerVersion must be a string, got ${typeof value}`);
	}

	// Normalize: ensure it doesn't have extra whitespace
	const normalized = value.trim();

	if (normalized.length === 0) {
		throw new Error("CompilerVersion cannot be empty");
	}

	// Basic validation: should start with 'v' or a digit
	if (!/^v?\d/.test(normalized)) {
		throw new Error(`Invalid compiler version format: ${normalized}`);
	}

	return /** @type {import('./CompilerVersionType.js').CompilerVersionType} */ (
		normalized
	);
}
