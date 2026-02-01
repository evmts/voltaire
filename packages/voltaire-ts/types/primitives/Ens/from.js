/**
 * Create a branded ENS name from a string without validation
 * @param {string} name - ENS name
 * @returns {import('./EnsType.js').EnsType}
 */
export function from(name) {
    return /** @type {import('./EnsType.js').EnsType} */ (name);
}
