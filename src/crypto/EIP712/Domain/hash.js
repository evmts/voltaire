import { Eip712InvalidDomainError } from "../errors.js";

/**
 * All possible EIP-712 domain fields
 * @type {Record<string, {name: string, type: string}>}
 */
const DOMAIN_FIELD_TYPES = {
	name: { name: "name", type: "string" },
	version: { name: "version", type: "string" },
	chainId: { name: "chainId", type: "uint256" },
	verifyingContract: { name: "verifyingContract", type: "address" },
	salt: { name: "salt", type: "bytes32" },
};

const DOMAIN_DOCS_PATH = "/crypto/eip712/domain#error-handling";

/**
 * @param {string} message
 * @param {Record<string, unknown>} context
 */
const throwInvalidDomain = (message, context) => {
	throw new Eip712InvalidDomainError(message, {
		code: "EIP712_INVALID_DOMAIN",
		context,
		docsPath: DOMAIN_DOCS_PATH,
	});
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const isByteLike = (value) =>
	value instanceof Uint8Array ||
	typeof value === "string" ||
	(typeof value === "object" && value !== null && "length" in value);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const isChainIdType = (value) =>
	typeof value === "bigint" ||
	typeof value === "number" ||
	value instanceof Uint8Array;

/**
 * @param {unknown} value
 */
const validateName = (value) => {
	if (typeof value !== "string") {
		throwInvalidDomain(
			`Invalid domain field: 'name' must be a string, got ${typeof value}`,
			{
				field: "name",
				value,
				expectedType: "string",
			},
		);
	}
};

/**
 * @param {unknown} value
 */
const validateVersion = (value) => {
	if (typeof value !== "string") {
		throwInvalidDomain(
			`Invalid domain field: 'version' must be a string, got ${typeof value}`,
			{
				field: "version",
				value,
				expectedType: "string",
			},
		);
	}
};

/**
 * @param {unknown} value
 */
const validateChainId = (value) => {
	if (!isChainIdType(value)) {
		throwInvalidDomain(
			`Invalid domain field: 'chainId' must be a bigint, number, or Uint8Array, got ${typeof value}`,
			{
				field: "chainId",
				value,
				expectedType: "bigint | number | Uint8Array",
			},
		);
	}
};

/**
 * @param {unknown} value
 */
const validateVerifyingContract = (value) => {
	if (!isByteLike(value)) {
		throwInvalidDomain(
			`Invalid domain field: 'verifyingContract' must be an address (Uint8Array or hex string), got ${typeof value}`,
			{
				field: "verifyingContract",
				value,
				expectedType: "address",
			},
		);
	}
	if (value instanceof Uint8Array && value.length !== 20) {
		throwInvalidDomain(
			`Invalid domain field: 'verifyingContract' must be 20 bytes, got ${value.length} bytes`,
			{
				field: "verifyingContract",
				value,
				expectedLength: 20,
				actualLength: value.length,
			},
		);
	}
};

/**
 * @param {unknown} value
 */
const validateSalt = (value) => {
	if (!isByteLike(value)) {
		throwInvalidDomain(
			`Invalid domain field: 'salt' must be bytes32 (Uint8Array or hex string), got ${typeof value}`,
			{
				field: "salt",
				value,
				expectedType: "bytes32",
			},
		);
	}
	if (value instanceof Uint8Array && value.length !== 32) {
		throwInvalidDomain(
			`Invalid domain field: 'salt' must be 32 bytes, got ${value.length} bytes`,
			{
				field: "salt",
				value,
				expectedLength: 32,
				actualLength: value.length,
			},
		);
	}
};

/** @type {Record<string, (value: unknown) => void>} */
const DOMAIN_FIELD_VALIDATORS = {
	name: validateName,
	version: validateVersion,
	chainId: validateChainId,
	verifyingContract: validateVerifyingContract,
	salt: validateSalt,
};

/**
 * Validate EIP712Domain field values.
 *
 * @param {string} field - Field name
 * @param {unknown} value - Field value
 * @throws {Eip712InvalidDomainError} If field value is invalid
 */
function validateDomainField(field, value) {
	const validator = DOMAIN_FIELD_VALIDATORS[field];
	if (!validator) {
		throwInvalidDomain(`Unknown domain field: '${field}'`, {
			field,
			value,
			validFields: Object.keys(DOMAIN_FIELD_TYPES),
		});
		return;
	}
	validator(value);
}

/**
 * Factory: Hash EIP-712 domain separator.
 *
 * Only includes fields that are defined in the domain object.
 * Validates that all fields have correct types per EIP-712 spec.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(primaryType: string, data: import('../EIP712Type.js').Message, types: import('../EIP712Type.js').TypeDefinitions) => import('../../../primitives/Hash/index.js').HashType} deps.hashStruct - Hash struct function
 * @returns {(domain: import('../EIP712Type.js').Domain) => import('../../../primitives/Hash/index.js').HashType} Function that hashes domain
 * @throws {Eip712InvalidDomainError} If domain field has invalid type
 * @throws {Eip712TypeNotFoundError} If domain type encoding fails
 * @example
 * ```javascript
 * import { Hash as HashDomain } from './crypto/EIP712/Domain/hash.js';
 * import { HashStruct } from '../hashStruct.js';
 * import { hash as keccak256 } from '../../Keccak256/hash.js';
 * const hashStruct = HashStruct({ keccak256, encodeData });
 * const hashDomain = HashDomain({ hashStruct });
 * const domain = { name: 'MyApp', version: '1', chainId: 1n };
 * const domainHash = hashDomain(domain);
 * ```
 */
export function Hash({ hashStruct }) {
	return function hash(domain) {
		// Filter domain to only included fields
		/** @type {Record<string, any>} */
		const filteredDomain = {};
		/** @type {Array<{name: string, type: string}>} */
		const domainFields = [];

		// Build type definition with only present fields
		for (const key of Object.keys(domain)) {
			const value = /** @type {Record<string, any>} */ (domain)[key];
			if (value !== undefined) {
				// Validate field type
				validateDomainField(key, value);

				filteredDomain[key] = value;
				const fieldDef = DOMAIN_FIELD_TYPES[key];
				if (fieldDef) {
					domainFields.push(fieldDef);
				}
			}
		}

		/** @type {import('../EIP712Type.js').TypeDefinitions} */
		const domainTypes = {
			EIP712Domain: domainFields,
		};

		return hashStruct(
			"EIP712Domain",
			/** @type {import('../EIP712Type.js').Message} */ (filteredDomain),
			domainTypes,
		);
	};
}
