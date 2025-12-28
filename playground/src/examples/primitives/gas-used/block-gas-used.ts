import { GasUsed } from "voltaire";
// Simulate a block with multiple transactions
const blockTransactions = [
	{ index: 0, gasUsed: 21000n },
	{ index: 1, gasUsed: 65000n },
	{ index: 2, gasUsed: 120000n },
	{ index: 3, gasUsed: 85000n },
	{ index: 4, gasUsed: 45000n },
	{ index: 5, gasUsed: 150000n },
	{ index: 6, gasUsed: 200000n },
	{ index: 7, gasUsed: 75000n },
];

const blockGasLimit = 30_000_000n;
let cumulativeGasUsed = 0n;

for (const tx of blockTransactions) {
	const gasUsed = GasUsed.from(tx.gasUsed);
	cumulativeGasUsed += tx.gasUsed;
	const percentOfBlock =
		(Number(cumulativeGasUsed) / Number(blockGasLimit)) * 100;
}
const totalGasUsed = GasUsed.from(cumulativeGasUsed);
const utilizationPercent =
	(Number(cumulativeGasUsed) / Number(blockGasLimit)) * 100;
const avgGasPrice = 25_000_000_000n; // 25 gwei
const blockReward = GasUsed.calculateCost(totalGasUsed, avgGasPrice);
const baseReward = 2_000_000_000_000_000_000n; // 2 ETH
