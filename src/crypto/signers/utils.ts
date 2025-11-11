/**
 * WASM implementation of signer utility functions
 */

import type { Signer } from "./private-key-signer.js";

/**
 * Gets the address from a signer instance.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Signer} signer - The signer instance
 * @returns {string} The checksummed Ethereum address
 * @throws {never}
 * @example
 * ```javascript
 * import { PrivateKeySignerImpl } from './crypto/signers/private-key-signer.js';
 * import { getAddress } from './crypto/signers/utils.js';
 * const signer = PrivateKeySignerImpl.fromPrivateKey({ privateKey: '0x...' });
 * const address = getAddress(signer);
 * console.log(address); // '0x...'
 * ```
 */
export function getAddress(signer: Signer): string {
	return signer.address;
}

/**
 * Recovers the address that signed a transaction.
 *
 * Note: This function is not yet implemented and requires additional WASM bindings for:
 * 1. Deserialize transaction from RLP
 * 2. Extract signature (r, s, v)
 * 3. Reconstruct transaction hash
 * 4. Recover address from signature and hash using secp256k1RecoverAddress
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {any} _transaction - The transaction to recover the address from
 * @returns {Promise<string>} The recovered Ethereum address
 * @throws {Error} Always throws as this function is not yet implemented
 * @example
 * ```javascript
 * import { recoverTransactionAddress } from './crypto/signers/utils.js';
 * try {
 *   const address = await recoverTransactionAddress(transaction);
 * } catch (err) {
 *   console.error('Not yet implemented:', err.message);
 * }
 * ```
 */
export async function recoverTransactionAddress(
	_transaction: any,
): Promise<string> {
	// Note: Transaction address recovery requires:
	// 1. Deserialize transaction from RLP
	// 2. Extract signature (r, s, v)
	// 3. Reconstruct transaction hash
	// 4. Recover address from signature and hash using secp256k1RecoverAddress
	//
	// This requires additional WASM bindings
	throw new Error(
		"recoverTransactionAddress not yet implemented. Requires RLP deserialization and signature recovery bindings",
	);
}
