/**
 * Compute contract address from deployer and nonce
 *
 * Uses CREATE formula: keccak256(rlp([sender, nonce]))[12:]
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} sender - Deployer address (20 bytes)
 * @param {bigint} nonce - Transaction nonce
 * @returns {Uint8Array} Contract address (20 bytes)
 * @throws {InvalidLengthError} If sender is not 20 bytes
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const sender = new Uint8Array(20);
 * const address = Keccak256.contractAddress(sender, 0n);
 * ```
 */
export function contractAddress(sender: Uint8Array, nonce: bigint): Uint8Array;
//# sourceMappingURL=contractAddress.d.ts.map