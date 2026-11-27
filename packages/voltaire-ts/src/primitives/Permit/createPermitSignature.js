import { EIP712 } from "../../crypto/EIP712/index.js";
import { PERMIT_TYPES } from "./constants.js";

/**
 * Creates an EIP-2612 permit signature
 *
 * @param {import('./PermitType.js').PermitType} permit - Permit message
 * @param {import('./PermitType.js').PermitDomainType} domain - EIP-712 domain
 * @param {Uint8Array} privateKey - Private key (32 bytes)
 * @returns {import('../../crypto/EIP712/EIP712Type.js').Signature} EIP-712 signature
 *
 * @example
 * ```typescript
 * import * as Permit from './primitives/Permit/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as Uint256 from './primitives/Uint256/index.js';
 *
 * const permit = {
 *   owner: Address.fromHex('0x...'),
 *   spender: Address.fromHex('0x...'),
 *   value: Uint256.fromBigInt(1000000n),
 *   nonce: Uint256.fromBigInt(0n),
 *   deadline: Uint256.fromBigInt(1234567890n),
 * };
 *
 * const domain = {
 *   name: 'USD Coin',
 *   version: '2',
 *   chainId: 1,
 *   verifyingContract: Address.fromHex('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
 * };
 *
 * const signature = Permit.createPermitSignature(permit, domain, privateKey);
 * ```
 */
export function createPermitSignature(permit, domain, privateKey) {
	const typedData =
		/** @type {import('../../crypto/EIP712/EIP712Type.js').TypedData} */ ({
			domain,
			types: PERMIT_TYPES,
			primaryType: "Permit",
			message:
				/** @type {import('../../crypto/EIP712/EIP712Type.js').Message} */ (
					/** @type {unknown} */ (permit)
				),
		});

	return EIP712.signTypedData(typedData, privateKey);
}
