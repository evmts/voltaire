/**
 * All possible EIP-712 domain fields
 */
const DOMAIN_FIELD_TYPES = {
	name: { name: "name", type: "string" },
	version: { name: "version", type: "string" },
	chainId: { name: "chainId", type: "uint256" },
	verifyingContract: { name: "verifyingContract", type: "address" },
	salt: { name: "salt", type: "bytes32" },
};

/**
 * Factory: Hash EIP-712 domain separator.
 *
 * Only includes fields that are defined in the domain object.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(primaryType: string, data: import('../EIP712Type.js').Message, types: import('../EIP712Type.js').TypeDefinitions) => import('../../../primitives/Hash/index.js').HashType} deps.hashStruct - Hash struct function
 * @returns {(domain: import('../EIP712Type.js').Domain) => import('../../../primitives/Hash/index.js').HashType} Function that hashes domain
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
