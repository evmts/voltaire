import { type Uint256Type } from "voltaire";
import { TransactionStatus } from "voltaire";

// 1. Transaction submitted to mempool
const stage1 = TransactionStatus.pending();

// 2. Transaction mined and succeeded
const stage2 = TransactionStatus.success(50000n as Uint256Type);

// Alternative: Transaction failed
const stage2Failed = TransactionStatus.failed("insufficient balance");

type Status =
	| ReturnType<typeof TransactionStatus.pending>
	| ReturnType<typeof TransactionStatus.success>
	| ReturnType<typeof TransactionStatus.failed>;

function transitionStatus(
	current: Status,
	result: "success" | "failed",
	gasUsed?: Uint256Type,
	revertReason?: string,
): Status {
	// Can only transition from pending
	if (!TransactionStatus.isPending(current)) {
		throw new Error("Can only transition from pending state");
	}

	if (result === "success") {
		if (gasUsed === undefined) {
			throw new Error("Gas used required for success");
		}
		return TransactionStatus.success(gasUsed);
	}

	return TransactionStatus.failed(revertReason);
}

const tx = TransactionStatus.pending();

const txSuccess = transitionStatus(tx, "success", 21000n as Uint256Type);

const txFailed = transitionStatus(tx, "failed", undefined, "out of gas");

interface StatusHistory {
	timestamp: number;
	status: Status;
}

const history: StatusHistory[] = [
	{
		timestamp: Date.now() - 10000,
		status: TransactionStatus.pending(),
	},
	{
		timestamp: Date.now(),
		status: TransactionStatus.success(50000n as Uint256Type),
	},
];
for (const entry of history) {
}

interface Transaction {
	hash: string;
	status: Status;
}

const batch: Transaction[] = [
	{
		hash: "0x123...",
		status: TransactionStatus.pending(),
	},
	{
		hash: "0x456...",
		status: TransactionStatus.success(21000n as Uint256Type),
	},
	{
		hash: "0x789...",
		status: TransactionStatus.failed("revert"),
	},
];

function processBatch(transactions: Transaction[]) {
	const results = {
		pending: [] as string[],
		success: [] as string[],
		failed: [] as string[],
	};

	for (const tx of transactions) {
		if (TransactionStatus.isPending(tx.status)) {
			results.pending.push(tx.hash);
		} else if (TransactionStatus.isSuccess(tx.status)) {
			results.success.push(tx.hash);
		} else if (TransactionStatus.isFailed(tx.status)) {
			results.failed.push(tx.hash);
		}
	}

	return results;
}

const batchResults = processBatch(batch);

function handleStatusChange(oldStatus: Status, newStatus: Status) {
	// Pending -> Success
	if (
		TransactionStatus.isPending(oldStatus) &&
		TransactionStatus.isSuccess(newStatus)
	) {
	}

	// Pending -> Failed
	if (
		TransactionStatus.isPending(oldStatus) &&
		TransactionStatus.isFailed(newStatus)
	) {
	}

	// Invalid transitions
	if (!TransactionStatus.isPending(oldStatus)) {
	}
}

const initial = TransactionStatus.pending();
const final = TransactionStatus.success(50000n as Uint256Type);
handleStatusChange(initial, final);

const failed = TransactionStatus.failed("out of gas");
handleStatusChange(initial, failed);

function shouldRetry(status: Status): boolean {
	if (TransactionStatus.isPending(status)) {
		return false; // Still waiting
	}

	if (TransactionStatus.isSuccess(status)) {
		return false; // No need to retry
	}

	if (TransactionStatus.isFailed(status)) {
		// Retry logic based on reason
		const reason = status.revertReason?.toLowerCase() || "";

		// Retryable errors
		if (reason.includes("nonce too low")) return true;
		if (reason.includes("replacement transaction underpriced")) return true;

		// Non-retryable errors
		if (reason.includes("insufficient balance")) return false;
		if (reason.includes("execution reverted")) return false;

		return false;
	}

	return false;
}

const retryableStatuses = [
	TransactionStatus.failed("nonce too low"),
	TransactionStatus.failed("replacement transaction underpriced"),
	TransactionStatus.failed("insufficient balance"),
	TransactionStatus.failed("execution reverted"),
];
for (const status of retryableStatuses) {
	if (TransactionStatus.isFailed(status)) {
	}
}
