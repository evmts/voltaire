/**
 * Format a SIWE message into a string for signing (EIP-4361)
 *
 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
 * @since 0.0.0
 * @param {import('./SiweMessageType.js').SiweMessageType} message - Message to format
 * @returns {string} Formatted string according to EIP-4361 specification
 * @throws {never}
 * @example
 * ```javascript
 * import * as Siwe from './primitives/Siwe/index.js';
 * import * as Address from './primitives/Address/index.js';
 * const message = {
 *   domain: "example.com",
 *   address: Address.fromHex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
 *   uri: "https://example.com",
 *   version: "1",
 *   chainId: 1,
 *   nonce: "32891756",
 *   issuedAt: "2021-09-30T16:25:24Z",
 * };
 *
 * const text = Siwe.format(message);
 * ```
 */
export function format(message: import("./SiweMessageType.js").SiweMessageType): string;
//# sourceMappingURL=format.d.ts.map