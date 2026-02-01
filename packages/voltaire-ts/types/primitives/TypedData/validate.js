import { InvalidTypedDataError } from "./errors.js";
/**
 * Validate EIP-712 typed data structure
 *
 * @param {import('./TypedDataType.js').TypedDataType} typedData - TypedData
 * @throws {InvalidTypedDataError} If validation fails
 * @example
 * ```javascript
 * TypedData.validate(typedData); // throws if invalid
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: typed data validation requires many checks
export function validate(typedData) {
    // Validate types object
    if (!typedData.types || typeof typedData.types !== "object") {
        throw new InvalidTypedDataError("types must be an object", {
            value: typedData,
        });
    }
    // Validate EIP712Domain exists
    if (!typedData.types.EIP712Domain) {
        throw new InvalidTypedDataError("types must include EIP712Domain", {
            value: typedData,
        });
    }
    // Validate primaryType
    if (!typedData.primaryType || typeof typedData.primaryType !== "string") {
        throw new InvalidTypedDataError("primaryType must be a string", {
            value: typedData,
        });
    }
    // Validate primaryType exists in types
    if (!typedData.types[typedData.primaryType]) {
        throw new InvalidTypedDataError(`primaryType '${typedData.primaryType}' not found in types`, { value: typedData });
    }
    // Validate domain
    if (!typedData.domain || typeof typedData.domain !== "object") {
        throw new InvalidTypedDataError("domain must be an object", {
            value: typedData,
        });
    }
    // Validate message exists
    if (typedData.message === undefined) {
        throw new InvalidTypedDataError("message is required", {
            value: typedData,
        });
    }
    // Validate all type definitions
    for (const [typeName, fields] of Object.entries(typedData.types)) {
        if (!Array.isArray(fields)) {
            throw new InvalidTypedDataError(`type '${typeName}' must be an array of fields`, { value: typedData });
        }
        for (const field of fields) {
            if (!field.name || typeof field.name !== "string") {
                throw new InvalidTypedDataError(`field in type '${typeName}' must have a name (string)`, { value: typedData });
            }
            if (!field.type || typeof field.type !== "string") {
                throw new InvalidTypedDataError(`field '${field.name}' in type '${typeName}' must have a type (string)`, { value: typedData });
            }
        }
    }
    // Validate type dependencies exist
    validateTypeDependencies(typedData.primaryType, typedData.types, new Set());
}
/**
 * Validate all type dependencies exist
 *
 * @param {string} typeName - Type name
 * @param {Record<string, readonly {readonly name: string, readonly type: string}[]>} types - Type definitions
 * @param {Set<string>} seen - Already validated types
 */
function validateTypeDependencies(typeName, types, seen) {
    if (seen.has(typeName))
        return;
    seen.add(typeName);
    const typeFields = types[typeName];
    if (!typeFields) {
        throw new InvalidTypedDataError(`type '${typeName}' not found in types`, {
            value: types,
        });
    }
    // Atomic types that don't need validation
    const atomicTypes = [
        "address",
        "bool",
        "string",
        "bytes",
        "uint8",
        "uint16",
        "uint32",
        "uint64",
        "uint128",
        "uint256",
        "int8",
        "int16",
        "int32",
        "int64",
        "int128",
        "int256",
    ];
    // Add bytes1-32
    for (let i = 1; i <= 32; i++) {
        atomicTypes.push(`bytes${i}`);
    }
    for (const field of typeFields) {
        // Extract base type (handle arrays)
        const baseType = field.type.replace(/\[\]$/, "");
        // Skip atomic types
        if (atomicTypes.includes(baseType))
            continue;
        // Check if it's a custom type that exists
        if (!( /** @type {Record<string, unknown>} */(types)[baseType])) {
            throw new InvalidTypedDataError(`type '${baseType}' referenced in '${typeName}.${field.name}' not found`, { value: types });
        }
        // Recursively validate dependencies
        validateTypeDependencies(baseType, types, seen);
    }
}
