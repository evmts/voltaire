import * as BrandedAddress from "../Address/internal-index.js";
import * as ChainId from "../ChainId/index.js";
import * as Hash from "../Hash/index.js";
import { InvalidDomainError } from "./errors.js";

/**
 * Create Domain from object
 *
 * @param {object} domain - Domain object
 * @param {string} [domain.name] - dApp name
 * @param {string} [domain.version] - Domain version
 * @param {import('../ChainId/ChainIdType.js').ChainIdType | number} [domain.chainId] - EIP-155 chain ID
 * @param {import('../Address/AddressType.js').AddressType | string} [domain.verifyingContract] - Contract address
 * @param {import('../Hash/HashType.js').HashType | string} [domain.salt] - Salt for disambiguation
 * @returns {import('./DomainType.js').DomainType} Domain
 * @throws {InvalidDomainError} If domain has no fields
 * @example
 * ```javascript
 * import * as Domain from './primitives/Domain/index.js';
 * const domain = Domain.from({
 *   name: 'MyDApp',
 *   version: '1',
 *   chainId: 1,
 *   verifyingContract: '0x123...'
 * });
 * ```
 */
export function from(domain) {
	// Validate at least one field is present
	if (
		!domain.name &&
		!domain.version &&
		!domain.chainId &&
		!domain.verifyingContract &&
		!domain.salt
	) {
		throw new InvalidDomainError(
			"Domain must have at least one field defined",
			{ value: domain },
		);
	}

	/** @type {Partial<import('./DomainType.js').DomainType>} */
	let result = {};

	if (domain.name !== undefined) {
		result = { ...result, name: domain.name };
	}

	if (domain.version !== undefined) {
		result = { ...result, version: domain.version };
	}

	if (domain.chainId !== undefined) {
		result = { ...result, chainId:
			typeof domain.chainId === "number"
				? ChainId.from(domain.chainId)
				: domain.chainId };
	}

	if (domain.verifyingContract !== undefined) {
		result = { ...result, verifyingContract:
			typeof domain.verifyingContract === "string"
				? BrandedAddress.from(domain.verifyingContract)
				: domain.verifyingContract };
	}

	if (domain.salt !== undefined) {
		result = { ...result, salt:
			typeof domain.salt === "string" ? Hash.from(domain.salt) : domain.salt };
	}

	return /** @type {import('./DomainType.js').DomainType} */ (result);
}
