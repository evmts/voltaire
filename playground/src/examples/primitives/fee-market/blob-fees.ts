import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Blob fees (EIP-4844)
// Separate fee market for blob transactions

console.log("EIP-4844 Blob Fee Market");
console.log("=========================\n");

console.log("Blob constants:");
console.log("  Blob gas per blob:", FeeMarket.Eip4844.BLOB_GAS_PER_BLOB);
console.log("  Target per block:", FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK);
console.log("  Max per block:", FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK);
console.log("  Max blobs per block:", FeeMarket.Eip4844.MAX_BLOBS_PER_BLOCK);
console.log("  Min blob base fee:", FeeMarket.Eip4844.MIN_BLOB_BASE_FEE);

// Calculate blob base fee at different excess levels
console.log("\n\nBlob base fee at different excess levels:");
console.log("=========================================");

const excessLevels = [
	{ name: "No excess (min fee)", excess: 0n },
	{
		name: "At target",
		excess: FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK,
	},
	{
		name: "2x target",
		excess: FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK * 2n,
	},
	{
		name: "5x target",
		excess: FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK * 5n,
	},
	{
		name: "10x target",
		excess: FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK * 10n,
	},
];

excessLevels.forEach(({ name, excess }) => {
	const blobBaseFee = FeeMarket.BlobBaseFee(excess);
	console.log(`${name}:`);
	console.log(`  Excess: ${excess}`);
	console.log(`  Blob base fee: ${blobBaseFee}`);
});

// Simulate blob fee market over time
console.log("\n\nBlob fee market simulation:");
console.log("===========================");

let state: FeeMarket.State = {
	gasUsed: 15_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

console.log("\nScenario: Sustained blob usage at target");
console.log("Block | Blob Gas Used | Excess Blob Gas | Blob Base Fee");
console.log("------|---------------|-----------------|---------------");

for (let i = 0; i < 10; i++) {
	state = {
		...state,
		blobGasUsed: FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK,
	};

	const blobBaseFee = FeeMarket.BlobBaseFee(state.excessBlobGas);
	console.log(
		`${String(i + 1).padStart(5)} | ${String(state.blobGasUsed).padStart(13)} | ${String(state.excessBlobGas).padStart(15)} | ${String(blobBaseFee).padStart(13)}`,
	);

	state = FeeMarket.nextState(state);
}

console.log("\nAt target usage, excess stays at zero, fee stays at minimum");

// Above target usage
console.log("\n\nScenario: Heavy blob usage (max blobs per block)");
console.log("=================================================");

state = {
	gasUsed: 15_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

console.log("Block | Blob Gas Used | Excess Blob Gas | Blob Base Fee");
console.log("------|---------------|-----------------|---------------");

for (let i = 0; i < 10; i++) {
	state = {
		...state,
		blobGasUsed: FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK, // 6 blobs
	};

	const blobBaseFee = FeeMarket.BlobBaseFee(state.excessBlobGas);
	console.log(
		`${String(i + 1).padStart(5)} | ${String(state.blobGasUsed).padStart(13)} | ${String(state.excessBlobGas).padStart(15)} | ${String(blobBaseFee).padStart(13)}`,
	);

	state = FeeMarket.nextState(state);
}

console.log("\nExcess accumulates, blob base fee increases exponentially");

// Calculate cost per blob
console.log("\n\nCost per blob at different excess levels:");
console.log("==========================================");

const blobGasPerBlob = FeeMarket.Eip4844.BLOB_GAS_PER_BLOB;

excessLevels.forEach(({ name, excess }) => {
	const blobBaseFee = FeeMarket.BlobBaseFee(excess);
	const costPerBlob = blobBaseFee * blobGasPerBlob;

	// Convert to ETH (assuming 1e18 wei = 1 ETH)
	const ethCost = Number(costPerBlob) / 1e18;

	console.log(`${name}:`);
	console.log(`  Blob base fee: ${blobBaseFee} wei`);
	console.log(`  Cost per blob: ${costPerBlob} wei`);
	console.log(`  Cost per blob: ${ethCost.toFixed(9)} ETH`);
});

// Independent from regular gas fees
console.log("\n\nIndependent fee markets:");
console.log("========================");
console.log("Regular transactions: Use base fee + priority fee");
console.log("Blob transactions: Use base fee + blob base fee");
console.log("\nBlob fees are separate and independent");
console.log("Allows L2s cheap data availability without competing");
console.log("for regular block space");
