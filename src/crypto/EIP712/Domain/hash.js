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
 * Hash EIP-712 domain separator
 *
 * @param {import('../BrandedEIP712.js').Domain} domain - Domain separator fields
 * @returns {import('../../../primitives/Hash/index.js').BrandedHash} Domain separator hash
 *
 * @example
 * ```typescript
 * const domain = {
 *   name: 'MyApp',
 *   version: '1',
 *   chainId: 1n,
 * };
 * const hash = Domain.hash(domain);
 * ```
 */
export function hash(domain) {
	// Filter domain to only included fields
	/** @type {Record<string, any>} */
	const filteredDomain = {};
	for (const key of Object.keys(domain)) {
		const value = /** @type {Record<string, any>} */ (domain)[key];
		if (value !== undefined) {
			filteredDomain[key] = value;
		}
	}

	return hashStruct(
		"EIP712Domain",
		/** @type {import('../BrandedEIP712.js').Message} */ (filteredDomain),
		EIP712_DOMAIN_TYPES,
	);
}
