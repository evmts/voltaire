import * as TransactionStatus from "../../../primitives/TransactionStatus/index.js";
import type { Uint256Type } from "../../../primitives/Uint/Uint256Type.js";

type Status =
	| ReturnType<typeof TransactionStatus.pending>
	| ReturnType<typeof TransactionStatus.success>
	| ReturnType<typeof TransactionStatus.failed>;

function processStatus(status: Status) {
	// Type guard narrows to pending
	if (TransactionStatus.isPending(status)) {
		// status.type is "pending" here
		return;
	}

	// Type guard narrows to success
	if (TransactionStatus.isSuccess(status)) {
		return;
	}

	// Type guard narrows to failed
	if (TransactionStatus.isFailed(status)) {
		return;
	}
}

const pending = TransactionStatus.pending();
const success = TransactionStatus.success(50000n as Uint256Type);
const failed = TransactionStatus.failed("out of gas");

processStatus(pending);
processStatus(success);
processStatus(failed);

function matchStatus(status: Status): string {
	if (TransactionStatus.isPending(status)) {
		return "waiting for confirmation";
	}

	if (TransactionStatus.isSuccess(status)) {
		return `succeeded with ${status.gasUsed} gas`;
	}

	if (TransactionStatus.isFailed(status)) {
		return `failed${status.revertReason ? `: ${status.revertReason}` : ""}`;
	}

	// Exhaustive check - TypeScript knows this is unreachable
	const _exhaustive: never = status;
	return _exhaustive;
}

function getStatusData(status: Status) {
	// Using discriminated union's type field
	switch (status.type) {
		case "pending":
			// No additional fields to access
			break;

		case "success":
			break;

		case "failed":
			break;

		default: {
			// Exhaustive check
			const _exhaustive: never = status;
			throw new Error(`Unhandled status: ${_exhaustive}`);
		}
	}
}
getStatusData(success);
getStatusData(failed);

const statuses: Status[] = [
	TransactionStatus.pending(),
	TransactionStatus.success(21000n as Uint256Type),
	TransactionStatus.failed("revert"),
	TransactionStatus.success(50000n as Uint256Type),
	TransactionStatus.pending(),
];

// Filter to only success statuses
const successStatuses = statuses.filter(TransactionStatus.isSuccess);

// TypeScript knows successStatuses has gasUsed
const totalGas = successStatuses.reduce(
	(sum, status) => sum + status.gasUsed,
	0n,
);

// Filter to only failed statuses
const failedStatuses = statuses.filter(TransactionStatus.isFailed);

// TypeScript knows failedStatuses has revertReason
for (const status of failedStatuses) {
}

function updateToPending(): ReturnType<typeof TransactionStatus.pending> {
	return TransactionStatus.pending();
}

function updateToSuccess(
	gas: Uint256Type,
): ReturnType<typeof TransactionStatus.success> {
	return TransactionStatus.success(gas);
}

function updateToFailed(
	reason?: string,
): ReturnType<typeof TransactionStatus.failed> {
	return TransactionStatus.failed(reason);
}

function analyzeStatus(status: Status) {
	const isPending = TransactionStatus.isPending(status);
	const isSuccess = TransactionStatus.isSuccess(status);
	const isFailed = TransactionStatus.isFailed(status);

	// Use narrowed types in nested conditions
	if (isSuccess && status.gasUsed > 100000n) {
	}

	if (isFailed && status.revertReason?.includes("gas")) {
	}
}

analyzeStatus(TransactionStatus.success(150000n as Uint256Type));
analyzeStatus(TransactionStatus.failed("out of gas"));

function handleStatus<T extends Status>(
	status: T,
	handlers: {
		onPending?: () => void;
		onSuccess?: (gas: Uint256Type) => void;
		onFailed?: (reason?: string) => void;
	},
) {
	if (TransactionStatus.isPending(status)) {
		handlers.onPending?.();
	} else if (TransactionStatus.isSuccess(status)) {
		handlers.onSuccess?.(status.gasUsed);
	} else if (TransactionStatus.isFailed(status)) {
		handlers.onFailed?.(status.revertReason);
	}
}

handleStatus(success, {
	onSuccess: (gas) => console.log("Success handler called, gas:", gas),
	onFailed: (reason) => console.log("Failed handler called, reason:", reason),
});
