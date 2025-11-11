import { hashStruct } from "../hashStruct.js";

/**
 * EIP-712 domain type definition
 */
const EIP712_DOMAIN_TYPES = {
	EIP712Domain: [
		{ name: "name", type: "string" },
		{ name: "version", type: "string" },
		{ name: "chainId", type: "uint256" },
		{ name: "verifyingContract", type: "address" },
		{ name: "salt", type: "bytes32" },
	],
};

/**
 * Hash EIP-712 domain separator.
 *
 * Only includes fields that are defined in the domain object.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../BrandedEIP712.js').Domain} domain - Domain separator fields (name, version, chainId, verifyingContract, salt)
 * @returns {import('../../../primitives/Hash/index.js').BrandedHash} 32-byte domain separator hash
 * @throws {Eip712TypeNotFoundError} If domain type encoding fails
 * @example
 * ```javascript
 * import { hash as hashDomain } from './crypto/EIP712/Domain/hash.js';
 * const domain = { name: 'MyApp', version: '1', chainId: 1n };
 * const domainHash = hashDomain(domain);
 * ```
 */
export function hash(domain) {
	// Filter domain to only included fields
	/** @type {Record<string, any>} */
	const filteredDomain = {};
	const domainKeys = [];
	for (const key of Object.keys(domain)) {
		const value = /** @type {Record<string, any>} */ (domain)[key];
		if (value !== undefined) {
			filteredDomain[key] = value;
			domainKeys.push(key);
		}
	}

	// Filter type definition to only included fields
	const filteredTypes = {
		EIP712Domain: EIP712_DOMAIN_TYPES.EIP712Domain.filter((field) =>
			domainKeys.includes(field.name),
		),
	};

	return hashStruct(
		"EIP712Domain",
		/** @type {import('../BrandedEIP712.js').Message} */ (filteredDomain),
		filteredTypes,
	);
}
