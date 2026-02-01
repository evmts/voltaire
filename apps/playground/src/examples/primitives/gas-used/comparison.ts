import { GasUsed } from "@tevm/voltaire";
// Real-world transaction gas usage data
const transactions = [
	{ name: "Alice: ETH Transfer", gasUsed: 21000n },
	{ name: "Bob: ERC-20 Approve", gasUsed: 46000n },
	{ name: "Carol: Uniswap Swap", gasUsed: 184523n },
	{ name: "Dave: NFT Mint", gasUsed: 245812n },
	{ name: "Eve: Multi-send", gasUsed: 156789n },
];

// Sort by gas used (ascending)
const sorted = [...transactions].sort((a, b) =>
	GasUsed.compare(a.gasUsed, b.gasUsed),
);

for (let i = 0; i < sorted.length; i++) {
	const tx = sorted[i];
	const gasUsed = GasUsed(tx.gasUsed);
	const position = i + 1;

	if (i > 0) {
		const prev = sorted[i - 1];
		const difference = tx.gasUsed - prev.gasUsed;
		const percentMore = (Number(tx.gasUsed) / Number(prev.gasUsed) - 1) * 100;
	}
}
const gas1 = GasUsed(21000n);
const gas2 = GasUsed("21000");
const gas3 = GasUsed(21000);
const gas4 = GasUsed(46000n);
const base = transactions[0].gasUsed; // ETH transfer

for (const tx of transactions.slice(1)) {
	const multiplier = Number(tx.gasUsed) / Number(base);
	const comparison = GasUsed.compare(tx.gasUsed, base);
}
const gasValues = transactions.map((tx) => tx.gasUsed);
const minGas = gasValues.reduce((min, current) =>
	GasUsed.compare(current, min) < 0 ? current : min,
);
const maxGas = gasValues.reduce((max, current) =>
	GasUsed.compare(current, max) > 0 ? current : max,
);
const gasPrice = 30_000_000_000n;

const costs = transactions.map((tx) => ({
	name: tx.name,
	cost: GasUsed.calculateCost(tx.gasUsed, gasPrice),
}));

const sortedByCost = costs.sort((a, b) =>
	a.cost < b.cost ? -1 : a.cost > b.cost ? 1 : 0,
);
for (const item of sortedByCost) {
}
