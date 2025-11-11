/**
 * Format authorization to human-readable string
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization | {chainId: bigint, address: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress, nonce: bigint}} auth - Authorization to format
 * @returns {string} Human-readable string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const auth = { chainId: 1n, address: '0x742d35Cc...', nonce: 0n, yParity: 0, r: 0n, s: 0n };
 * console.log(Authorization.format(auth));
 * // "Authorization(chain=1, to=0x742d...51e3, nonce=0, r=0x0, s=0x0, v=0)"
 * ```
 */
export function format(auth) {
	if ("r" in auth && "s" in auth) {
		return `Authorization(chain=${auth.chainId}, to=${formatAddress(
			auth.address,
		)}, nonce=${auth.nonce}, r=0x${auth.r.toString(16)}, s=0x${auth.s.toString(
			16,
		)}, v=${auth.yParity})`;
	}
	return `Authorization(chain=${auth.chainId}, to=${formatAddress(
		auth.address,
	)}, nonce=${auth.nonce})`;
}

/**
 * Helper to format address (shortened)
 * @param {import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress} addr - Address to format
 * @returns {string} Formatted address
 */
function formatAddress(addr) {
	const hex = Array.from(addr)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`;
}
