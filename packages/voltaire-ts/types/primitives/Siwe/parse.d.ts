/**
 * Parse a SIWE message from a formatted string
 *
 * @see https://voltaire.tevm.sh/primitives/siwe for SIWE documentation
 * @since 0.0.0
 * @param {string} text - Formatted SIWE message string
 * @returns {import('./SiweMessageType.js').SiweMessageType} Parsed Message object
 * @throws {InvalidSiweMessageError} if message format is invalid
 * @throws {MissingFieldError} if required field is missing
 * @throws {InvalidFieldError} if field value is invalid
 * @throws {SiweParseError} if parsing fails
 * @example
 * ```javascript
 * import * as Siwe from './primitives/Siwe/index.js';
 * const text = `example.com wants you to sign in with your Ethereum account:
 * 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
 *
 * Sign in to Example
 *
 * URI: https://example.com
 * Version: 1
 * Chain ID: 1
 * Nonce: 32891756
 * Issued At: 2021-09-30T16:25:24Z`;
 *
 * const message = Siwe.parse(text);
 * ```
 */
export function parse(text: string): import("./SiweMessageType.js").SiweMessageType;
//# sourceMappingURL=parse.d.ts.map