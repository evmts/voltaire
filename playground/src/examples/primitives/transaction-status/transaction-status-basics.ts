import * as TransactionStatus from "../../../primitives/TransactionStatus/index.js";
import type { Uint256Type } from "../../../primitives/Uint/Uint256Type.js";

// Example: TransactionStatus basics

console.log("=== Status Creation ===");

// Pending: transaction submitted but not yet mined
const pendingStatus = TransactionStatus.pending();
console.log("Pending:", pendingStatus);

// Success: transaction mined and executed successfully
const gasUsed = 21000n as Uint256Type;
const successStatus = TransactionStatus.success(gasUsed);
console.log("Success:", successStatus);

// Failed: transaction mined but execution failed
const failedStatus = TransactionStatus.failed();
console.log("Failed (no reason):", failedStatus);

const failedWithReason = TransactionStatus.failed("insufficient balance");
console.log("Failed (with reason):", failedWithReason);

console.log("\n=== Type Guards ===");

// Type-safe checks with narrowing
console.log(
	"isPending(pendingStatus):",
	TransactionStatus.isPending(pendingStatus),
);
console.log(
	"isSuccess(successStatus):",
	TransactionStatus.isSuccess(successStatus),
);
console.log(
	"isFailed(failedStatus):",
	TransactionStatus.isFailed(failedStatus),
);

console.log("\n=== Success Status Details ===");
if (TransactionStatus.isSuccess(successStatus)) {
	// Type narrowed: can access gasUsed
	console.log("Gas used:", successStatus.gasUsed);
}

console.log("\n=== Failed Status Details ===");
if (TransactionStatus.isFailed(failedWithReason)) {
	// Type narrowed: can access revertReason
	console.log("Revert reason:", failedWithReason.revertReason);
}

console.log("\n=== Status Flow ===");

// Transaction lifecycle
const lifecycle = [
	TransactionStatus.pending(),
	TransactionStatus.success(50000n as Uint256Type),
];

lifecycle.forEach((status, i) => {
	console.log(`\nStep ${i + 1}:`);
	console.log("  Type:", status.type);
	console.log("  Pending:", TransactionStatus.isPending(status));
	console.log("  Success:", TransactionStatus.isSuccess(status));
	console.log("  Failed:", TransactionStatus.isFailed(status));
});

console.log("\n=== Practical Usage ===");

// Typical receipt processing
function processReceipt(status: typeof successStatus | typeof failedStatus) {
	if (TransactionStatus.isSuccess(status)) {
		console.log(`Transaction succeeded, gas used: ${status.gasUsed}`);
	} else if (TransactionStatus.isFailed(status)) {
		console.log(
			`Transaction failed${status.revertReason ? `: ${status.revertReason}` : ""}`,
		);
	}
}

processReceipt(successStatus);
processReceipt(failedWithReason);
