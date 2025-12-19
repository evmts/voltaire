import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

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
});

let state: FeeMarket.State = {
	gasUsed: 15_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

for (let i = 0; i < 10; i++) {
	state = {
		...state,
		blobGasUsed: FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK,
	};

	const blobBaseFee = FeeMarket.BlobBaseFee(state.excessBlobGas);

	state = FeeMarket.nextState(state);
}

state = {
	gasUsed: 15_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

for (let i = 0; i < 10; i++) {
	state = {
		...state,
		blobGasUsed: FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK, // 6 blobs
	};

	const blobBaseFee = FeeMarket.BlobBaseFee(state.excessBlobGas);

	state = FeeMarket.nextState(state);
}

const blobGasPerBlob = FeeMarket.Eip4844.BLOB_GAS_PER_BLOB;

excessLevels.forEach(({ name, excess }) => {
	const blobBaseFee = FeeMarket.BlobBaseFee(excess);
	const costPerBlob = blobBaseFee * blobGasPerBlob;

	// Convert to ETH (assuming 1e18 wei = 1 ETH)
	const ethCost = Number(costPerBlob) / 1e18;
});
