import * as Hash from "../../Hash/index.js";
import { SIZE } from "./constants.js";

/**
 * Calculate CREATE2 contract address
 *
 * address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
 *
 * @param {import('./BrandedAddress.js').BrandedAddress} address - Sender address
 * @param {Uint8Array} salt - 32-byte salt
 * @param {Uint8Array} initCode - Contract initialization code
 * @returns {import('./BrandedAddress.js').BrandedAddress} Calculated contract address
 * @throws {Error} If salt is not 32 bytes
 *
 * @example
 * ```typescript
 * const contractAddr = Address.calculateCreate2Address(
 *   deployerAddr,
 *   saltBytes,
 *   initCode
 * );
 * ```
 */
export function calculateCreate2Address(address, salt, initCode) {
	if (salt.length !== 32) {
		throw new Error("Salt must be 32 bytes");
	}

	const initCodeHash = Hash.keccak256(initCode);
	const data = new Uint8Array(1 + SIZE + 32 + 32);
	data[0] = 0xff;
	data.set(address, 1);
	data.set(salt, 1 + SIZE);
	data.set(initCodeHash, 1 + SIZE + 32);

	const hash = Hash.keccak256(data);
	return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
		hash.slice(12, 32)
	);
}
