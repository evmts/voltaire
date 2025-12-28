import { GasUsed } from "@tevm/voltaire";
// Different transaction scenarios
const scenarios = [
	{
		name: "Efficient Transaction",
		gasLimit: 50000n,
		gasUsed: 45000n,
	},
	{
		name: "Exact Usage",
		gasLimit: 65000n,
		gasUsed: 65000n,
	},
	{
		name: "Conservative Limit",
		gasLimit: 200000n,
		gasUsed: 120000n,
	},
	{
		name: "Very Conservative",
		gasLimit: 500000n,
		gasUsed: 180000n,
	},
	{
		name: "Optimized Contract",
		gasLimit: 100000n,
		gasUsed: 85000n,
	},
];

const gasPrice = 30_000_000_000n; // 30 gwei

for (const scenario of scenarios) {
	const gasUsed = GasUsed(scenario.gasUsed);
	const unusedGas = scenario.gasLimit - scenario.gasUsed;
	const efficiency =
		(Number(scenario.gasUsed) / Number(scenario.gasLimit)) * 100;
	const refund = unusedGas * gasPrice;
}
const conservative = scenarios[2];
const conservativeUsed = GasUsed(conservative.gasUsed);
const buffer =
	(Number(conservative.gasLimit) / Number(conservative.gasUsed) - 1) * 100;
