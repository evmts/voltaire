import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Burned fees and priority tips (EIP-1559)
// Shows how transaction fees are split between burned and tips

console.log("EIP-1559 Fee Burning Mechanism");
console.log("===============================\n");

// Current network state
const baseFee = 50_000_000_000n; // 50 gwei
const gasUsed = 21_000n; // Standard transfer

console.log("Network base fee:", baseFee);
console.log("Transaction gas used:", gasUsed);

// User sets max fees
const maxFeePerGas = 100_000_000_000n; // 100 gwei max willing to pay
const maxPriorityFeePerGas = 2_000_000_000n; // 2 gwei tip

const txParams = {
	maxFeePerGas,
	maxPriorityFeePerGas,
	baseFee,
};

const fee = FeeMarket.calculateTxFee(txParams);

console.log("\nTransaction fee calculation:");
console.log("  Max fee per gas:", maxFeePerGas);
console.log("  Max priority fee:", maxPriorityFeePerGas);
console.log("  Base fee:", baseFee);
console.log("\nResult:");
console.log("  Effective gas price:", fee.effectiveGasPrice);
console.log("  Priority fee (to miner):", fee.priorityFee);
console.log("  Base fee (burned):", fee.baseFee);

// Calculate total fees
const totalPaid = fee.effectiveGasPrice * gasUsed;
const burned = fee.baseFee * gasUsed;
const tipped = fee.priorityFee * gasUsed;

console.log("\nTotal transaction cost:");
console.log("  Total paid:", totalPaid);
console.log("  Burned (removed forever):", burned);
console.log("  Tipped (to validator):", tipped);
console.log(
	"  Burn %:",
	((Number(burned) / Number(totalPaid)) * 100).toFixed(1),
	"%",
);

// Scenario 2: Base fee exceeds user's max
console.log("\n\nScenario 2: Base fee spike");
console.log("==========================");

const highBaseFee = 120_000_000_000n; // 120 gwei (spike!)
const txParams2 = {
	maxFeePerGas,
	maxPriorityFeePerGas,
	baseFee: highBaseFee,
};

console.log("Base fee spikes to:", highBaseFee);
console.log("User's max fee:", maxFeePerGas);
console.log("\nResult: Transaction cannot be included");
console.log("User needs to increase maxFeePerGas or wait");

// Check if transaction can be included
const canInclude = maxFeePerGas >= highBaseFee;
console.log("Can include:", canInclude);

// Scenario 3: Low priority fee
console.log("\n\nScenario 3: Zero priority fee (no tip)");
console.log("=======================================");

const txParams3 = {
	maxFeePerGas: 60_000_000_000n,
	maxPriorityFeePerGas: 0n, // No tip
	baseFee: 50_000_000_000n,
};

const fee3 = FeeMarket.calculateTxFee(txParams3);
const burned3 = fee3.baseFee * gasUsed;
const tipped3 = fee3.priorityFee * gasUsed;

console.log("Effective gas price:", fee3.effectiveGasPrice);
console.log("Priority fee:", fee3.priorityFee);
console.log("\nTotal transaction:");
console.log("  Burned:", burned3);
console.log("  Tipped:", tipped3);
console.log("\n100% of fee is burned, validator gets nothing extra");

// Scenario 4: Generous tip
console.log("\n\nScenario 4: Generous tip for fast inclusion");
console.log("============================================");

const txParams4 = {
	maxFeePerGas: 100_000_000_000n,
	maxPriorityFeePerGas: 20_000_000_000n, // 20 gwei tip!
	baseFee: 50_000_000_000n,
};

const fee4 = FeeMarket.calculateTxFee(txParams4);
const burned4 = fee4.baseFee * gasUsed;
const tipped4 = fee4.priorityFee * gasUsed;

console.log("Max priority fee:", txParams4.maxPriorityFeePerGas);
console.log("Effective gas price:", fee4.effectiveGasPrice);
console.log("\nTotal transaction:");
console.log("  Burned:", burned4);
console.log("  Tipped:", tipped4);
console.log(
	"  Tip %:",
	((Number(tipped4) / Number(burned4 + tipped4)) * 100).toFixed(1),
	"%",
);
console.log("\nValidator prioritizes this transaction");

// Deflationary pressure calculation
console.log("\n\nDeflationary Pressure");
console.log("=====================");

const blocksPerYear = 2_628_000n; // ~12s blocks
const avgGasPerBlock = 15_000_000n; // At target
const avgBaseFee = 30_000_000_000n; // 30 gwei average

const ethBurnedPerBlock =
	(avgGasPerBlock * avgBaseFee) / 1_000_000_000_000_000_000n;
const ethBurnedPerYear = ethBurnedPerBlock * blocksPerYear;

console.log("Assumptions:");
console.log("  Avg gas per block:", avgGasPerBlock);
console.log("  Avg base fee:", avgBaseFee);
console.log("\nETH burned:");
console.log("  Per block:", ethBurnedPerBlock, "ETH");
console.log("  Per year:", ethBurnedPerYear, "ETH");
console.log("\nBase fee burn creates deflationary pressure");
