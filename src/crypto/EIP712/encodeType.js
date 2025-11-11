import { Eip712TypeNotFoundError } from "./errors.js";

/**
 * Encode type string for EIP-712 hashing.
 *
 * Produces type encoding like "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} primaryType - Primary type name to encode
 * @param {import('./BrandedEIP712.js').TypeDefinitions} types - Type definitions mapping
 * @returns {string} Encoded type string with primary type followed by referenced types in alphabetical order
 * @throws {Eip712TypeNotFoundError} If primaryType or any referenced type is not found
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const types = { Mail: [{ name: 'from', type: 'Person' }], Person: [{ name: 'name', type: 'string' }] };
 * const typeString = EIP712.encodeType('Mail', types);
 * // Returns: "Mail(Person from)Person(string name)"
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
