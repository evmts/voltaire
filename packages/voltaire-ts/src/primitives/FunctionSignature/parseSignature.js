/**
 * Parse function signature into name and input types
 *
 * @param {string} signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns {{ name: string, inputs: string[] }} Parsed signature
 * @throws {Error} If signature is invalid
 * @example
 * ```javascript
 * const { name, inputs } = parseSignature('transfer(address,uint256)');
 * // { name: 'transfer', inputs: ['address', 'uint256'] }
 * ```
 */
export function parseSignature(signature) {
	const parenIndex = signature.indexOf("(");
	if (parenIndex === -1) {
		throw new Error(`Invalid function signature: ${signature}`);
	}

	const name = signature.slice(0, parenIndex);
	const paramsStr = signature.slice(parenIndex + 1, -1);

	// Handle empty params
	if (paramsStr === "") {
		return { name, inputs: [] };
	}

	// Split by comma, handling nested types (tuples, arrays)
	const inputs = [];
	let current = "";
	let depth = 0;

	for (const char of paramsStr) {
		if (char === "," && depth === 0) {
			inputs.push(current.trim());
			current = "";
		} else {
			if (char === "(") depth++;
			if (char === ")") depth--;
			current += char;
		}
	}

	if (current) {
		inputs.push(current.trim());
	}

	return { name, inputs };
}
