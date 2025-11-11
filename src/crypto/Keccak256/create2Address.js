import { hash } from "./hash.js";

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
 * @throws {Error} If sender is not 20 bytes
 * @throws {Error} If salt is not 32 bytes
 * @throws {Error} If initCodeHash is not 32 bytes
 * @example
 * ```javascript
 * import * as Keccak256 from './crypto/Keccak256/index.js';
 * const sender = new Uint8Array(20);
 * const salt = new Uint8Array(32);
 * const initCodeHash = new Uint8Array(32);
 * const address = Keccak256.create2Address(sender, salt, initCodeHash);
 * ```
 */
export function create2Address(sender, salt, initCodeHash) {
	if (sender.length !== 20) {
		throw new Error("Sender must be 20 bytes");
	}
	if (salt.length !== 32) {
		throw new Error("Salt must be 32 bytes");
	}
	if (initCodeHash.length !== 32) {
		throw new Error("Init code hash must be 32 bytes");
	}
	const data = new Uint8Array(1 + 20 + 32 + 32);
	data[0] = 0xff;
	data.set(sender, 1);
	data.set(salt, 21);
	data.set(initCodeHash, 53);
	const digest = hash(data);
	return digest.slice(12);
}
