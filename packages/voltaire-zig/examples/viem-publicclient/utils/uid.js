/**
 * Unique ID Generator
 *
 * Generates unique client identifiers.
 *
 * @module examples/viem-publicclient/utils/uid
 */

let counter = 0;

/**
 * Generate a unique ID
 *
 * @returns {string} Unique identifier
 */
export function uid() {
	return `${Date.now().toString(36)}-${(counter++).toString(36)}`;
}
