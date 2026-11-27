import { EIP712 } from "../../crypto/EIP712/index.js";
import { Address } from "../Address/index.js";
import { PERMIT_TYPES } from "./constants.js";

/**
 * Verifies an EIP-2612 permit signature
 *
 * @param {import('./PermitType.js').PermitType} permit - Permit message
 * @param {import('../../crypto/EIP712/EIP712Type.js').Signature} signature - EIP-712 signature
 * @param {import('./PermitType.js').PermitDomainType} domain - EIP-712 domain
 * @returns {boolean} True if signature is valid
 *
 * @example
 * ```typescript
 * import * as Permit from './primitives/Permit/index.js';
 *
 * const isValid = Permit.verifyPermit(permit, signature, domain);
 * ```
 */
export function verifyPermit(permit, signature, domain) {
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

	const recovered = EIP712.recoverAddress(signature, typedData);
	return Address.equals(recovered, permit.owner);
}
