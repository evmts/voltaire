import { OSAKA } from "../Hardfork/constants.js";
import type { HardforkType } from "../Hardfork/HardforkType.js";
import { isAtLeast } from "../Hardfork/isAtLeast.js";

/**
 * EIP-7825 per-transaction gas limit cap (2^24), active from Osaka.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7825
 */
export const MAX_TX_GAS_LIMIT = 16_777_216n;

/**
 * Check whether a transaction's gas limit exceeds the EIP-7825 cap of
 * `2^24` gas. The cap applies from Osaka; earlier hardforks have no
 * per-transaction cap, so this returns `false` for them.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.1.0
 * @param tx - Transaction (only `gasLimit` is read)
 * @param hardfork - Hardfork the transaction executes under
 * @returns `true` if the gas limit exceeds the cap at `hardfork`
 * @example
 * ```javascript
 * import { exceedsTxGasLimit } from './primitives/Transaction/exceedsTxGasLimit.js';
 * import { OSAKA } from './primitives/Hardfork/constants.js';
 * exceedsTxGasLimit({ gasLimit: 30_000_000n }, OSAKA); // true
 * ```
 */
export function exceedsTxGasLimit(
	tx: { gasLimit: bigint },
	hardfork: HardforkType,
): boolean {
	return isAtLeast(hardfork, OSAKA) && tx.gasLimit > MAX_TX_GAS_LIMIT;
}
