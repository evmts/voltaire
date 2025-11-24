import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Network congestion scenarios
// Shows how fee market responds to demand spikes and recovery

const gasLimit = 30_000_000n;

// Scenario 1: Sudden demand spike
console.log("Scenario 1: NFT mint causes demand spike");
console.log("=========================================\n");

let state: FeeMarket.State = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 1_000_000_000n, // Normal: 1 gwei
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

console.log("Before spike:", state.baseFee);

// 5 blocks of full congestion (100% full)
console.log("\nDuring spike (5 blocks at 100%):");
for (let i = 0; i < 5; i++) {
	state = { ...state, gasUsed: gasLimit };
	state = FeeMarket.nextState(state);
	console.log(`  Block ${i + 1}: ${state.baseFee}`);
}

// Recovery: blocks return to normal (50% target)
console.log("\nRecovery (5 blocks at 50%):");
for (let i = 0; i < 5; i++) {
	state = { ...state, gasUsed: gasLimit / 2n };
	state = FeeMarket.nextState(state);
	console.log(`  Block ${i + 1}: ${state.baseFee}`);
}

// Scenario 2: Sustained high demand
console.log("\n\nScenario 2: Protocol launch (sustained demand)");
console.log("===============================================\n");

state = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

console.log("Starting:", state.baseFee);

// 20 blocks at 75% utilization
console.log("\nSustained 75% utilization (20 blocks):");
for (let i = 0; i < 20; i++) {
	state = { ...state, gasUsed: (gasLimit * 75n) / 100n };
	state = FeeMarket.nextState(state);

	if (i % 4 === 0 || i === 19) {
		console.log(`  Block ${i + 1}: ${state.baseFee}`);
	}
}

// Scenario 3: Low demand period
console.log("\n\nScenario 3: Quiet period (low demand)");
console.log("======================================\n");

state = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 5_000_000_000n, // High starting fee
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

console.log("Starting:", state.baseFee);

// 10 blocks at 10% utilization
console.log("\n10% utilization (10 blocks):");
for (let i = 0; i < 10; i++) {
	state = { ...state, gasUsed: (gasLimit * 10n) / 100n };
	state = FeeMarket.nextState(state);

	if (i % 2 === 0 || i === 9) {
		console.log(`  Block ${i + 1}: ${state.baseFee}`);
	}
}

console.log(
	"\nMinimum floor:",
	FeeMarket.Eip1559.MIN_BASE_FEE,
	"(cannot go below)",
);

// Scenario 4: Oscillating demand
console.log("\n\nScenario 4: Oscillating demand pattern");
console.log("=======================================\n");

state = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

// Alternate between high and low
const pattern = [90n, 20n, 85n, 25n, 90n, 15n];
console.log("Alternating utilization pattern:");
for (let i = 0; i < pattern.length; i++) {
	const utilizationPct = pattern[i];
	state = { ...state, gasUsed: (gasLimit * utilizationPct) / 100n };
	state = FeeMarket.nextState(state);
	console.log(`  Block ${i + 1} (${utilizationPct}%): ${state.baseFee}`);
}

console.log("\nFee market adapts to changing conditions");
