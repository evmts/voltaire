import * as TransactionStatus from "../../../primitives/TransactionStatus/index.js";
import type { Uint256Type } from "../../../primitives/Uint/Uint256Type.js";

const pending1 = TransactionStatus.pending();
const pending2 = TransactionStatus.pending();
const success1 = TransactionStatus.success(21000n as Uint256Type);
const success2 = TransactionStatus.success(21000n as Uint256Type);
const success3 = TransactionStatus.success(50000n as Uint256Type);
const failed1 = TransactionStatus.failed("out of gas");
const failed2 = TransactionStatus.failed("out of gas");
const failed3 = TransactionStatus.failed("execution reverted");

function statusEquals(
	a:
		| ReturnType<typeof TransactionStatus.pending>
		| ReturnType<typeof TransactionStatus.success>
		| ReturnType<typeof TransactionStatus.failed>,
	b:
		| ReturnType<typeof TransactionStatus.pending>
		| ReturnType<typeof TransactionStatus.success>
		| ReturnType<typeof TransactionStatus.failed>,
): boolean {
	// Different types
	if (a.type !== b.type) {
		return false;
	}

	// Both pending
	if (TransactionStatus.isPending(a) && TransactionStatus.isPending(b)) {
		return true;
	}

	// Both success
	if (TransactionStatus.isSuccess(a) && TransactionStatus.isSuccess(b)) {
		return a.gasUsed === b.gasUsed;
	}

	// Both failed
	if (TransactionStatus.isFailed(a) && TransactionStatus.isFailed(b)) {
		return a.revertReason === b.revertReason;
	}

	return false;
}

const transactions = [
	{
		name: "Simple Transfer",
		status: TransactionStatus.success(21000n as Uint256Type),
	},
	{
		name: "ERC20 Transfer",
		status: TransactionStatus.success(65000n as Uint256Type),
	},
	{
		name: "Uniswap Swap",
		status: TransactionStatus.success(150000n as Uint256Type),
	},
	{
		name: "NFT Mint",
		status: TransactionStatus.success(200000n as Uint256Type),
	},
];

// Sort by gas usage
const sorted = [...transactions].sort((a, b) => {
	if (
		!TransactionStatus.isSuccess(a.status) ||
		!TransactionStatus.isSuccess(b.status)
	) {
		return 0;
	}
	return Number(a.status.gasUsed - b.status.gasUsed);
});
for (const tx of sorted) {
	if (TransactionStatus.isSuccess(tx.status)) {
	}
}

function findMostExpensive(
	statuses: Array<ReturnType<typeof TransactionStatus.success>>,
): (typeof statuses)[0] | null {
	let max = null;

	for (const status of statuses) {
		if (!TransactionStatus.isSuccess(status)) {
			continue;
		}

		if (
			!max ||
			(TransactionStatus.isSuccess(max) && status.gasUsed > max.gasUsed)
		) {
			max = status;
		}
	}

	return max;
}

const successStatuses = transactions
	.map((tx) => tx.status)
	.filter(TransactionStatus.isSuccess);
const mostExpensive = findMostExpensive(successStatuses);

if (mostExpensive && TransactionStatus.isSuccess(mostExpensive)) {
}

const mixedStatuses = [
	TransactionStatus.pending(),
	TransactionStatus.success(21000n as Uint256Type),
	TransactionStatus.success(50000n as Uint256Type),
	TransactionStatus.failed("out of gas"),
	TransactionStatus.pending(),
	TransactionStatus.failed("execution reverted"),
	TransactionStatus.success(30000n as Uint256Type),
];

const distribution = {
	pending: 0,
	success: 0,
	failed: 0,
};

for (const status of mixedStatuses) {
	if (TransactionStatus.isPending(status)) {
		distribution.pending++;
	} else if (TransactionStatus.isSuccess(status)) {
		distribution.success++;
	} else if (TransactionStatus.isFailed(status)) {
		distribution.failed++;
	}
}
