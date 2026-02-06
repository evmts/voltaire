import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { EventLogType } from "../EventLog/EventLogType.js";
import type { HashType } from "../Hash/HashType.js";
import type { TransactionHashType } from "../TransactionHash/TransactionHashType.js";
import type { TransactionIndexType } from "../TransactionIndex/TransactionIndexType.js";
import type { TransactionStatusType } from "../TransactionStatus/TransactionStatusType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Transaction receipt
 */
export type ReceiptType = {
	/** Transaction hash */
	readonly transactionHash: TransactionHashType;
	/** Transaction index in block */
	readonly transactionIndex: TransactionIndexType;
	/** Block hash */
	readonly blockHash: BlockHashType;
	/** Block number */
	readonly blockNumber: BlockNumberType;
	/** Sender address */
	readonly from: AddressType;
	/** Recipient address (null for contract creation) */
	readonly to: AddressType | null;
	/** Cumulative gas used in block */
	readonly cumulativeGasUsed: Uint256Type;
	/** Gas used by this transaction */
	readonly gasUsed: Uint256Type;
	/** Contract address (non-null for creation) */
	readonly contractAddress: AddressType | null;
	/** Event logs */
	readonly logs: readonly EventLogType[];
	/** Logs bloom filter (256 bytes) */
	readonly logsBloom: Uint8Array;
	/** Transaction status (post-Byzantium) */
	readonly status?: TransactionStatusType;
	/** State root (pre-Byzantium only) */
	readonly root?: HashType;
	/** Effective gas price */
	readonly effectiveGasPrice: Uint256Type;
	/** Transaction type */
	readonly type: "legacy" | "eip2930" | "eip1559" | "eip4844" | "eip7702";
	/** Blob gas used (EIP-4844) */
	readonly blobGasUsed?: Uint256Type;
	/** Blob gas price (EIP-4844) */
	readonly blobGasPrice?: Uint256Type;
} & { readonly [brand]: "Receipt" };
