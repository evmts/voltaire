import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Transaction inclusion and fee caps
// Shows how maxFeePerGas and maxPriorityFeePerGas work

console.log("Transaction Inclusion Rules");
console.log("===========================\n");

const currentBaseFee = 50_000_000_000n; // 50 gwei

console.log("Current network base fee:", currentBaseFee);

// Scenario 1: Transaction with room for priority
console.log("\n\nScenario 1: Normal transaction");
console.log("===============================");

const tx1 = {
	maxFeePerGas: 100_000_000_000n, // 100 gwei
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
	baseFee: currentBaseFee,
};

console.log("Max fee per gas:", tx1.maxFeePerGas);
console.log("Max priority fee:", tx1.maxPriorityFeePerGas);
console.log("Current base fee:", tx1.baseFee);

const fee1 = FeeMarket.calculateTxFee(tx1);
console.log("\nResult:");
console.log("  Effective gas price:", fee1.effectiveGasPrice);
console.log("  Base fee (burned):", fee1.baseFee);
console.log("  Priority fee (tip):", fee1.priorityFee);
console.log("  ✓ Transaction can be included");

// Scenario 2: Max fee caps the priority
console.log("\n\nScenario 2: Max fee caps priority");
console.log("==================================");

const tx2 = {
	maxFeePerGas: 51_000_000_000n, // 51 gwei (close to base)
	maxPriorityFeePerGas: 5_000_000_000n, // Want 5 gwei tip
	baseFee: currentBaseFee,
};

console.log("Max fee per gas:", tx2.maxFeePerGas);
console.log("Max priority fee:", tx2.maxPriorityFeePerGas);
console.log("Current base fee:", tx2.baseFee);

const fee2 = FeeMarket.calculateTxFee(tx2);
console.log("\nResult:");
console.log("  Effective gas price:", fee2.effectiveGasPrice);
console.log("  Base fee (burned):", fee2.baseFee);
console.log("  Priority fee (tip):", fee2.priorityFee);
console.log("\nMax fee limits effective gas price");
console.log("Priority fee reduced to:", fee2.priorityFee);

// Scenario 3: Cannot include (max fee too low)
console.log("\n\nScenario 3: Transaction rejected");
console.log("=================================");

const tx3 = {
	maxFeePerGas: 30_000_000_000n, // 30 gwei (below base!)
	maxPriorityFeePerGas: 2_000_000_000n,
	baseFee: currentBaseFee,
};

console.log("Max fee per gas:", tx3.maxFeePerGas);
console.log("Current base fee:", tx3.baseFee);

const canInclude = FeeMarket.canIncludeTx(tx3);
console.log("\nCan include:", canInclude ? "✓ Yes" : "✗ No");
console.log("Reason: maxFeePerGas < baseFee");
console.log("Transaction sits in mempool until base fee drops");

// Scenario 4: Base fee spike during wait
console.log("\n\nScenario 4: Base fee changes while waiting");
console.log("===========================================");

let state: FeeMarket.State = {
	gasUsed: 15_000_000n, // At target
	gasLimit: 30_000_000n,
	baseFee: 30_000_000_000n, // 30 gwei
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

const txWaiting = {
	maxFeePerGas: 35_000_000_000n, // 35 gwei
	maxPriorityFeePerGas: 2_000_000_000n,
	baseFee: state.baseFee,
};

console.log("Initial base fee:", state.baseFee);
console.log("Transaction max fee:", txWaiting.maxFeePerGas);
console.log("Can include:", FeeMarket.canIncludeTx(txWaiting) ? "✓" : "✗");

// Network gets congested
state = { ...state, gasUsed: 29_000_000n }; // 97% full
state = FeeMarket.nextState(state);

console.log("\nAfter congested block:");
console.log("New base fee:", state.baseFee);

const txWaiting2 = { ...txWaiting, baseFee: state.baseFee };
const canInclude2 = FeeMarket.canIncludeTx(txWaiting2);
console.log(
	"Can include:",
	canInclude2 ? "✓ Yes" : "✗ No (base fee rose above max)",
);

// Eventually base fee comes down
state = { ...state, gasUsed: 5_000_000n }; // 17% full
state = FeeMarket.nextState(state);

console.log("\nAfter quiet block:");
console.log("New base fee:", state.baseFee);

const txWaiting3 = { ...txWaiting, baseFee: state.baseFee };
console.log("Can include:", FeeMarket.canIncludeTx(txWaiting3) ? "✓ Yes" : "✗");

// Scenario 5: Priority fee strategies
console.log("\n\nScenario 5: Priority fee strategies");
console.log("====================================");

const strategies = [
	{ name: "No tip (cheap)", maxPriority: 0n },
	{ name: "Low tip", maxPriority: 500_000_000n }, // 0.5 gwei
	{ name: "Normal tip", maxPriority: 2_000_000_000n }, // 2 gwei
	{ name: "High tip (fast)", maxPriority: 5_000_000_000n }, // 5 gwei
];

const networkBaseFee = 40_000_000_000n;

console.log("Network base fee:", networkBaseFee);
console.log("\nStrategy comparison:");

strategies.forEach(({ name, maxPriority }) => {
	const tx = {
		maxFeePerGas: networkBaseFee + maxPriority,
		maxPriorityFeePerGas: maxPriority,
		baseFee: networkBaseFee,
	};

	const fee = FeeMarket.calculateTxFee(tx);
	console.log(`\n${name}:`);
	console.log(`  Priority fee: ${fee.priorityFee}`);
	console.log(`  Effective gas price: ${fee.effectiveGasPrice}`);
});

console.log("\nHigher priority = faster inclusion (validator incentive)");
