/**
 * Convert Domain to ERC-5267 eip712Domain() response format
 *
 * Calculates field bitmap based on which domain fields are present,
 * then returns standardized tuple format. Missing fields are filled
 * with appropriate default values per ERC-5267 spec.
 *
 * @param {import('./DomainType.js').DomainType} domain - EIP-712 domain
 * @returns {import('./ERC5267Type.js').ERC5267Response} - ERC-5267 formatted response
 *
 * @see https://eips.ethereum.org/EIPS/eip-5267
 *
 * @example
 * ```javascript
 * import * as Domain from './primitives/Domain/index.js';
 *
 * const domain = Domain.from({
 *   name: "MyContract",
 *   version: "1.0.0",
 *   chainId: 1,
 *   verifyingContract: "0x1234567890123456789012345678901234567890"
 * });
 *
 * const response = Domain.toErc5267Response(domain);
 * // response.fields[0] === 0x0f (name + version + chainId + verifyingContract)
 * // response.name === "MyContract"
 * // response.version === "1.0.0"
 * // response.chainId === 1n
 * // response.verifyingContract === domain.verifyingContract
 * // response.salt === new Uint8Array(32) (all zeros)
 * // response.extensions === []
 * ```
 */
export function toErc5267Response(domain: import("./DomainType.js").DomainType): import("./ERC5267Type.js").ERC5267Response;
//# sourceMappingURL=toErc5267Response.d.ts.map