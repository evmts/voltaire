/**
 * @typedef {{ readonly name: string; readonly type: string }} EIP712Field
 * @typedef {Record<string, readonly EIP712Field[]>} EIP712Types
 */

/**
 * Encode EIP-712 type definition
 *
 * Example: "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
 *
 * @param {string} primaryType - Primary type name
 * @param {EIP712Types} types - Type definitions
 * @returns {string} Encoded type string
 */
export function encodeType(primaryType, types) {
	// Get dependencies (other custom types referenced)
	const dependencies = findTypeDependencies(primaryType, types);

	// Sort dependencies alphabetically (excluding primary type)
	const sorted = [
		primaryType,
		...dependencies.filter((t) => t !== primaryType).sort(),
	];

	// Build type string
	let result = "";
	for (const typeName of sorted) {
		const fields = types[typeName];
		if (!fields) continue;

		result += typeName;
		result += "(";
		result += fields
			.map((/** @type {EIP712Field} */ f) => `${f.type} ${f.name}`)
			.join(",");
		result += ")";
	}

	return result;
}

/**
 * Find all type dependencies recursively
 *
 * @param {string} typeName - Type name
 * @param {EIP712Types} types - Type definitions
 * @param {Set<string>} [seen] - Already seen types
 * @returns {string[]} Array of type names
 */
function findTypeDependencies(typeName, types, seen = new Set()) {
	if (seen.has(typeName)) return [];
	seen.add(typeName);

	const type = types[typeName];
	if (!type) return [];

	const deps = [];
	for (const field of type) {
		// Extract base type (handle arrays like "Person[]")
		const baseType = field.type.replace(/\[\]$/, "");

		// Check if it's a custom type (not atomic)
		if (types[baseType] && baseType !== typeName) {
			deps.push(baseType);
			// Recursively find dependencies
			const subDeps = findTypeDependencies(baseType, types, seen);
			deps.push(...subDeps);
		}
	}

	return [...new Set(deps)];
}
