import { Bytes, type Uint256Type } from "@tevm/voltaire";
import {
	Address,
	BlockHash,
	BlockNumber,
	Receipt,
	TransactionHash,
	TransactionIndex,
	TransactionStatus,
} from "@tevm/voltaire";

// Example: Contract deployment receipts

// Successful contract deployment
const deploymentReceipt = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0xc3c5a547b5ba6f0e4f3e8c2a1b1e6d5f4c3b2a1909876543210fedcba9876543",
	),
	transactionIndex: TransactionIndex(12),
	blockHash: BlockHash.fromHex(
		"0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
	),
	blockNumber: BlockNumber(15537400n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: null, // null indicates contract creation
	cumulativeGasUsed: 1234567n as Uint256Type,
	gasUsed: 567890n as Uint256Type,
	contractAddress: Address.fromHex(
		"0x1234567890123456789012345678901234567890",
	), // Newly created contract
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.success(567890n as Uint256Type),
	effectiveGasPrice: 35000000000n as Uint256Type,
	type: "eip1559",
});

// Check if it's a deployment
if (deploymentReceipt.to === null && deploymentReceipt.contractAddress) {
}

// Failed contract deployment
const failedDeployment = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
	),
	transactionIndex: TransactionIndex(15),
	blockHash: BlockHash.fromHex(
		"0x1111111111111111111111111111111111111111111111111111111111111111",
	),
	blockNumber: BlockNumber(15537401n),
	from: Address.fromHex("0x5409ed021d9299bf6814279a6a1411a7e866a631"),
	to: null,
	cumulativeGasUsed: 2000000n as Uint256Type,
	gasUsed: 800000n as Uint256Type,
	contractAddress: null, // No contract created when deployment fails
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.failed("Contract creation code execution failed"),
	effectiveGasPrice: 40000000000n as Uint256Type,
	type: "eip1559",
});
if (TransactionStatus.isFailed(failedDeployment.status)) {
}

// CREATE2 deployment
const create2Deployment = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	),
	transactionIndex: TransactionIndex(8),
	blockHash: BlockHash.fromHex(
		"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	),
	blockNumber: BlockNumber(15537402n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: null,
	cumulativeGasUsed: 3000000n as Uint256Type,
	gasUsed: 450000n as Uint256Type,
	contractAddress: Address.fromHex(
		"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
	),
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.success(450000n as Uint256Type),
	effectiveGasPrice: 32000000000n as Uint256Type,
	type: "eip1559",
});
