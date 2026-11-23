/**
 * Create an in-memory receipt store for a dev node (Tevm / ZEVM).
 *
 * Receipts are indexed by block hash and by transaction hash. Logs are
 * derived from stored receipts, so `deleteReceipts` removes a block's
 * receipts, logs and tx hash index entries together (reorg-safe).
 *
 * @see https://voltaire.tevm.sh/primitives/receipt for Receipt documentation
 * @since 0.0.0
 * @returns {ReceiptManagerType} Receipt manager
 * @throws {never}
 * @example
 * ```javascript
 * import { ReceiptManager } from './primitives/Receipt/index.js';
 * const manager = ReceiptManager();
 * manager.saveReceipts(blockHash, receipts);
 * const found = manager.getReceiptByTxHash(txHash);
 * const logs = manager.getLogs({ address, topics: [topic0, null] });
 * ```
 */
export function ReceiptManager(): ReceiptManagerType;
export type BlockHashType = import("../../BlockHash/BlockHashType.js").BlockHashType;
export type TransactionHashType = import("../../TransactionHash/TransactionHashType.js").TransactionHashType;
export type EventLogType = import("../../EventLog/EventLogType.js").EventLogType;
export type ReceiptType = import("../ReceiptType.js").ReceiptType;
export type ReceiptManagerType = import("./ReceiptManagerType.js").ReceiptManagerType;
export type ReceiptLogFilter = import("./ReceiptManagerType.js").ReceiptLogFilter;
export type ReceiptLookup = import("./ReceiptManagerType.js").ReceiptLookup;
//# sourceMappingURL=ReceiptManager.d.ts.map