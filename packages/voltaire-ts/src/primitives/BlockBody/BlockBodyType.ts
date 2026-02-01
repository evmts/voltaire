import type { Any as Transaction } from "../Transaction/types.js";
import type { UncleType } from "../Uncle/UncleType.js";
import type { WithdrawalType } from "../Withdrawal/WithdrawalType.js";

/**
 * BlockBody type - represents Ethereum block body
 *
 * Contains the transactions, uncles/ommers, and withdrawals for a block.
 * The body combined with the header forms a complete block.
 *
 * @see https://voltaire.tevm.sh/primitives/block-body for BlockBody documentation
 * @see https://ethereum.org/en/developers/docs/blocks/ for block documentation
 * @since 0.0.0
 */
export type BlockBodyType = {
	/** Transactions in block */
	readonly transactions: readonly Transaction[];
	/** Uncle/ommer blocks */
	readonly ommers: readonly UncleType[];
	/** Withdrawals (post-Shanghai) */
	readonly withdrawals?: readonly WithdrawalType[];
};
