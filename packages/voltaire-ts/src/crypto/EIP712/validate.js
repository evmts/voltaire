import {
	Eip712Error,
	Eip712InvalidDomainError,
	Eip712InvalidMessageError,
	Eip712TypeNotFoundError,
} from "./errors.js";

const ARRAY_REGEX = /^(.*)\[([0-9]*)\]$/;
const ARRAY_SUFFIX_REGEX = /(\[[0-9]*\])+$/;
const STRUCT_NAME_REGEX = /^[A-Za-z0-9_$:]+$/;
const SOLIDITY_TYPE_NAME_REGEX = /^(u?int|bytes)[0-9]*$/;
const BYTES_REGEX = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
const INTEGER_REGEX =
	/^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
const ADDRESS_HEX_REGEX = /^0x[0-9a-fA-F]{40}$/;
const HEX_REGEX = /^0x[0-9a-fA-F]*$/;

/**
 * Check if base type is a valid Solidity atomic/dynamic EIP-712 type
 * @internal
 * @param {string} type
 * @returns {boolean}
 */
function isSolidityType(type) {
	return (
		type === "address" ||
		type === "bool" ||
		type === "string" ||
		BYTES_REGEX.test(type) ||
		INTEGER_REGEX.test(type)
	);
}

/**
 * Validate struct name against EIP-712 identifier rules
 * @internal
 * @param {string} type
 */
function validateStructName(type) {
	if (
		!STRUCT_NAME_REGEX.test(type) ||
		type === "address" ||
		type === "bool" ||
		type === "string" ||
		SOLIDITY_TYPE_NAME_REGEX.test(type)
	) {
		throw new Eip712Error(`Invalid struct type "${type}"`, {
			context: { type },
		});
	}
}

/**
 * Validate a struct field's type reference
 * @internal
 * @param {string} type
 * @param {import('./EIP712Type.js').TypeDefinitions} types
 */
function validateFieldType(type, types) {
	const baseType = type.replace(ARRAY_SUFFIX_REGEX, "");
	if (baseType === "int" || baseType === "uint") {
		throw new Eip712TypeNotFoundError(
			`Type "${type}" is not a valid EIP-712 type (use "${type.replace(/^(u?int)/, "$&256")}")`,
			{ context: { type } },
		);
	}
	if (!Object.hasOwn(types, baseType) && !isSolidityType(baseType)) {
		throw new Eip712TypeNotFoundError(
			`Type "${type}" is not a valid EIP-712 type`,
			{ context: { type } },
		);
	}
}

/**
 * Validate integer range for intN / uintN
 * @internal
 * @param {string} base
 * @param {string} sizeStr
 * @param {number | bigint} value
 * @param {string} name
 */
function validateIntegerRange(base, sizeStr, value, name) {
	const bits = sizeStr ? Number.parseInt(sizeStr, 10) : 256;
	if (typeof value === "number" && !Number.isInteger(value)) {
		throw new Eip712InvalidMessageError(
			`Non-integer value for "${name}" (${base}${bits})`,
			{ context: { name, type: `${base}${bits}`, value } },
		);
	}
	const big = typeof value === "bigint" ? value : BigInt(value);
	const signed = base === "int";
	const max = signed
		? (1n << BigInt(bits - 1)) - 1n
		: (1n << BigInt(bits)) - 1n;
	const min = signed ? -(max + 1n) : 0n;
	if (big < min || big > max) {
		throw new Eip712InvalidMessageError(
			`Value out of range for ${base}${bits} in field "${name}"`,
			{ context: { name, type: `${base}${bits}` } },
		);
	}
}

/**
 * Validate fixed-size bytesN value (Uint8Array or 0x-prefixed hex string)
 * @internal
 * @param {number} expectedSize
 * @param {unknown} value
 * @param {string} name
 */
function validateFixedBytes(expectedSize, value, name) {
	if (value instanceof Uint8Array) {
		if (value.length !== expectedSize) {
			throw new Eip712InvalidMessageError(
				`Expected bytes${expectedSize} for "${name}", got ${value.length} bytes`,
				{ context: { name, expectedSize, givenSize: value.length } },
			);
		}
		return;
	}
	if (typeof value === "string") {
		if (!HEX_REGEX.test(value) || value.length % 2 !== 0) {
			throw new Eip712InvalidMessageError(
				`Invalid hex bytes${expectedSize} for "${name}"`,
				{ context: { name, expectedSize } },
			);
		}
		const givenSize = (value.length - 2) / 2;
		if (givenSize !== expectedSize) {
			throw new Eip712InvalidMessageError(
				`Expected bytes${expectedSize} for "${name}", got bytes${givenSize}`,
				{ context: { name, expectedSize, givenSize } },
			);
		}
	}
}

/**
 * Validate an array value against its declared EIP-712 array type
 * @internal
 * @param {string} type
 * @param {string} elementType
 * @param {string | undefined} lengthStr
 * @param {unknown} value
 * @param {string} name
 * @param {import('./EIP712Type.js').TypeDefinitions} types
 */
function validateArrayValue(type, elementType, lengthStr, value, name, types) {
	if (!Array.isArray(value)) {
		throw new Eip712InvalidMessageError(
			`Value for field "${name}" of type "${type}" must be an array`,
			{ context: { name, type } },
		);
	}
	if (lengthStr) {
		const expected = Number.parseInt(lengthStr, 10);
		if (value.length !== expected) {
			throw new Eip712InvalidMessageError(
				`Expected fixed-length array "${type}" for "${name}" to have ${expected} elements, got ${value.length}`,
				{ context: { name, type, expected, given: value.length } },
			);
		}
	}
	for (const item of value) {
		validateValue(elementType, item, name, types);
	}
}

/**
 * Validate a field value against its declared EIP-712 type
 * @internal
 * @param {string} type
 * @param {unknown} value
 * @param {string} name
 * @param {import('./EIP712Type.js').TypeDefinitions} types
 */
function validateValue(type, value, name, types) {
	const arrayMatch = type.match(ARRAY_REGEX);
	if (arrayMatch) {
		validateArrayValue(
			type,
			/** @type {string} */ (arrayMatch[1]),
			arrayMatch[2],
			value,
			name,
			types,
		);
		return;
	}

	const intMatch = type.match(INTEGER_REGEX);
	if (intMatch && (typeof value === "number" || typeof value === "bigint")) {
		validateIntegerRange(
			/** @type {string} */ (intMatch[1]),
			intMatch[2] ?? "",
			value,
			name,
		);
		return;
	}

	if (type === "address") {
		if (typeof value === "string" && !ADDRESS_HEX_REGEX.test(value)) {
			throw new Eip712InvalidMessageError(
				`Invalid address for field "${name}"`,
				{ context: { name, value } },
			);
		}
		if (value instanceof Uint8Array && value.length !== 20) {
			throw new Eip712InvalidMessageError(
				`Invalid address byte length for field "${name}"`,
				{ context: { name, length: value.length } },
			);
		}
		return;
	}

	const bytesMatch = type.match(BYTES_REGEX);
	if (bytesMatch?.[1]) {
		validateFixedBytes(Number.parseInt(bytesMatch[1], 10), value, name);
		return;
	}

	const structFields = Object.hasOwn(types, type) ? types[type] : undefined;
	if (structFields) {
		validateStructData(structFields, value, types);
	}
}

/**
 * Validate struct fields against a data object
 * @internal
 * @param {readonly import('./EIP712Type.js').TypeProperty[]} fields
 * @param {unknown} data
 * @param {import('./EIP712Type.js').TypeDefinitions} types
 */
function validateStructData(fields, data, types) {
	if (!data || typeof data !== "object") {
		throw new Eip712InvalidMessageError("Struct data must be an object", {
			context: { type: typeof data },
		});
	}
	const record = /** @type {Record<string, unknown>} */ (data);
	for (const field of fields) {
		validateValue(field.type, record[field.name], field.name, types);
	}
}

/**
 * Validate typed data structure against EIP-712 specification.
 *
 * Checks domain, types, primaryType, and message structure.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./EIP712Type.js').TypedData} typedData - Typed data to validate
 * @returns {void}
 * @throws {Error} If structure is invalid or missing required fields
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * EIP712.validate(typedData); // Throws if invalid
 * ```
 */
export function validate(typedData) {
	if (!typedData || typeof typedData !== "object") {
		throw new Eip712Error("Typed data must be an object");
	}
	const { domain, message, primaryType, types } = typedData;
	if (!types || typeof types !== "object") {
		throw new Eip712Error("Typed data must define types");
	}

	for (const typeName of Object.keys(types)) {
		validateStructName(typeName);
		const fields = types[typeName];
		if (!Array.isArray(fields)) {
			throw new Eip712Error(`Type "${typeName}" definition must be an array`, {
				context: { typeName },
			});
		}
		for (const field of fields) {
			validateFieldType(field.type, types);
		}
	}

	if (types.EIP712Domain && domain !== undefined) {
		if (!domain || typeof domain !== "object") {
			throw new Eip712InvalidDomainError("Invalid EIP-712 domain", {
				context: { domain },
			});
		}
		validateStructData(types.EIP712Domain, domain, types);
	}

	if (primaryType !== "EIP712Domain") {
		const primaryFields = Object.hasOwn(types, primaryType)
			? types[primaryType]
			: undefined;
		if (!primaryFields) {
			throw new Eip712TypeNotFoundError(
				`Invalid primary type "${primaryType}"`,
				{ context: { primaryType, availableTypes: Object.keys(types) } },
			);
		}
		validateStructData(primaryFields, message, types);
	}
}
