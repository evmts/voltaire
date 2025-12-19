import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Current network state
const baseFee = 50_000_000_000n; // 50 gwei
const gasUsed = 21_000n; // Standard transfer

// User sets max fees
const maxFeePerGas = 100_000_000_000n; // 100 gwei max willing to pay
const maxPriorityFeePerGas = 2_000_000_000n; // 2 gwei tip

const txParams = {
	maxFeePerGas,
	maxPriorityFeePerGas,
	baseFee,
};

const fee = FeeMarket.calculateTxFee(txParams);

// Calculate total fees
const totalPaid = fee.effectiveGasPrice * gasUsed;
const burned = fee.baseFee * gasUsed;
const tipped = fee.priorityFee * gasUsed;

const highBaseFee = 120_000_000_000n; // 120 gwei (spike!)
const txParams2 = {
	maxFeePerGas,
	maxPriorityFeePerGas,
	baseFee: highBaseFee,
};

// Check if transaction can be included
const canInclude = maxFeePerGas >= highBaseFee;

const txParams3 = {
	maxFeePerGas: 60_000_000_000n,
	maxPriorityFeePerGas: 0n, // No tip
	baseFee: 50_000_000_000n,
};

const fee3 = FeeMarket.calculateTxFee(txParams3);
const burned3 = fee3.baseFee * gasUsed;
const tipped3 = fee3.priorityFee * gasUsed;

const txParams4 = {
	maxFeePerGas: 100_000_000_000n,
	maxPriorityFeePerGas: 20_000_000_000n, // 20 gwei tip!
	baseFee: 50_000_000_000n,
};

const fee4 = FeeMarket.calculateTxFee(txParams4);
const burned4 = fee4.baseFee * gasUsed;
const tipped4 = fee4.priorityFee * gasUsed;

const blocksPerYear = 2_628_000n; // ~12s blocks
const avgGasPerBlock = 15_000_000n; // At target
const avgBaseFee = 30_000_000_000n; // 30 gwei average

const ethBurnedPerBlock =
	(avgGasPerBlock * avgBaseFee) / 1_000_000_000_000_000_000n;
const ethBurnedPerYear = ethBurnedPerBlock * blocksPerYear;
