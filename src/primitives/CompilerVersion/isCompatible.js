import { compare } from "./compare.js";
import { parse } from "./parse.js";

/**
 * Check if version is compatible with a semver range
 *
 * Supports basic semver ranges:
 * - "^0.8.0" - Compatible with 0.8.x (same major.minor)
 * - "~0.8.20" - Compatible with 0.8.20-0.8.x (same major.minor, patch >= specified)
 * - ">=0.8.0" - Greater than or equal
 * - "0.8.20" - Exact match
 *
 * @param {import('./CompilerVersionType.js').CompilerVersionType} version - Version to check
 * @param {string} range - Semver range
 * @returns {boolean} True if compatible
 *
 * @example
 * ```typescript
 * const compatible = CompilerVersion.isCompatible("v0.8.20", "^0.8.0");
 * console.log(compatible); // true
 * ```
 */
export function isCompatible(version, range) {
	const parsed = parse(version);

	// Handle caret range (^): same major.minor, any patch
	if (range.startsWith("^")) {
		const rangeVersion =
			/** @type {import('./CompilerVersionType.js').CompilerVersionType} */ (
				range.slice(1)
			);
		const rangeParsed = parse(rangeVersion);

		// For ^0.y.z, must match 0.y.x (major=0 is special)
		if (rangeParsed.major === 0) {
			return (
				parsed.major === 0 &&
				parsed.minor === rangeParsed.minor &&
				parsed.patch >= rangeParsed.patch
			);
		}

		// For ^x.y.z where x > 0, must match x.y.w where w >= z
		return (
			parsed.major === rangeParsed.major &&
			parsed.minor >= rangeParsed.minor &&
			(parsed.minor > rangeParsed.minor || parsed.patch >= rangeParsed.patch)
		);
	}

	// Handle tilde range (~): same major.minor, patch >= specified
	if (range.startsWith("~")) {
		const rangeVersion =
			/** @type {import('./CompilerVersionType.js').CompilerVersionType} */ (
				range.slice(1)
			);
		const rangeParsed = parse(rangeVersion);

		return (
			parsed.major === rangeParsed.major &&
			parsed.minor === rangeParsed.minor &&
			parsed.patch >= rangeParsed.patch
		);
	}

	// Handle >= operator
	if (range.startsWith(">=")) {
		const rangeVersion =
			/** @type {import('./CompilerVersionType.js').CompilerVersionType} */ (
				range.slice(2).trim()
			);
		return compare(version, rangeVersion) >= 0;
	}

	// Handle > operator
	if (range.startsWith(">") && !range.startsWith(">=")) {
		const rangeVersion =
			/** @type {import('./CompilerVersionType.js').CompilerVersionType} */ (
				range.slice(1).trim()
			);
		return compare(version, rangeVersion) > 0;
	}

	// Handle <= operator
	if (range.startsWith("<=")) {
		const rangeVersion =
			/** @type {import('./CompilerVersionType.js').CompilerVersionType} */ (
				range.slice(2).trim()
			);
		return compare(version, rangeVersion) <= 0;
	}

	// Handle < operator
	if (range.startsWith("<") && !range.startsWith("<=")) {
		const rangeVersion =
			/** @type {import('./CompilerVersionType.js').CompilerVersionType} */ (
				range.slice(1).trim()
			);
		return compare(version, rangeVersion) < 0;
	}

	// Exact match
	const rangeVersion =
		/** @type {import('./CompilerVersionType.js').CompilerVersionType} */ (
			range
		);
	return compare(version, rangeVersion) === 0;
}
