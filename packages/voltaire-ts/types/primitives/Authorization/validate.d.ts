/**
 * Validate authorization structure
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {import("./AuthorizationType.js").AuthorizationType} auth - Authorization to validate
 * @throws {InvalidAddressError} if address is zero address
 * @throws {InvalidYParityError} if yParity is not 0 or 1
 * @throws {InvalidSignatureComponentError} if r or s is zero
 * @throws {InvalidSignatureRangeError} if r >= curve order
 * @throws {MalleableSignatureError} if s > N/2 (malleable signature)
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const auth = { chainId: 1n, address: '0x742d35Cc...', nonce: 0n, yParity: 0, r: 0n, s: 0n };
 * try {
 *   Authorization.validate(auth);
 * } catch (e) {
 *   console.error('Invalid authorization:', e.message);
 * }
 * ```
 */
export function validate(auth: import("./AuthorizationType.js").AuthorizationType): void;
//# sourceMappingURL=validate.d.ts.map