import { InvalidPathError } from "./errors.js";

/**
 * Parse BIP-32 derivation path string
 *
 * @param {string} path - Path string (e.g. "m/44'/60'/0'/0/0")
 * @returns {number[]} Path as array of numbers
 * @throws {InvalidPathError} If path component is invalid or negative
 */
export function parsePath(path) {
	const HARDENED = 0x80000000;

	// Remove leading m/ or M/
	const normalized = path.replace(/^[mM]\//, "");

	const parts = normalized.split("/");
	const result = [];

	for (const part of parts) {
		if (part === "") continue;

		const isHardened = part.endsWith("'") || part.endsWith("h");
		const indexStr = isHardened ? part.slice(0, -1) : part;
		const index = Number.parseInt(indexStr, 10);

		if (Number.isNaN(index) || index < 0) {
			throw new InvalidPathError(`Invalid path component: ${part}`, {
				code: "INVALID_PATH_COMPONENT",
				context: { path, component: part },
				docsPath: "/crypto/hdwallet/parse-path#error-handling",
			});
		}

		result.push(isHardened ? HARDENED + index : index);
	}

	return result;
}
