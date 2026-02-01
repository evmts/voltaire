import type { AddressType } from "../Address/AddressType.js";
import type { GweiType } from "../Denomination/GweiType.js";
import type { ValidatorIndexType } from "../ValidatorIndex/ValidatorIndexType.js";
import type { WithdrawalIndexType } from "../WithdrawalIndex/WithdrawalIndexType.js";
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
    readonly index: WithdrawalIndexType;
    /** Validator index on beacon chain */
    readonly validatorIndex: ValidatorIndexType;
    /** Address receiving withdrawal */
    readonly address: AddressType;
    /** Amount in Gwei */
    readonly amount: GweiType;
};
//# sourceMappingURL=WithdrawalType.d.ts.map