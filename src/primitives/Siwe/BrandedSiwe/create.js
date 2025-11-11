import * as OxSiwe from "ox/Siwe";
import * as Address from "../../Address/BrandedAddress/index.js";

/**
 * Create a new SIWE message with default values
 *
 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
 * @since 0.0.0
 * @template {string} TDomain
 * @template {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} TAddress
 * @template {string} TUri
 * @template {number} TChainId
 * @param {Object} params - Message parameters (domain, address, uri, chainId are required)
 * @param {TDomain} params.domain - RFC 4501 dns authority requesting the signing
 * @param {TAddress} params.address - Ethereum address performing the signing
 * @param {TUri} params.uri - RFC 3986 URI referring to the subject of signing
 * @param {TChainId} params.chainId - EIP-155 Chain ID
 * @param {string} [params.statement] - Human-readable ASCII assertion
 * @param {string} [params.expirationTime] - ISO 8601 datetime string for expiration
 * @param {string} [params.notBefore] - ISO 8601 datetime string for not before
 * @param {string} [params.requestId] - System-specific identifier
 * @param {string[]} [params.resources] - List of resources
 * @param {string} [params.nonce] - Custom nonce (auto-generated if not provided)
 * @param {string} [params.issuedAt] - Custom issued at (current time if not provided)
 * @returns {import('./BrandedMessage.js').BrandedMessage<TDomain, TAddress, TUri, "1", TChainId>} New SIWE message with defaults
 * @throws {never}
 * @example
 * ```javascript
 * import * as Siwe from './primitives/Siwe/index.js';
 * import * as Address from './primitives/Address/index.js';
 * const message = Siwe.create({
 *   domain: "example.com",
 *   address: Address.fromHex("0x..."),
 *   uri: "https://example.com",
 *   chainId: 1,
 * });
 * // Automatically generates nonce, issuedAt, and sets version to "1"
 * ```
 */
export function create(params) {
	// Convert address to hex for ox
	const addressHex = Address.toHex(params.address);

	// Build ox message (with Date objects for timestamps)
	/** @type {import('ox/Siwe').Message} */
	const oxMessage = {
		domain: params.domain,
		address: addressHex,
		uri: params.uri,
		version: "1",
		chainId: params.chainId,
		nonce: params.nonce || OxSiwe.generateNonce(),
		...(params.issuedAt
			? { issuedAt: new Date(params.issuedAt) }
			: { issuedAt: new Date() }),
		...(params.statement ? { statement: params.statement } : {}),
		...(params.expirationTime
			? { expirationTime: new Date(params.expirationTime) }
			: {}),
		...(params.notBefore ? { notBefore: new Date(params.notBefore) } : {}),
		...(params.requestId ? { requestId: params.requestId } : {}),
		...(params.resources ? { resources: params.resources } : {}),
	};

	// Convert back to Voltaire format (ISO strings)
	return {
		domain: params.domain,
		address: params.address,
		uri: params.uri,
		version: "1",
		chainId: params.chainId,
		nonce: oxMessage.nonce,
		issuedAt: oxMessage.issuedAt?.toISOString() || new Date().toISOString(),
		...(params.statement ? { statement: params.statement } : {}),
		...(params.expirationTime ? { expirationTime: params.expirationTime } : {}),
		...(params.notBefore ? { notBefore: params.notBefore } : {}),
		...(params.requestId ? { requestId: params.requestId } : {}),
		...(params.resources ? { resources: params.resources } : {}),
	};
}
