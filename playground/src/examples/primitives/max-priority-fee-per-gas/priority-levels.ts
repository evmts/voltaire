import { MaxPriorityFeePerGas } from "@tevm/voltaire";

const priorityLevels = {
	minimal: MaxPriorityFeePerGas(500000000n), // 0.5 Gwei
	low: MaxPriorityFeePerGas.fromGwei(1),
	medium: MaxPriorityFeePerGas.fromGwei(2),
	high: MaxPriorityFeePerGas.fromGwei(5),
	urgent: MaxPriorityFeePerGas.fromGwei(10),
	critical: MaxPriorityFeePerGas.fromGwei(20),
};

function selectPriority(scenario: string): bigint {
	const scenarios = {
		"off-peak-transfer": priorityLevels.low,
		"standard-swap": priorityLevels.medium,
		"nft-mint": priorityLevels.high,
		arbitrage: priorityLevels.urgent,
		liquidation: priorityLevels.critical,
	};
	return scenarios[scenario as keyof typeof scenarios] || priorityLevels.medium;
}

const scenarios = [
	"off-peak-transfer",
	"standard-swap",
	"nft-mint",
	"arbitrage",
	"liquidation",
];

for (const scenario of scenarios) {
	const tip = selectPriority(scenario);
}
const baseFee = 30n; // 30 Gwei base fee
const gasLimit = 21000n;

for (const [level, tip] of Object.entries(priorityLevels)) {
	const totalFee = (baseFee + MaxPriorityFeePerGas.toGwei(tip)) * gasLimit;
	const costInEth = Number(totalFee) / 1000000000;
}
