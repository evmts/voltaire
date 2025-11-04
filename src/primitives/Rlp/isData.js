/**
 * Check if value is RLP Data structure
 *
 * @param {unknown} value
 * @returns {value is import('./BrandedRlp.js').BrandedRlp}
 */
export function isData(value) {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"value" in value &&
		(value.type === "bytes" || value.type === "list")
	);
}
