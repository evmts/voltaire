import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

const currentBaseFee = 50_000_000_000n; // 50 gwei

const tx1 = {
	maxFeePerGas: 100_000_000_000n, // 100 gwei
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
	baseFee: currentBaseFee,
};

const fee1 = FeeMarket.calculateTxFee(tx1);

const tx2 = {
	maxFeePerGas: 51_000_000_000n, // 51 gwei (close to base)
	maxPriorityFeePerGas: 5_000_000_000n, // Want 5 gwei tip
	baseFee: currentBaseFee,
};

const fee2 = FeeMarket.calculateTxFee(tx2);

const tx3 = {
	maxFeePerGas: 30_000_000_000n, // 30 gwei (below base!)
	maxPriorityFeePerGas: 2_000_000_000n,
	baseFee: currentBaseFee,
};

const canInclude = FeeMarket.canIncludeTx(tx3);

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

// Network gets congested
state = { ...state, gasUsed: 29_000_000n }; // 97% full
state = FeeMarket.nextState(state);

const txWaiting2 = { ...txWaiting, baseFee: state.baseFee };
const canInclude2 = FeeMarket.canIncludeTx(txWaiting2);

// Eventually base fee comes down
state = { ...state, gasUsed: 5_000_000n }; // 17% full
state = FeeMarket.nextState(state);

const txWaiting3 = { ...txWaiting, baseFee: state.baseFee };

const strategies = [
	{ name: "No tip (cheap)", maxPriority: 0n },
	{ name: "Low tip", maxPriority: 500_000_000n }, // 0.5 gwei
	{ name: "Normal tip", maxPriority: 2_000_000_000n }, // 2 gwei
	{ name: "High tip (fast)", maxPriority: 5_000_000_000n }, // 5 gwei
];

const networkBaseFee = 40_000_000_000n;

strategies.forEach(({ name, maxPriority }) => {
	const tx = {
		maxFeePerGas: networkBaseFee + maxPriority,
		maxPriorityFeePerGas: maxPriority,
		baseFee: networkBaseFee,
	};

	const fee = FeeMarket.calculateTxFee(tx);
});
