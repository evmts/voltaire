import type { Uint256Type } from "@tevm/voltaire";
import { TransactionStatus } from "@tevm/voltaire";

// Various transaction outcomes
const success = TransactionStatus.success(50000n as Uint256Type);
const pending = TransactionStatus.pending();
const revert = TransactionStatus.failed("execution reverted");
const revertWithDetails = TransactionStatus.failed(
	"execution reverted: SafeMath: subtraction overflow",
);

function detectRevert(
	status:
		| typeof success
		| typeof pending
		| typeof revert
		| typeof revertWithDetails,
): boolean {
	return TransactionStatus.isFailed(status);
}

function parseRevertMessage(status: typeof revert) {
	if (!TransactionStatus.isFailed(status) || !status.revertReason) {
		return null;
	}

	const reason = status.revertReason;

	// Common patterns
	const patterns = {
		safemath: /SafeMath: (.+)$/,
		require: /^execution reverted: (.+)$/,
		panic: /^Panic\((\d+)\)$/,
		custom: /^([A-Za-z0-9_]+)\(.*\)$/,
	};

	for (const [type, pattern] of Object.entries(patterns)) {
		const match = reason.match(pattern);
		if (match) {
			return { type, message: match[1] || match[0] };
		}
	}

	return { type: "unknown", message: reason };
}

const commonReverts = [
	TransactionStatus.failed("execution reverted"),
	TransactionStatus.failed("execution reverted: SafeMath: division by zero"),
	TransactionStatus.failed(
		"execution reverted: SafeMath: subtraction overflow",
	),
	TransactionStatus.failed(
		"execution reverted: Ownable: caller is not the owner",
	),
	TransactionStatus.failed("execution reverted: Pausable: paused"),
	TransactionStatus.failed(
		"execution reverted: ERC20: transfer amount exceeds balance",
	),
	TransactionStatus.failed("Panic(0x11)"), // Arithmetic overflow
	TransactionStatus.failed("Panic(0x12)"), // Division by zero
	TransactionStatus.failed("Panic(0x32)"), // Array out of bounds
];

for (const status of commonReverts) {
	if (TransactionStatus.isFailed(status)) {
		const parsed = parseRevertMessage(status);
	}
}

function analyzeRevert(status: typeof revert) {
	if (!TransactionStatus.isFailed(status)) {
		return { reverted: false };
	}

	const reason = status.revertReason || "Unknown";

	return {
		reverted: true,
		reason,
		isPanic: reason.startsWith("Panic("),
		isSafeMath: reason.includes("SafeMath"),
		isAccessControl:
			reason.includes("Ownable") || reason.includes("AccessControl"),
		isERC20: reason.includes("ERC20"),
	};
}

for (const status of commonReverts) {
}
