import { GasUsed } from "voltaire";
// EIP-3529: Gas refunds reduced to max 20% of gas used
const MAX_REFUND_QUOTIENT = 5n; // Refund capped at gasUsed/5

// Transaction that clears storage slots
const scenarios = [
	{
		name: "Clear 1 slot",
		gasUsed: 25000n,
		slotsCleared: 1,
		refundPerSlot: 4800n, // EIP-3529 reduced refund
	},
	{
		name: "Clear 5 slots",
		gasUsed: 45000n,
		slotsCleared: 5,
		refundPerSlot: 4800n,
	},
	{
		name: "Clear 10 slots",
		gasUsed: 70000n,
		slotsCleared: 10,
		refundPerSlot: 4800n,
	},
	{
		name: "Clear 20 slots",
		gasUsed: 120000n,
		slotsCleared: 20,
		refundPerSlot: 4800n,
	},
];

const gasPrice = 25_000_000_000n; // 25 gwei

for (const scenario of scenarios) {
	const gasUsed = GasUsed.from(scenario.gasUsed);
	const potentialRefund =
		scenario.refundPerSlot * BigInt(scenario.slotsCleared);
	const maxRefund = scenario.gasUsed / MAX_REFUND_QUOTIENT;
	const actualRefund =
		potentialRefund < maxRefund ? potentialRefund : maxRefund;
	const effectiveGasUsed = scenario.gasUsed - actualRefund;

	const fullCost = GasUsed.calculateCost(gasUsed, gasPrice);
	const refundAmount = actualRefund * gasPrice;
	const netCost = fullCost - refundAmount;
}

const largeClearTx = {
	gasUsed: 200000n,
	slotsCleared: 30,
};

const preEIP3529Refund = 15000n * BigInt(largeClearTx.slotsCleared); // Old refund
const postEIP3529MaxRefund = largeClearTx.gasUsed / MAX_REFUND_QUOTIENT;
const postEIP3529ActualRefund =
	4800n * BigInt(largeClearTx.slotsCleared) < postEIP3529MaxRefund
		? 4800n * BigInt(largeClearTx.slotsCleared)
		: postEIP3529MaxRefund;

const preEffective = largeClearTx.gasUsed - preEIP3529Refund;
const postEffective = largeClearTx.gasUsed - postEIP3529ActualRefund;
