import { type Uint256Type, Bytes } from "@tevm/voltaire";
import { Address, BlockHash, BlockNumber, Hash, Receipt, TransactionHash, TransactionIndex, TransactionStatus } from "@tevm/voltaire";

// Example: Receipt basics

// Create a simple successful transaction receipt
const successfulReceipt = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
	),
	transactionIndex: TransactionIndex(0),
	blockHash: BlockHash.fromHex(
		"0x4e3a3754410177e6937ef1f84bba68ea139e8d1a2258c5f85db9f1cd715a1bdd",
	),
	blockNumber: BlockNumber(46147n),
	from: Address.fromHex("0x5409ed021d9299bf6814279a6a1411a7e866a631"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 21000n as Uint256Type,
	gasUsed: 21000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.success(21000n as Uint256Type),
	effectiveGasPrice: 20000000000n as Uint256Type,
	type: "legacy",
});

// Failed transaction receipt
const failedReceipt = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
	),
	transactionIndex: TransactionIndex(1),
	blockHash: BlockHash.fromHex(
		"0x4e3a3754410177e6937ef1f84bba68ea139e8d1a2258c5f85db9f1cd715a1bdd",
	),
	blockNumber: BlockNumber(46147n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 42000n as Uint256Type,
	gasUsed: 21000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.failed("Insufficient balance"),
	effectiveGasPrice: 20000000000n as Uint256Type,
	type: "legacy",
});
if (TransactionStatus.isFailed(failedReceipt.status)) {
}
