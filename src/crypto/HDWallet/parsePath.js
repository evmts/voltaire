import { InvalidPathError } from "./errors.js";

/**
 * Maximum valid child index for BIP-32 derivation (2^31 - 1).
 * @type {number}
 */
const MAX_CHILD_INDEX = 0x7fffffff;

/**
 * Parse BIP-32 derivation path string
 *
 * @param {string} path - Path string (e.g. "m/44'/60'/0'/0/0")
 * @returns {number[]} Path as array of numbers
 * @throws {InvalidPathError} If path format is invalid, component is invalid, negative, or exceeds 2^31-1
 */
export function parsePath(path) {
	const HARDENED = 0x80000000;

	// Must start with m/ or M/
	if (!/^[mM]\//.test(path)) {
		throw new InvalidPathError(
			`Path must start with "m/": ${path}`,
			{
				code: "INVALID_PATH_FORMAT",
				context: { path },
				docsPath: "/crypto/hdwallet/parse-path#error-handling",
			},
		);
	}

	// Remove leading m/ or M/
	const normalized = path.replace(/^[mM]\//, "");

	// Must have at least one component
	if (normalized === "") {
		throw new InvalidPathError(
			`Path must have at least one component after "m/": ${path}`,
			{
				code: "INVALID_PATH_FORMAT",
				context: { path },
				docsPath: "/crypto/hdwallet/parse-path#error-handling",
			},
		);
	}

	const parts = normalized.split("/");
	const result = [];

	for (const part of parts) {
		// Empty parts indicate double slashes or trailing slash
		if (part === "") {
			throw new InvalidPathError(
				`Invalid path component (empty): ${path}`,
				{
					code: "INVALID_PATH_COMPONENT",
					context: { path, component: part },
					docsPath: "/crypto/hdwallet/parse-path#error-handling",
				},
			);
		}

		const isHardened = part.endsWith("'") || part.endsWith("h");
		const indexStr = isHardened ? part.slice(0, -1) : part;

		// Validate numeric format (digits only)
		if (!/^\d+$/.test(indexStr)) {
			throw new InvalidPathError(`Invalid path component: ${part}`, {
				code: "INVALID_PATH_COMPONENT",
				context: { path, component: part },
				docsPath: "/crypto/hdwallet/parse-path#error-handling",
			});
		}

		const index = Number.parseInt(indexStr, 10);

		if (Number.isNaN(index) || index < 0) {
			throw new InvalidPathError(`Invalid path component: ${part}`, {
				code: "INVALID_PATH_COMPONENT",
				context: { path, component: part },
				docsPath: "/crypto/hdwallet/parse-path#error-handling",
			});
		}

		if (index > MAX_CHILD_INDEX) {
			throw new InvalidPathError(
				`Index exceeds maximum (2^31-1): ${part}`,
				{
					code: "INDEX_OUT_OF_RANGE",
					context: { path, component: part, index, max: MAX_CHILD_INDEX },
					docsPath: "/crypto/hdwallet/parse-path#error-handling",
				},
			);
		}

		result.push(isHardened ? HARDENED + index : index);
	}

	return result;
}
