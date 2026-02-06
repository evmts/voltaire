import type { Uint256Type } from "@tevm/voltaire";
import { TransactionStatus } from "@tevm/voltaire";

// Pending: transaction submitted but not yet mined
const pendingStatus = TransactionStatus.pending();

// Success: transaction mined and executed successfully
const gasUsed = 21000n as Uint256Type;
const successStatus = TransactionStatus.success(gasUsed);

// Failed: transaction mined but execution failed
const failedStatus = TransactionStatus.failed();

const failedWithReason = TransactionStatus.failed("insufficient balance");
if (TransactionStatus.isSuccess(successStatus)) {
}
if (TransactionStatus.isFailed(failedWithReason)) {
}

// Transaction lifecycle
const lifecycle = [
	TransactionStatus.pending(),
	TransactionStatus.success(50000n as Uint256Type),
];

lifecycle.forEach((status, i) => {});

// Typical receipt processing
function processReceipt(status: typeof successStatus | typeof failedStatus) {
	if (TransactionStatus.isSuccess(status)) {
	} else if (TransactionStatus.isFailed(status)) {
	}
}

processReceipt(successStatus);
processReceipt(failedWithReason);
