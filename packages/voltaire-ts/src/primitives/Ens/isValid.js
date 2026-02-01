import { ens_normalize } from "@adraffy/ens-normalize";

/**
 * Check if ENS name is valid (can be normalized without error)
 * @param {string} name - ENS name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValid(name) {
	if (typeof name !== "string" || name.length === 0) {
		return false;
	}

	try {
		ens_normalize(name);
		return true;
	} catch {
		return false;
	}
}
