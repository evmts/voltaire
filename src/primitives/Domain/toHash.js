import * as DomainSeparator from "../DomainSeparator/index.js";
import { encodeData } from "./encodeData.js";
import { getEIP712DomainType } from "./getEIP712DomainType.js";

/**
 * Compute EIP-712 domain separator hash
 *
 * @param {import('./DomainType.js').DomainType} domain - Domain
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {import('../DomainSeparator/DomainSeparatorType.js').DomainSeparatorType} Domain separator hash
 * @example
 * ```javascript
 * import { keccak256 } from './crypto/keccak256/index.js';
 * const domainSep = Domain.toHash(domain, { keccak256 });
 * ```
 */
export function toHash(domain, crypto) {
	// Build types object for EIP712Domain
	const types = {
		EIP712Domain: getEIP712DomainType(domain),
	};

	// Encode and hash the domain
	const encoded = encodeData("EIP712Domain", domain, types, crypto);
	const hash = crypto.keccak256(encoded);

	return DomainSeparator.fromBytes(hash);
}
