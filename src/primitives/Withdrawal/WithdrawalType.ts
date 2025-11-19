import type { AddressType } from "../Address/AddressType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Withdrawal type - represents Ethereum withdrawal (post-merge)
 *
 * Post-merge (Shanghai/Capella upgrade) withdrawal from beacon chain
 * validators to execution layer accounts
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal for Withdrawal documentation
 * @see https://eips.ethereum.org/EIPS/eip-4895 for EIP-4895 specification
 * @since 0.0.0
 */
export type WithdrawalType = {
	/** Withdrawal index (monotonically increasing) */
	readonly index: Uint256Type;
	/** Validator index on beacon chain */
	readonly validatorIndex: Uint256Type;
	/** Address receiving withdrawal */
	readonly address: AddressType;
	/** Amount in Gwei */
	readonly amount: Uint256Type;
};
