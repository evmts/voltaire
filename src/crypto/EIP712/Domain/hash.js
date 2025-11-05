import { hashStruct } from "../hashStruct.js";

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
	// Build EIP712Domain type based on fields present
	const domainFields = [];
	const domainValues = {};

	if (domain.name !== undefined) {
		domainFields.push({ name: "name", type: "string" });
		domainValues["name"] = domain.name;
	}
	if (domain.version !== undefined) {
		domainFields.push({ name: "version", type: "string" });
		domainValues["version"] = domain.version;
	}
	if (domain.chainId !== undefined) {
		domainFields.push({ name: "chainId", type: "uint256" });
		domainValues["chainId"] = domain.chainId;
	}
	if (domain.verifyingContract !== undefined) {
		domainFields.push({ name: "verifyingContract", type: "address" });
		domainValues["verifyingContract"] = domain.verifyingContract;
	}
	if (domain.salt !== undefined) {
		domainFields.push({ name: "salt", type: "bytes32" });
		domainValues["salt"] = domain.salt;
	}

	const types = {
		EIP712Domain: domainFields,
	};

	return hashStruct(
		"EIP712Domain",
		/** @type {import('../BrandedEIP712.js').Message} */ (domainValues),
		types,
	);
}
