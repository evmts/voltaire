import { Eip712TypeNotFoundError } from "./errors.js";

/**
 * Encode type string for EIP-712
 *
 * Example: "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
 *
 * @param {string} primaryType - Primary type name
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions
 * @returns {string} Encoded type string
 *
 * @example
 * ```typescript
 * const typeString = EIP712.encodeType('Mail', types);
 * ```
 */
export function encodeType(primaryType, types) {
	const visited = new Set();
	/** @type {string[]} */
	const result = [];

	/**
	 * @param {string} typeName
	 */
	function encodeTypeRecursive(typeName) {
		if (visited.has(typeName)) return;

		const typeProps = types[typeName];
		if (!typeProps) {
			throw new Eip712TypeNotFoundError(`Type '${typeName}' not found`);
		}

		visited.add(typeName);

		// Add main type definition
		const fields = typeProps.map((p) => `${p.type} ${p.name}`).join(",");
		result.push(`${typeName}(${fields})`);

		// Recursively encode referenced custom types (in alphabetical order)
		const referencedTypes = typeProps
			.map((p) => p.type)
			.filter((t) => types[t] !== undefined)
			.sort();

		for (const refType of referencedTypes) {
			if (!visited.has(refType)) {
				encodeTypeRecursive(refType);
			}
		}
	}

	encodeTypeRecursive(primaryType);
	return result.join("");
}
