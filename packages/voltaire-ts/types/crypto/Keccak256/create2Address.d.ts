/**
 * Compute CREATE2 address
 *
 * Uses CREATE2 formula: keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} sender - Deployer address (20 bytes)
 * @param {Uint8Array} salt - 32-byte salt
 * @param {Uint8Array} initCodeHash - Hash of initialization code
 * @returns {Uint8Array} Contract address (20 bytes)
 * @throws {InvalidLengthError} If sender is not 20 bytes
 * @throws {InvalidLengthError} If salt is not 32 bytes
 * @throws {InvalidLengthError} If initCodeHash is not 32 bytes
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const sender = new Uint8Array(20);
 * const salt = new Uint8Array(32);
 * const initCodeHash = new Uint8Array(32);
 * const address = Keccak256.create2Address(sender, salt, initCodeHash);
 * ```
 */
export function create2Address(sender: Uint8Array, salt: Uint8Array, initCodeHash: Uint8Array): Uint8Array;
//# sourceMappingURL=create2Address.d.ts.map