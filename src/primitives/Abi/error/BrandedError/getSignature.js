/**
 * Get the signature string for an error (e.g., "MyError(uint256,address)")
 *
 * @template {string} TName
 * @template {readonly import('../../Parameter.js').Parameter[]} TInputs
 * @param {import('./BrandedError.js').BrandedError<TName, TInputs>} error - ABI error definition
 * @returns {string} Error signature string
 *
 * @example
 * ```typescript
 * const error = { type: "error", name: "Unauthorized", inputs: [{ type: "address", name: "sender" }] };
 * const sig = getSignature(error); // "Unauthorized(address)"
 * ```
 */
export function getSignature(error) {
	const inputs = error.inputs.map((p) => p.type).join(",");
	return `${error.name}(${inputs})`;
}
