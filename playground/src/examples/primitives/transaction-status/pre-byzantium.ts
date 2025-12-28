import { type Uint256Type } from "@tevm/voltaire";
import { TransactionStatus } from "@tevm/voltaire";

// Byzantium fork: block 4,370,000 on mainnet (October 2017)
// Before this, receipts had no status field

interface ReceiptPreByzantium {
	transactionHash: string;
	gasUsed: bigint;
	// No status field!
	logs: unknown[];
}

interface ReceiptPostByzantium {
	transactionHash: string;
	gasUsed: bigint;
	status: "0x0" | "0x1";
	logs: unknown[];
}

// Pre-Byzantium: determine success heuristically
function detectPreByzantiumSuccess(receipt: ReceiptPreByzantium): boolean {
	// Heuristic: check if any logs were emitted
	// Failed transactions typically produce no logs
	// Note: This is not 100% reliable!
	return receipt.logs.length > 0;
}

const preByzReceipt1: ReceiptPreByzantium = {
	transactionHash: "0x123...",
	gasUsed: 50000n,
	logs: [{ event: "Transfer" }, { event: "Approval" }],
};

const preByzReceipt2: ReceiptPreByzantium = {
	transactionHash: "0x456...",
	gasUsed: 21000n,
	logs: [], // No logs likely means failure
};

// Post-Byzantium: reliable status field
function createStatus(receipt: ReceiptPostByzantium) {
	if (receipt.status === "0x1") {
		return TransactionStatus.success(receipt.gasUsed as Uint256Type);
	}
	return TransactionStatus.failed();
}

const modernReceipt: ReceiptPostByzantium = {
	transactionHash: "0x789...",
	gasUsed: 50000n,
	status: "0x1",
	logs: [{ event: "Transfer" }],
};

type AnyReceipt = ReceiptPreByzantium | ReceiptPostByzantium;

function safeCreateStatus(receipt: AnyReceipt) {
	// Check if post-Byzantium
	if ("status" in receipt) {
		if (receipt.status === "0x1") {
			return TransactionStatus.success(receipt.gasUsed as Uint256Type);
		}
		return TransactionStatus.failed();
	}

	// Conservative: treat as pending since we cannot confirm
	return TransactionStatus.pending();
}
const status1 = safeCreateStatus(modernReceipt);
const status2 = safeCreateStatus(preByzReceipt1);

interface ReceiptWithBlock {
	blockNumber: bigint;
	status?: "0x0" | "0x1";
	gasUsed: bigint;
}

function isPreByzantium(blockNumber: bigint, chainId = 1): boolean {
	const byzantiumBlocks: Record<number, bigint> = {
		1: 4370000n, // Mainnet
		3: 1700000n, // Ropsten
		4: 1035301n, // Rinkeby
		5: 0n, // Goerli (launched post-Byzantium)
	};

	const byzantiumBlock = byzantiumBlocks[chainId];
	if (byzantiumBlock === undefined) {
		return false; // Unknown chain, assume modern
	}

	return blockNumber < byzantiumBlock;
}

const receipts: ReceiptWithBlock[] = [
	{ blockNumber: 4300000n, gasUsed: 50000n }, // Pre-Byzantium
	{ blockNumber: 4400000n, status: "0x1", gasUsed: 50000n }, // Post-Byzantium
];

for (const receipt of receipts) {
}
