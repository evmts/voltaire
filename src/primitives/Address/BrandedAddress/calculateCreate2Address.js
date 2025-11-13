/**
 * Factory function to create calculateCreate2Address with injected keccak256 dependency
 *
 * @param {Object} deps - Dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {function(import('./BrandedAddress.js').BrandedAddress, import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash, import('../../Bytecode/BrandedBytecode/BrandedBytecode.js').BrandedBytecode): import('./BrandedAddress.js').BrandedAddress}
 */
export function CalculateCreate2Address({ keccak256 }) {
	/**
	 * Calculate CREATE2 contract address
	 *
	 * address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
	 *
	 * @param {import('./BrandedAddress.js').BrandedAddress} address - Sender address
	 * @param {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} salt - 32-byte salt (use Hash.from to create)
	 * @param {import('../../Bytecode/BrandedBytecode/BrandedBytecode.js').BrandedBytecode} initCode - Contract initialization code
	 * @returns {import('./BrandedAddress.js').BrandedAddress} Calculated contract address
	 *
	 * @example
	 * ```typescript
	 * import { hash } from '../../../crypto/Keccak256/hash.js';
	 * import * as Hash from './primitives/Hash/index.js';
	 * import * as Bytecode from './primitives/Bytecode/index.js';
	 *
	 * const calculateCreate2Address = CalculateCreate2Address({ keccak256: hash });
	 * const salt = Hash.from(245n);
	 * const initCode = Bytecode.from("0x6080...");
	 * const contractAddr = calculateCreate2Address(
	 *   deployerAddr,
	 *   salt,
	 *   initCode
	 * );
	 * ```
	 */
	return function calculateCreate2Address(address, salt, initCode) {
		// Hash init code
		const initCodeHash = keccak256(initCode);

		// Concatenate: 0xff ++ address ++ salt ++ initCodeHash
		const data = new Uint8Array(1 + 20 + 32 + 32);
		data[0] = 0xff;
		data.set(address, 1);
		data.set(salt, 21);
		data.set(initCodeHash, 53);

		// Hash and take last 20 bytes
		const hash = keccak256(data);
		return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
			hash.slice(12)
		);
	};
}
