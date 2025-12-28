import { TransactionStatus } from "voltaire";
// Generic failure (no reason provided)
const genericFailure = TransactionStatus.failed();

// Common revert reasons
const outOfGas = TransactionStatus.failed("out of gas");

const insufficientBalance = TransactionStatus.failed(
	"insufficient balance for transfer",
);

const requireFailed = TransactionStatus.failed("execution reverted");

const customError = TransactionStatus.failed(
	"ERC20: transfer amount exceeds allowance",
);

const failures = [
	genericFailure,
	outOfGas,
	insufficientBalance,
	requireFailed,
	customError,
];

for (const status of failures) {
	if (TransactionStatus.isFailed(status)) {
	}
}

function categorizeError(status: typeof genericFailure): string {
	if (!TransactionStatus.isFailed(status)) {
		return "not_failed";
	}

	const reason = status.revertReason?.toLowerCase() || "";

	if (reason.includes("gas")) {
		return "gas_error";
	}
	if (reason.includes("balance") || reason.includes("allowance")) {
		return "insufficient_funds";
	}
	if (reason.includes("reverted")) {
		return "contract_revert";
	}
	if (!reason) {
		return "unknown";
	}

	return "other";
}

function handleFailure(status: typeof genericFailure) {
	if (!TransactionStatus.isFailed(status)) {
		return;
	}
	if (status.revertReason) {
		// Suggest remediation
		if (status.revertReason.includes("gas")) {
		} else if (status.revertReason.includes("balance")) {
		} else if (status.revertReason.includes("allowance")) {
		}
	} else {
	}
}

handleFailure(outOfGas);
handleFailure(customError);
