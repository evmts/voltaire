import type { brand } from "../../brand.js";
import type { FilterIdType } from "../FilterId/FilterIdType.js";
/**
 * Pending transaction filter created by eth_newPendingTransactionFilter
 *
 * Notifies of new pending transactions when polled with eth_getFilterChanges.
 * Returns array of transaction hashes.
 */
export type PendingTransactionFilterType = {
    /** Filter identifier */
    readonly filterId: FilterIdType;
    /** Filter type discriminator */
    readonly type: "pendingTransaction";
} & {
    readonly [brand]: "PendingTransactionFilter";
};
//# sourceMappingURL=PendingTransactionFilterType.d.ts.map