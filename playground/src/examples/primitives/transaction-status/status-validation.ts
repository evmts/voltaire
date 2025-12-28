import { type Uint256Type } from "voltaire";
import { TransactionStatus } from "voltaire";

function validatePending(
	status:
		| ReturnType<typeof TransactionStatus.pending>
		| ReturnType<typeof TransactionStatus.success>
		| ReturnType<typeof TransactionStatus.failed>,
) {
	if (!TransactionStatus.isPending(status)) {
		throw new Error("Expected pending status");
	}
}

function validateSuccess(status: ReturnType<typeof TransactionStatus.success>) {
	if (!TransactionStatus.isSuccess(status)) {
		throw new Error("Expected success status");
	}
}

function validateFailed(status: ReturnType<typeof TransactionStatus.failed>) {
	if (!TransactionStatus.isFailed(status)) {
		throw new Error("Expected failed status");
	}
}

const pending = TransactionStatus.pending();
const success = TransactionStatus.success(50000n as Uint256Type);
const failed = TransactionStatus.failed("out of gas");

validatePending(pending);
validateSuccess(success);
validateFailed(failed);

function validateGasUsage(
	status: ReturnType<typeof TransactionStatus.success>,
) {
	if (!TransactionStatus.isSuccess(status)) {
		throw new Error("Status must be success to check gas");
	}

	const gas = status.gasUsed;
	const MIN_GAS = 21000n; // Minimum for simple transfer
	const MAX_GAS = 30000000n; // Block gas limit (typical)

	if (gas < MIN_GAS) {
		return false;
	}

	if (gas > MAX_GAS) {
		return false;
	}
	return true;
}

const validGas = TransactionStatus.success(50000n as Uint256Type);
const lowGas = TransactionStatus.success(1000n as Uint256Type);
const highGas = TransactionStatus.success(40000000n as Uint256Type);

validateGasUsage(validGas);
validateGasUsage(lowGas);
validateGasUsage(highGas);

function validateRevertReason(
	status: ReturnType<typeof TransactionStatus.failed>,
) {
	if (!TransactionStatus.isFailed(status)) {
		throw new Error("Status must be failed to check revert reason");
	}

	const reason = status.revertReason;

	if (!reason) {
		return false;
	}

	if (reason.length === 0) {
		return false;
	}

	if (reason.length > 1024) {
		return false;
	}
	return true;
}

const noReason = TransactionStatus.failed();
const withReason = TransactionStatus.failed("execution reverted");
const longReason = TransactionStatus.failed("x".repeat(2000));

validateRevertReason(noReason);
validateRevertReason(withReason);
validateRevertReason(longReason);

function checkStatusConsistency(
	status:
		| ReturnType<typeof TransactionStatus.pending>
		| ReturnType<typeof TransactionStatus.success>
		| ReturnType<typeof TransactionStatus.failed>,
): boolean {
	const isPending = TransactionStatus.isPending(status);
	const isSuccess = TransactionStatus.isSuccess(status);
	const isFailed = TransactionStatus.isFailed(status);

	// Exactly one should be true
	const trueCount = [isPending, isSuccess, isFailed].filter((x) => x).length;

	if (trueCount !== 1) {
		return false;
	}
	return true;
}

checkStatusConsistency(pending);
checkStatusConsistency(success);
checkStatusConsistency(failed);

function fullyValidateStatus(
	status:
		| ReturnType<typeof TransactionStatus.pending>
		| ReturnType<typeof TransactionStatus.success>
		| ReturnType<typeof TransactionStatus.failed>,
) {
	// Type consistency
	if (!checkStatusConsistency(status)) {
		return { valid: false, reason: "inconsistent type" };
	}

	// Success-specific validation
	if (TransactionStatus.isSuccess(status)) {
		if (!validateGasUsage(status)) {
			return { valid: false, reason: "invalid gas usage" };
		}
	}

	// Failed-specific validation
	if (TransactionStatus.isFailed(status)) {
		if (!validateRevertReason(status)) {
			return { valid: false, reason: "invalid revert reason" };
		}
	}

	return { valid: true };
}

fullyValidateStatus(success);
fullyValidateStatus(failed);
fullyValidateStatus(lowGas);
