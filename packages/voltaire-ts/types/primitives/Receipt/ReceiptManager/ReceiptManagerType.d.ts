import type { AddressType } from "../../Address/AddressType.js";
import type { BlockHashType } from "../../BlockHash/BlockHashType.js";
import type { EventLogType } from "../../EventLog/EventLogType.js";
import type { HashType } from "../../Hash/HashType.js";
import type { TransactionHashType } from "../../TransactionHash/TransactionHashType.js";
import type { ReceiptType } from "../ReceiptType.js";
/**
 * Location of a receipt found by transaction hash
 */
export type ReceiptLookup = {
    readonly receipt: ReceiptType;
    readonly blockHash: BlockHashType;
    readonly txIndex: number;
};
/**
 * eth_getLogs-style filter.
 *
 * - `blockHashes`: only search these blocks (omitted = all stored blocks)
 * - `address`: single address or OR-list (empty list = any)
 * - `topics`: positional; `null` = wildcard, array = OR-list (empty = wildcard)
 */
export type ReceiptLogFilter = {
    readonly blockHashes?: readonly BlockHashType[];
    readonly address?: AddressType | readonly AddressType[];
    readonly topics?: readonly (HashType | readonly HashType[] | null)[];
};
/**
 * In-memory receipt store keyed by block hash with a transaction hash index.
 */
export type ReceiptManagerType = {
    /** Store receipts for a block, replacing any receipts already stored for it */
    saveReceipts(blockHash: BlockHashType, receipts: readonly ReceiptType[]): void;
    /** Receipts for a block, or undefined when the block is unknown */
    getReceipts(blockHash: BlockHashType): readonly ReceiptType[] | undefined;
    /** Receipt plus its block hash and index for a transaction hash */
    getReceiptByTxHash(txHash: TransactionHashType): ReceiptLookup | undefined;
    /** Logs matching the filter, in block insertion order then log order */
    getLogs(filter?: ReceiptLogFilter): EventLogType[];
    /** Remove a block's receipts, logs and tx index entries. True if it existed */
    deleteReceipts(blockHash: BlockHashType): boolean;
    /** True if receipts are stored for the block */
    hasReceipts(blockHash: BlockHashType): boolean;
    /** Remove everything */
    clear(): void;
};
//# sourceMappingURL=ReceiptManagerType.d.ts.map