import { Eip712TypeNotFoundError } from "./errors.js";

/**
 * Validate typed data structure
 *
 * @param {import('./BrandedEIP712.js').TypedData} typedData - Typed data to validate
 * @throws {Eip712TypeNotFoundError} If structure is invalid
 *
 * @example
 * ```typescript
 * EIP712.validate(typedData); // throws if invalid
 * ```
 */
export function validate(typedData) {
	// Check primary type exists
	if (!typedData.types[typedData.primaryType]) {
		throw new Eip712TypeNotFoundError(
			`Primary type '${typedData.primaryType}' not found in types`,
		);
	}

	// Validate all type references
	/**
	 * @param {string} typeName
	 * @param {Set<string>} [visited]
	 */
	function validateType(typeName, visited = new Set()) {
		if (visited.has(typeName)) return; // Allow circular references
		visited.add(typeName);

		const typeProps = typedData.types[typeName];
		if (!typeProps) return; // Primitive type

		for (const prop of typeProps) {
			// Check if referenced type exists (if it's a custom type)
			if (typedData.types[prop.type]) {
				validateType(prop.type, visited);
			}
		}
	}

	validateType(typedData.primaryType);
}
