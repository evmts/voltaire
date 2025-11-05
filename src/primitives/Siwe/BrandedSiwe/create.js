import { generateNonce } from "./generateNonce.js";

/**
 * Create a new SIWE message with default values
 *
 * @template {string} TDomain
 * @template {import('../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} TAddress
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
 *
 * @example
 * ```typescript
 * const message = create({
 *   domain: "example.com",
 *   address: Address.fromHex("0x..."),
 *   uri: "https://example.com",
 *   chainId: 1,
 * });
 * // Automatically generates nonce, issuedAt, and sets version to "1"
 * ```
 */
export function create(params) {
	return {
		domain: params.domain,
		address: params.address,
		uri: params.uri,
		version: "1",
		chainId: params.chainId,
		nonce: params.nonce || generateNonce(),
		issuedAt: params.issuedAt || new Date().toISOString(),
		...(params.statement ? { statement: params.statement } : {}),
		...(params.expirationTime ? { expirationTime: params.expirationTime } : {}),
		...(params.notBefore ? { notBefore: params.notBefore } : {}),
		...(params.requestId ? { requestId: params.requestId } : {}),
		...(params.resources ? { resources: params.resources } : {}),
	};
}
