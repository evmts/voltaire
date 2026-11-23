import { parseIndex } from "./parseIndex.js";

/**
 * Parse BIP-32 derivation path string
 *
 * Every segment must be a BIP-32 index. Empty segments (`m/1//2`, `m/1/`,
 * `m/`) are rejected, matching `isValidPath`.
 *
 * @param {string} path - Path string (e.g. "m/44'/60'/0'/0/0")
 * @returns {number[]} Path as array of numbers
 * @throws {import('./errors.js').InvalidPathError} If a component is empty or not a valid BIP-32 index
 */
export function parsePath(path) {
	// Remove leading m/ or M/
	const normalized = path.replace(/^[mM]\//, "");
	// parseIndex rejects the empty string, so empty segments throw.
	return normalized.split("/").map(parseIndex);
}
